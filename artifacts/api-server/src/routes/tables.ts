import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tablesTable } from "@workspace/db";
import {
  CreateTableBody,
  GetTableParams,
  ListTablesResponse,
  GetTableResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tables", async (_req, res): Promise<void> => {
  const tables = await db.select().from(tablesTable).orderBy(tablesTable.tableNumber);
  res.json(ListTablesResponse.parse(tables));
});

router.post("/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const qrCode = `/menu?table=${parsed.data.tableNumber}`;
  const [table] = await db
    .insert(tablesTable)
    .values({
      tableNumber: parsed.data.tableNumber,
      qrCode,
      label: parsed.data.label ?? null,
    })
    .returning();
  res.status(201).json(table);
});

router.get("/tables/:tableNumber", async (req, res): Promise<void> => {
  const rawNum = Array.isArray(req.params.tableNumber) ? req.params.tableNumber[0] : req.params.tableNumber;
  const paramsResult = GetTableParams.safeParse({ tableNumber: parseInt(rawNum, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid tableNumber" });
    return;
  }
  const [table] = await db
    .select()
    .from(tablesTable)
    .where(eq(tablesTable.tableNumber, paramsResult.data.tableNumber));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(GetTableResponse.parse(table));
});

export default router;
