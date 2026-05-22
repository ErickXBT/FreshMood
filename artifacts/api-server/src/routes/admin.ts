import { Router, type IRouter } from "express";
import { eq, sql, desc, gte, and, lte, inArray } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetDashboardSummaryResponse,
  GetTopMenuItemsQueryParams,
  GetTopMenuItemsResponse,
  GetRecentOrdersQueryParams,
  GetRecentOrdersResponse,
  GetRevenueByDayQueryParams,
  GetRevenueByDayResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USERNAME = "freshmood";
const ADMIN_PASSWORD = "037425";

function parseMonthRange(month: string): { start: Date; end: Date } | null {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const mon = parseInt(match[2]);
  const start = new Date(year, mon - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, mon, 1, 0, 0, 0, 0);
  return { start, end };
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.username !== ADMIN_USERNAME || parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.json(
    AdminLoginResponse.parse({
      token: `fm-token-${Date.now()}`,
      username: ADMIN_USERNAME,
    })
  );
});

router.get("/admin/dashboard-summary", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const range = month ? parseMonthRange(month) : null;

  const allOrders = await db.select().from(ordersTable);

  let scopedOrders = allOrders;
  if (range) {
    scopedOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= range.start && new Date(o.createdAt) < range.end
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= today);

  const totalRevenue = scopedOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const revenueToday = range
    ? 0
    : todayOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + parseFloat(o.total), 0);

  const byStatus = (status: string) => scopedOrders.filter((o) => o.status === status).length;
  const avgOrderValue =
    scopedOrders.length > 0
      ? scopedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0) / scopedOrders.length
      : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalOrders: scopedOrders.length,
      totalRevenue,
      ordersToday: range ? scopedOrders.length : todayOrders.length,
      revenueToday,
      pendingOrders: byStatus("pending") + byStatus("confirmed"),
      preparingOrders: byStatus("preparing"),
      completedOrders: byStatus("completed"),
      averageOrderValue: avgOrderValue,
    })
  );
});

router.get("/admin/top-items", async (req, res): Promise<void> => {
  const queryResult = GetTopMenuItemsQueryParams.safeParse(req.query);
  const limit = queryResult.success ? (queryResult.data.limit ?? 10) : 10;
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const range = month ? parseMonthRange(month) : null;

  let orderIdFilter: number[] | null = null;
  if (range) {
    const ordersInRange = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(gte(ordersTable.createdAt, range.start), lte(ordersTable.createdAt, range.end)));
    orderIdFilter = ordersInRange.map((o) => o.id);
    if (orderIdFilter.length === 0) {
      res.json(GetTopMenuItemsResponse.parse([]));
      return;
    }
  }

  const rows = await db
    .select({
      menuItemId: orderItemsTable.menuItemId,
      name: orderItemsTable.menuItemName,
      imageUrl: orderItemsTable.menuItemImageUrl,
      orderCount: sql<number>`count(*)::int`,
      revenue: sql<number>`sum(${orderItemsTable.subtotal})::float`,
    })
    .from(orderItemsTable)
    .where(orderIdFilter ? inArray(orderItemsTable.orderId, orderIdFilter) : undefined)
    .groupBy(orderItemsTable.menuItemId, orderItemsTable.menuItemName, orderItemsTable.menuItemImageUrl)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  res.json(GetTopMenuItemsResponse.parse(rows));
});

router.get("/admin/recent-orders", async (req, res): Promise<void> => {
  const queryResult = GetRecentOrdersQueryParams.safeParse(req.query);
  const limit = queryResult.success ? (queryResult.data.limit ?? 20) : 20;

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
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
    })
  );

  res.json(GetRecentOrdersResponse.parse(ordersWithItems));
});

router.get("/admin/revenue-by-day", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const range = month ? parseMonthRange(month) : null;

  if (range) {
    const rows = await db
      .select({
        date: sql<string>`date(${ordersTable.createdAt})::text`,
        revenue: sql<number>`sum(${ordersTable.total})::float`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.createdAt, range.start),
          lte(ordersTable.createdAt, range.end),
          eq(ordersTable.paymentStatus, "paid")
        )
      )
      .groupBy(sql`date(${ordersTable.createdAt})`)
      .orderBy(sql`date(${ordersTable.createdAt})`);

    // Fill all days in the month
    const result: Array<{ date: string; revenue: number; orderCount: number }> = [];
    const daysInMonth = new Date(range.end.getTime() - 1).getDate();
    const [year, mon] = month!.split("-").map(Number);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const found = rows.find((r) => r.date === dateStr);
      result.push(found ?? { date: dateStr, revenue: 0, orderCount: 0 });
    }

    res.json(GetRevenueByDayResponse.parse(result));
    return;
  }

  // Default: last N days
  const queryResult = GetRevenueByDayQueryParams.safeParse(req.query);
  const days = queryResult.success ? (queryResult.data.days ?? 7) : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`date(${ordersTable.createdAt})::text`,
      revenue: sql<number>`sum(${ordersTable.total})::float`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, since), eq(ordersTable.paymentStatus, "paid")))
    .groupBy(sql`date(${ordersTable.createdAt})`)
    .orderBy(sql`date(${ordersTable.createdAt})`);

  const result: Array<{ date: string; revenue: number; orderCount: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = rows.find((r) => r.date === dateStr);
    result.push(found ?? { date: dateStr, revenue: 0, orderCount: 0 });
  }

  res.json(GetRevenueByDayResponse.parse(result));
});

router.get("/admin/item-sales", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const range = month ? parseMonthRange(month) : null;

  // Get all menu items
  const allItems = await db.select().from(menuItemsTable);

  // Get sales aggregated per menuItemId (with optional month filter)
  let orderIdFilter: number[] | null = null;
  if (range) {
    const ordersInRange = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(gte(ordersTable.createdAt, range.start), lte(ordersTable.createdAt, range.end)));
    orderIdFilter = ordersInRange.map((o) => o.id);
    if (orderIdFilter.length === 0) {
      const result = allItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        imageUrl: item.imageUrl ?? null,
        price: parseFloat(item.price),
        qtySold: 0,
        revenue: 0,
        orderCount: 0,
      }));
      res.json(result);
      return;
    }
  }

  const salesRows = await db
    .select({
      menuItemId: orderItemsTable.menuItemId,
      qtySold: sql<number>`sum(${orderItemsTable.quantity})::int`,
      revenue: sql<number>`sum(${orderItemsTable.subtotal})::float`,
      orderCount: sql<number>`count(distinct ${orderItemsTable.orderId})::int`,
    })
    .from(orderItemsTable)
    .where(orderIdFilter ? inArray(orderItemsTable.orderId, orderIdFilter) : undefined)
    .groupBy(orderItemsTable.menuItemId)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`));

  const salesMap = new Map(salesRows.map((r) => [r.menuItemId, r]));

  const result = allItems
    .map((item) => {
      const sales = salesMap.get(item.id);
      return {
        menuItemId: item.id,
        name: item.name,
        imageUrl: item.imageUrl ?? null,
        price: parseFloat(item.price),
        qtySold: sales?.qtySold ?? 0,
        revenue: sales?.revenue ?? 0,
        orderCount: sales?.orderCount ?? 0,
      };
    })
    .sort((a, b) => b.qtySold - a.qtySold);

  res.json(result);
});

router.get("/admin/leaderboard", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const range = month ? parseMonthRange(month) : null;

  const conditions = [];
  if (range) {
    conditions.push(gte(ordersTable.createdAt, range.start));
    conditions.push(lte(ordersTable.createdAt, range.end));
  }

  const rows = await db
    .select({
      customerName: ordersTable.customerName,
      customerPhone: ordersTable.customerPhone,
      totalSpent: sql<number>`sum(${ordersTable.total})::float`,
      orderCount: sql<number>`count(*)::int`,
      lastOrderAt: sql<string>`max(${ordersTable.createdAt})::text`,
    })
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(ordersTable.customerName, ordersTable.customerPhone)
    .orderBy(desc(sql`sum(${ordersTable.total})`));

  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  res.json(ranked);
});

router.get("/admin/monthly-revenue", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`sum(${ordersTable.total})::float`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM')`)
    .orderBy(desc(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM')`));

  res.json(rows);
});

export default router;
