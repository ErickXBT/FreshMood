import { Router, type IRouter } from "express";
import { eq, sql, desc, gte, and, lte, inArray, or } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, adminAccountsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import {
  signToken,
  requireAuth,
  requirePermission,
  requireOwner,
  PERMISSION_KEYS,
} from "../lib/auth";
import {
  CreateStaffBody,
  UpdateStaffBody,
  UpdateStaffParams,
  DeleteStaffParams,
} from "@workspace/api-zod";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminRegisterBody,
  AdminForgotPasswordBody,
  AdminResetPasswordBody,
  GetDashboardSummaryResponse,
  GetTopMenuItemsQueryParams,
  GetTopMenuItemsResponse,
  GetRecentOrdersQueryParams,
  GetRecentOrdersResponse,
  GetRevenueByDayQueryParams,
  GetRevenueByDayResponse,
  GetSalesReportQueryParams,
  GetSalesReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY tidak dikonfigurasi. Fitur email tidak tersedia.");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const LEGACY_USERNAME = "freshmood";
const LEGACY_PASSWORD = "037425";

function buildLoginResult(account: {
  id: number | null;
  username: string;
  role: string;
  permissions: string[] | null;
  name: string | null;
  legacy?: boolean;
}) {
  const isOwner = account.role === "owner";
  const permissions = isOwner ? [...PERMISSION_KEYS] : account.permissions ?? [];
  const token = signToken({
    sub: account.id,
    username: account.username,
    legacy: account.legacy,
  });
  return AdminLoginResponse.parse({
    token,
    username: account.username,
    role: account.role,
    permissions,
    name: account.name,
  });
}

function parseMonthRange(month: string): { start: Date; end: Date } | null {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const mon = parseInt(match[2]);
  const start = new Date(year, mon - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, mon, 1, 0, 0, 0, 0);
  return { start, end };
}

router.post("/admin/reset-data", requireOwner, async (req, res): Promise<void> => {
  const { password } = req.body ?? {};
  if (!password) {
    res.status(400).json({ error: "Password wajib diisi" });
    return;
  }

  // Get username from auth header token (stored as fm-token-{timestamp})
  // Verify against DB accounts first, then legacy
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  // Try to find which account is logged in via username in body or just verify password
  // We verify password against ALL accounts and legacy
  const accounts = await db.select().from(adminAccountsTable);
  let verified = false;
  for (const account of accounts) {
    if (await bcrypt.compare(password, account.passwordHash)) {
      verified = true;
      break;
    }
  }
  if (!verified && password === LEGACY_PASSWORD) {
    verified = true;
  }
  if (!verified) {
    res.status(401).json({ error: "Password salah. Reset dibatalkan." });
    return;
  }

  // Delete all orders (cascade handles order_items and payments)
  const deleted = await db.delete(ordersTable).returning({ id: ordersTable.id });

  res.json({
    message: `Semua data berhasil direset. ${deleted.length} order dihapus.`,
    deletedOrders: deleted.length,
  });
});

router.post("/admin/register", async (req, res): Promise<void> => {
  const parsed = AdminRegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username, email, dan password wajib diisi" });
    return;
  }
  const { username, email, password } = parsed.data;
  if (password.length < 6) {
    res.status(400).json({ error: "Password minimal 6 karakter" });
    return;
  }
  const existing = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.username, username))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Username sudah digunakan" });
    return;
  }
  const existingEmail = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, email))
    .limit(1);
  if (existingEmail.length > 0) {
    res.status(400).json({ error: "Email sudah digunakan" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(adminAccountsTable)
    .values({ username, email, passwordHash, role: "owner" })
    .returning();
  res.json(
    buildLoginResult({
      id: created.id,
      username: created.username,
      role: created.role,
      permissions: created.permissions,
      name: created.name,
    })
  );
});

router.post("/admin/forgot-password", async (req, res): Promise<void> => {
  const parsed = AdminForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email tidak valid" });
    return;
  }
  const { email } = parsed.data;
  const accounts = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, email))
    .limit(1);
  if (accounts.length === 0) {
    res.status(404).json({ error: "Email tidak ditemukan" });
    return;
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db
    .update(adminAccountsTable)
    .set({ resetOtp: otp, resetOtpExpiresAt: expiresAt })
    .where(eq(adminAccountsTable.email, email));
  await getResend().emails.send({
    from: "FreshMood <onboarding@resend.dev>",
    to: email,
    subject: "Kode Reset Password FreshMood",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#FFCC00;font-size:28px;margin:0;">FreshMood</h1>
          <p style="color:#555;margin-top:6px;">Admin Portal</p>
        </div>
        <h2 style="font-size:18px;margin-bottom:8px;">Kode Reset Password</h2>
        <p style="color:#555;font-size:14px;">Masukkan kode berikut untuk reset password kamu:</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#111;">${otp}</span>
        </div>
        <p style="color:#888;font-size:12px;">Kode berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapapun.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="color:#aaa;font-size:11px;text-align:center;">Email ini dikirim otomatis oleh FreshMood. Jika kamu tidak meminta reset password, abaikan email ini.</p>
      </div>
    `,
  });
  res.json({ message: "Kode OTP telah dikirim ke email kamu" });
});

router.post("/admin/reset-password", async (req, res): Promise<void> => {
  const parsed = AdminResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  const { email, otp, newPassword } = parsed.data;
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password baru minimal 6 karakter" });
    return;
  }
  const accounts = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, email))
    .limit(1);
  if (accounts.length === 0) {
    res.status(400).json({ error: "Email tidak ditemukan" });
    return;
  }
  const account = accounts[0];
  if (!account.resetOtp || account.resetOtp !== otp) {
    res.status(400).json({ error: "Kode OTP tidak valid" });
    return;
  }
  if (!account.resetOtpExpiresAt || new Date() > account.resetOtpExpiresAt) {
    res.status(400).json({ error: "Kode OTP sudah kadaluarsa. Minta kode baru." });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(adminAccountsTable)
    .set({ passwordHash, resetOtp: null, resetOtpExpiresAt: null })
    .where(eq(adminAccountsTable.email, email));
  res.json({ message: "Password berhasil direset. Silakan login." });
});

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;

  // Check DB accounts first — match by username OR email (staff log in with email)
  const accounts = await db
    .select()
    .from(adminAccountsTable)
    .where(or(eq(adminAccountsTable.username, username), eq(adminAccountsTable.email, username)))
    .limit(1);
  if (accounts.length > 0) {
    const account = accounts[0];
    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Username atau password salah" });
      return;
    }
    res.json(
      buildLoginResult({
        id: account.id,
        username: account.username,
        role: account.role,
        permissions: account.permissions,
        name: account.name,
      })
    );
    return;
  }

  // Fallback to legacy hardcoded credentials (owner)
  if (username === LEGACY_USERNAME && password === LEGACY_PASSWORD) {
    res.json(
      buildLoginResult({ id: null, username: LEGACY_USERNAME, role: "owner", permissions: null, name: null, legacy: true })
    );
    return;
  }

  res.status(401).json({ error: "Username atau password salah" });
});

router.get("/admin/dashboard-summary", requirePermission("dashboard"), async (req, res): Promise<void> => {
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

router.get("/admin/top-items", requirePermission("dashboard"), async (req, res): Promise<void> => {
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

router.get("/admin/recent-orders", requirePermission("dashboard"), async (req, res): Promise<void> => {
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

router.get("/admin/revenue-by-day", requirePermission("dashboard"), async (req, res): Promise<void> => {
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

function buildReportBuckets(period: string): Array<{ key: string }> {
  const out: Array<{ key: string }> = [];
  const now = new Date();
  if (period === "weekly") {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dow = (today.getUTCDay() + 6) % 7; // 0 = Monday
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - dow);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() - i * 7);
      out.push({ key: d.toISOString().slice(0, 10) });
    }
  } else if (period === "monthly") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      out.push({ key: d.toISOString().slice(0, 7) });
    }
  } else if (period === "yearly") {
    for (let i = 4; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear() - i, 0, 1));
      out.push({ key: d.toISOString().slice(0, 4) });
    }
  } else {
    // daily — last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      out.push({ key: d.toISOString().slice(0, 10) });
    }
  }
  return out;
}

router.get("/admin/sales-report", requirePermission("dashboard"), async (req, res): Promise<void> => {
  const parsed = GetSalesReportQueryParams.safeParse(req.query);
  const period = parsed.success ? parsed.data.period : "daily";

  // truncUnit and fmt come from a fixed whitelist (never user input), so it is
  // safe to inline them. Reusing one expression keeps SELECT and GROUP BY identical.
  const truncUnit =
    period === "yearly" ? "year" : period === "monthly" ? "month" : period === "weekly" ? "week" : "day";
  const fmt = period === "yearly" ? "YYYY" : period === "monthly" ? "YYYY-MM" : "YYYY-MM-DD";
  const truncExpr = sql`date_trunc('${sql.raw(truncUnit)}', ${ordersTable.createdAt} AT TIME ZONE 'UTC')`;

  const rows = await db
    .select({
      key: sql<string>`to_char(${truncExpr}, '${sql.raw(fmt)}')`,
      revenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)::float`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.paymentStatus, "paid"))
    .groupBy(truncExpr);

  const rowMap = new Map(rows.map((r) => [r.key, r]));
  const buckets = buildReportBuckets(period).map((b) => {
    const found = rowMap.get(b.key);
    return { key: b.key, revenue: found?.revenue ?? 0, orderCount: found?.orderCount ?? 0 };
  });

  const totalRevenue = buckets.reduce((s, b) => s + b.revenue, 0);
  const totalOrders = buckets.reduce((s, b) => s + b.orderCount, 0);

  res.json(
    GetSalesReportResponse.parse({
      period,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      buckets,
    })
  );
});

router.get("/admin/item-sales", requirePermission("dashboard"), async (req, res): Promise<void> => {
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

router.get("/admin/payment-summary", requirePermission("payments"), async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const range = month ? parseMonthRange(month) : null;

  const conditions = [];
  if (range) {
    conditions.push(gte(ordersTable.createdAt, range.start));
    conditions.push(lte(ordersTable.createdAt, range.end));
  }

  const rows = await db
    .select({
      paymentMethod: ordersTable.paymentMethod,
      orderCount: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`sum(${ordersTable.total})::float`,
      totalSubtotal: sql<number>`sum(${ordersTable.subtotal})::float`,
      totalTax: sql<number>`sum(${ordersTable.tax})::float`,
      totalServiceFee: sql<number>`sum(${ordersTable.serviceFee})::float`,
    })
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(ordersTable.paymentMethod)
    .orderBy(desc(sql`sum(${ordersTable.total})`));

  const grandTotal = rows.reduce((acc, r) => acc + r.totalRevenue, 0);

  const result = rows.map((r) => ({
    paymentMethod: r.paymentMethod ?? "UNKNOWN",
    orderCount: r.orderCount,
    totalRevenue: r.totalRevenue,
    totalSubtotal: r.totalSubtotal,
    totalTax: r.totalTax,
    totalServiceFee: r.totalServiceFee,
    avgOrderValue: r.orderCount > 0 ? r.totalRevenue / r.orderCount : 0,
    revenueShare: grandTotal > 0 ? (r.totalRevenue / grandTotal) * 100 : 0,
  }));

  res.json(result);
});

router.get("/admin/leaderboard", requirePermission("leaderboard"), async (req, res): Promise<void> => {
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

router.get("/admin/me", requireAuth, async (req, res): Promise<void> => {
  const auth = req.auth!;
  res.json({
    username: auth.username,
    role: auth.role,
    permissions: auth.permissions,
    name: auth.name,
  });
});

// Returns only the list of months that have order data, used to populate the
// month selector shared across the dashboard, payments and leaderboard pages.
// Intentionally exposes NO revenue figures so it can be shared by any logged-in
// staff regardless of their dashboard/payments permissions.
router.get("/admin/monthly-revenue", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM')`,
    })
    .from(ordersTable)
    .groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM')`)
    .orderBy(desc(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM')`));

  res.json(rows);
});

// ---- Staff management (owner only) ----

router.get("/admin/staff", requireOwner, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: adminAccountsTable.id,
      name: adminAccountsTable.name,
      email: adminAccountsTable.email,
      role: adminAccountsTable.role,
      permissions: adminAccountsTable.permissions,
      createdAt: adminAccountsTable.createdAt,
    })
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.role, "staff"))
    .orderBy(desc(adminAccountsTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      permissions: r.permissions ?? [],
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/admin/staff", requireOwner, async (req, res): Promise<void> => {
  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, permissions } = parsed.data;

  const existing = await db
    .select()
    .from(adminAccountsTable)
    .where(or(eq(adminAccountsTable.email, email), eq(adminAccountsTable.username, email)))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email sudah digunakan" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(adminAccountsTable)
    .values({
      username: email,
      email,
      name,
      passwordHash,
      role: "staff",
      permissions,
    })
    .returning();

  res.json({
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    permissions: created.permissions ?? [],
    createdAt: created.createdAt.toISOString(),
  });
});

router.patch("/admin/staff/:id", requireOwner, async (req, res): Promise<void> => {
  const paramsParsed = UpdateStaffParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const bodyParsed = UpdateStaffBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const { id } = paramsParsed.data;
  const { name, password, permissions } = bodyParsed.data;

  const existing = await db
    .select()
    .from(adminAccountsTable)
    .where(and(eq(adminAccountsTable.id, id), eq(adminAccountsTable.role, "staff")))
    .limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "Staf tidak ditemukan" });
    return;
  }

  const updates: Partial<typeof adminAccountsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (permissions !== undefined) updates.permissions = permissions;
  if (password !== undefined && password.length > 0) {
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  const [updated] = await db
    .update(adminAccountsTable)
    .set(updates)
    .where(eq(adminAccountsTable.id, id))
    .returning();

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    permissions: updated.permissions ?? [],
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/staff/:id", requireOwner, async (req, res): Promise<void> => {
  const paramsParsed = DeleteStaffParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const { id } = paramsParsed.data;

  await db
    .delete(adminAccountsTable)
    .where(and(eq(adminAccountsTable.id, id), eq(adminAccountsTable.role, "staff")));

  res.json({ success: true });
});

export default router;
