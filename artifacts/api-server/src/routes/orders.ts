import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, cashiersTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  ListOrdersQueryParams,
  ListOrdersResponse,
  GetOrderResponse,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { hasPermission, requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  return {
    ...order,
    subtotal: parseFloat(order.subtotal),
    tax: parseFloat(order.tax),
    serviceFee: parseFloat(order.serviceFee),
    total: parseFloat(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice),
      subtotal: parseFloat(i.subtotal),
    })),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const queryResult = ListOrdersQueryParams.safeParse(req.query);
  if (!queryResult.success) {
    res.status(400).json({ error: queryResult.error.message });
    return;
  }
  const { status, tableNumber, limit } = queryResult.data;

  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (tableNumber !== undefined) conditions.push(eq(ordersTable.tableNumber, tableNumber));

  let query = db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  if (limit) {
    query = query.limit(limit) as typeof query;
  }

  const orders = await query;
  const ordersWithItems = await Promise.all(orders.map((o) => getOrderWithItems(o.id)));
  res.json(ListOrdersResponse.parse(ordersWithItems.filter(Boolean)));
});

router.post("/orders", async (req, res): Promise<void> => {
  // Authenticated staff need the "kasir" permission. Unauthenticated customer
  // orders (no token) pass through untouched.
  if (req.auth && !hasPermission(req.auth, "kasir")) {
    res.status(403).json({ error: "Kamu tidak memiliki akses ke kasir." });
    return;
  }
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tableNumber, customerName, customerPhone, notes, orderType, deliveryAddress, deliveryFee: requestedDeliveryFee, paymentMethod, items } = parsed.data;

  // Read active cashier
  const [activeCashier] = await db
    .select()
    .from(cashiersTable)
    .where(eq(cashiersTable.isActive, true))
    .limit(1);
  const cashierName = activeCashier?.name ?? null;

  // Calculate prices
  let subtotal = 0;
  const enrichedItems: Array<{
    menuItemId: number;
    menuItemName: string;
    menuItemImageUrl: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes: string | null;
  }> = [];

  for (const item of items) {
    const [menuItem] = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, item.menuItemId));
    if (!menuItem) {
      res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
      return;
    }
    const unitPrice = parseFloat(menuItem.price);
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;
    enrichedItems.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      menuItemImageUrl: menuItem.imageUrl ?? null,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      notes: item.notes ?? null,
    });
  }

  const tax = 0;
  // For delivery orders: use the fee the customer selected (0 = free, 5000 = paid).
  // Only allow the two valid values; default to 0 for non-delivery orders.
  const ALLOWED_DELIVERY_FEES = [0, 5000];
  const serviceFee =
    orderType === "delivery" && requestedDeliveryFee !== undefined
      ? ALLOWED_DELIVERY_FEES.includes(requestedDeliveryFee) ? requestedDeliveryFee : 0
      : 0;
  const total = subtotal + tax + serviceFee;

  const [order] = await db
    .insert(ordersTable)
    .values({
      tableNumber: tableNumber ?? null,
      customerName,
      customerPhone: customerPhone ?? null,
      notes: notes ?? null,
      orderType: orderType ?? "dine_in",
      deliveryAddress: deliveryAddress ?? null,
      status: "pending",
      cashierName,
      subtotal: String(subtotal),
      tax: String(tax),
      serviceFee: String(serviceFee),
      total: String(total),
      paymentMethod: paymentMethod ?? null,
      paymentStatus: "unpaid",
    })
    .returning();

  await db.insert(orderItemsTable).values(
    enrichedItems.map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      menuItemImageUrl: item.menuItemImageUrl,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      subtotal: String(item.subtotal),
      notes: item.notes,
    }))
  );

  const fullOrder = await getOrderWithItems(order.id);
  res.status(201).json(fullOrder);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = GetOrderParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const order = await getOrderWithItems(paramsResult.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse(order));
});

router.patch("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = UpdateOrderStatusParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyResult = UpdateOrderStatusBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: bodyResult.error.message });
    return;
  }
  // Cancelling a transaction requires the "cancel_transactions" permission for
  // authenticated staff. Other status changes (e.g. kitchen flow) pass through.
  if (
    bodyResult.data.status === "cancelled" &&
    !hasPermission(req.auth!, "cancel_transactions")
  ) {
    res.status(403).json({ error: "Kamu tidak memiliki akses untuk membatalkan transaksi." });
    return;
  }
  const updateData: Record<string, unknown> = { status: bodyResult.data.status };
  if (bodyResult.data.estimatedMinutes !== undefined) {
    updateData.estimatedMinutes = bodyResult.data.estimatedMinutes;
  }

  await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, paramsResult.data.id));

  const order = await getOrderWithItems(paramsResult.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(UpdateOrderStatusResponse.parse(order));
});

export default router;
