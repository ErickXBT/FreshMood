import { Router, type IRouter } from "express";
import { eq, sql, desc, gte, and } from "drizzle-orm";
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

router.get("/admin/dashboard-summary", async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= today);

  const totalRevenue = allOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const revenueToday = todayOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const byStatus = (status: string) => allOrders.filter((o) => o.status === status).length;
  const avgOrderValue =
    allOrders.length > 0 ? allOrders.reduce((sum, o) => sum + parseFloat(o.total), 0) / allOrders.length : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalOrders: allOrders.length,
      totalRevenue,
      ordersToday: todayOrders.length,
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

  const rows = await db
    .select({
      menuItemId: orderItemsTable.menuItemId,
      name: orderItemsTable.menuItemName,
      imageUrl: orderItemsTable.menuItemImageUrl,
      orderCount: sql<number>`count(*)::int`,
      revenue: sql<number>`sum(${orderItemsTable.subtotal})::float`,
    })
    .from(orderItemsTable)
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

  // Fill missing days with zero
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

export default router;
