import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, ordersTable } from "@workspace/db";
import {
  CreatePaymentBody,
  GetPaymentParams,
  GetPaymentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      orderId: parsed.data.orderId,
      method: parsed.data.method,
      amount: String(parsed.data.amount),
      status: "completed",
      referenceCode: parsed.data.referenceCode ?? null,
    })
    .returning();

  // Update order payment status
  await db
    .update(ordersTable)
    .set({ paymentStatus: "paid", paymentMethod: parsed.data.method })
    .where(eq(ordersTable.id, parsed.data.orderId));

  res.status(201).json({
    ...payment,
    amount: parseFloat(payment.amount),
    createdAt: payment.createdAt.toISOString(),
  });
});

router.get("/payments/:orderId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const paramsResult = GetPaymentParams.safeParse({ orderId: parseInt(rawId, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid orderId" });
    return;
  }
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, paramsResult.data.orderId));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(
    GetPaymentResponse.parse({
      ...payment,
      amount: parseFloat(payment.amount),
      createdAt: payment.createdAt.toISOString(),
    })
  );
});

export default router;
