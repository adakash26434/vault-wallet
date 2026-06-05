import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import passwordsRouter from "./passwords";
import documentsRouter from "./documents";
import financeRouter from "./finance";
import dashboardRouter from "./dashboard";
import extensionRouter from "./extension";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// Public routes — no auth required
router.use(healthRouter);
router.use(authRouter);

// ── All routes below this line require a valid session JWT ─────────────────
router.use(requireAuth);

router.use(passwordsRouter);
router.use(documentsRouter);
router.use(financeRouter);
router.use(dashboardRouter);
router.use(extensionRouter);

export default router;
