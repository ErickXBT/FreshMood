import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
  ListCategoriesResponse,
  UpdateCategoryResponse,
} from "@workspace/api-zod";
import { requirePermission } from "../lib/auth";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  res.json(ListCategoriesResponse.parse(categories));
});

router.post("/categories", requirePermission("menu"), async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db
    .insert(categoriesTable)
    .values({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();
  res.status(201).json(category);
});

router.patch("/categories/:id", requirePermission("menu"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = UpdateCategoryParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyResult = UpdateCategoryBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: bodyResult.error.message });
    return;
  }
  const [updated] = await db
    .update(categoriesTable)
    .set(bodyResult.data)
    .where(eq(categoriesTable.id, paramsResult.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(UpdateCategoryResponse.parse(updated));
});

router.delete("/categories/:id", requirePermission("menu"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = DeleteCategoryParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, paramsResult.data.id));
  res.status(204).send();
});

export default router;
