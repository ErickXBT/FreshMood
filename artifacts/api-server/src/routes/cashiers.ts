import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { cashiersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAnyPermission, requirePermission } from "../lib/auth";

const router: IRouter = Router();

// Viewing the cashier list and switching who is on duty is part of the kasir
// flow (the switch-cashier dialog) as well as the Karyawan page, so it requires
// either the kasir or employees permission (owner always passes).
const requireCashierRead = requireAnyPermission(["employees", "kasir"]);

// Creating and deleting cashier records is an employee-management action, so it
// requires the employees permission (owner always passes). A kasir-only user
// can switch the active cashier but cannot edit the roster.
const requireCashierManage = requirePermission("employees");

router.get("/admin/cashiers", requireCashierRead, async (_req, res): Promise<void> => {
  const cashiers = await db.select().from(cashiersTable).orderBy(cashiersTable.createdAt);
  res.json(cashiers);
});

// Public: customer-facing pages display the active cashier name on receipts.
router.get("/admin/cashiers/active", async (_req, res): Promise<void> => {
  const active = await db
    .select()
    .from(cashiersTable)
    .where(eq(cashiersTable.isActive, true))
    .limit(1);
  res.json(active[0] ?? null);
});

router.post("/admin/cashiers/activate", requireCashierRead, async (req, res): Promise<void> => {
  const { cashierId } = req.body ?? {};
  await db.update(cashiersTable).set({ isActive: false });
  if (cashierId != null) {
    await db
      .update(cashiersTable)
      .set({ isActive: true })
      .where(eq(cashiersTable.id, Number(cashierId)));
    const [active] = await db
      .select()
      .from(cashiersTable)
      .where(eq(cashiersTable.id, Number(cashierId)))
      .limit(1);
    res.json(active ?? null);
    return;
  }
  res.json(null);
});

router.post("/admin/cashiers", requireCashierManage, async (req, res): Promise<void> => {
  const name = req.body?.name?.trim();
  if (!name) {
    res.status(400).json({ error: "Nama kasir wajib diisi" });
    return;
  }
  const [cashier] = await db
    .insert(cashiersTable)
    .values({ name, isActive: false })
    .returning();
  res.json(cashier);
});

router.delete("/admin/cashiers/:id", requireCashierManage, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.update(cashiersTable).set({ isActive: false }).where(eq(cashiersTable.id, id));
  await db.delete(cashiersTable).where(eq(cashiersTable.id, id));
  res.json({ message: "Kasir dihapus" });
});

export default router;
