import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import menuItemsRouter from "./menu-items";
import tablesRouter from "./tables";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(menuItemsRouter);
router.use(tablesRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;
