import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, menuItemsTable, categoriesTable } from "@workspace/db";
import {
  CreateMenuItemBody,
  UpdateMenuItemBody,
  GetMenuItemParams,
  UpdateMenuItemParams,
  DeleteMenuItemParams,
  ListMenuItemsQueryParams,
  ListMenuItemsResponse,
  GetMenuItemResponse,
  UpdateMenuItemResponse,
} from "@workspace/api-zod";
import { requirePermission } from "../lib/auth";

const router: IRouter = Router();

router.get("/menu-items", async (req, res): Promise<void> => {
  const queryResult = ListMenuItemsQueryParams.safeParse(req.query);
  if (!queryResult.success) {
    res.status(400).json({ error: queryResult.error.message });
    return;
  }
  const { categoryId, search, available } = queryResult.data;

  const conditions = [];
  if (categoryId !== undefined) {
    conditions.push(eq(menuItemsTable.categoryId, categoryId));
  }
  if (available !== undefined) {
    conditions.push(eq(menuItemsTable.available, available));
  }
  if (search) {
    conditions.push(ilike(menuItemsTable.name, `%${search}%`));
  }

  const items = await db
    .select({
      id: menuItemsTable.id,
      categoryId: menuItemsTable.categoryId,
      categoryName: categoriesTable.name,
      name: menuItemsTable.name,
      description: menuItemsTable.description,
      price: menuItemsTable.price,
      imageUrl: menuItemsTable.imageUrl,
      available: menuItemsTable.available,
      isBestSeller: menuItemsTable.isBestSeller,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const parsed = items.map((item) => ({
    ...item,
    price: parseFloat(item.price),
  }));

  res.json(ListMenuItemsResponse.parse(parsed));
});

router.post("/menu-items", requirePermission("menu"), async (req, res): Promise<void> => {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .insert(menuItemsTable)
    .values({
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: String(parsed.data.price),
      imageUrl: parsed.data.imageUrl ?? null,
      available: parsed.data.available ?? true,
      isBestSeller: parsed.data.isBestSeller ?? false,
    })
    .returning();

  const [withCategory] = await db
    .select({
      id: menuItemsTable.id,
      categoryId: menuItemsTable.categoryId,
      categoryName: categoriesTable.name,
      name: menuItemsTable.name,
      description: menuItemsTable.description,
      price: menuItemsTable.price,
      imageUrl: menuItemsTable.imageUrl,
      available: menuItemsTable.available,
      isBestSeller: menuItemsTable.isBestSeller,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(eq(menuItemsTable.id, item.id));

  res.status(201).json({ ...withCategory, price: parseFloat(withCategory.price) });
});

router.get("/menu-items/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = GetMenuItemParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [item] = await db
    .select({
      id: menuItemsTable.id,
      categoryId: menuItemsTable.categoryId,
      categoryName: categoriesTable.name,
      name: menuItemsTable.name,
      description: menuItemsTable.description,
      price: menuItemsTable.price,
      imageUrl: menuItemsTable.imageUrl,
      available: menuItemsTable.available,
      isBestSeller: menuItemsTable.isBestSeller,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(eq(menuItemsTable.id, paramsResult.data.id));

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json(GetMenuItemResponse.parse({ ...item, price: parseFloat(item.price) }));
});

router.patch("/menu-items/:id", requirePermission("menu"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = UpdateMenuItemParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyResult = UpdateMenuItemBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: bodyResult.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (bodyResult.data.categoryId !== undefined) updateData.categoryId = bodyResult.data.categoryId;
  if (bodyResult.data.name !== undefined) updateData.name = bodyResult.data.name;
  if (bodyResult.data.description !== undefined) updateData.description = bodyResult.data.description;
  if (bodyResult.data.price !== undefined) updateData.price = String(bodyResult.data.price);
  if (bodyResult.data.imageUrl !== undefined) updateData.imageUrl = bodyResult.data.imageUrl;
  if (bodyResult.data.available !== undefined) updateData.available = bodyResult.data.available;
  if (bodyResult.data.isBestSeller !== undefined) updateData.isBestSeller = bodyResult.data.isBestSeller;

  await db.update(menuItemsTable).set(updateData).where(eq(menuItemsTable.id, paramsResult.data.id));

  const [item] = await db
    .select({
      id: menuItemsTable.id,
      categoryId: menuItemsTable.categoryId,
      categoryName: categoriesTable.name,
      name: menuItemsTable.name,
      description: menuItemsTable.description,
      price: menuItemsTable.price,
      imageUrl: menuItemsTable.imageUrl,
      available: menuItemsTable.available,
      isBestSeller: menuItemsTable.isBestSeller,
    })
    .from(menuItemsTable)
    .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
    .where(eq(menuItemsTable.id, paramsResult.data.id));

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json(UpdateMenuItemResponse.parse({ ...item, price: parseFloat(item.price) }));
});

router.delete("/menu-items/:id", requirePermission("menu"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = DeleteMenuItemParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, paramsResult.data.id));
  res.status(204).send();
});

export default router;
