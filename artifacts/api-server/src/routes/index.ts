import { Router, type IRouter } from "express";
import healthRouter from "./health";
import passwordsRouter from "./passwords";
import documentsRouter from "./documents";
import financeRouter from "./finance";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(passwordsRouter);
router.use(documentsRouter);
router.use(financeRouter);
router.use(dashboardRouter);

export default router;
