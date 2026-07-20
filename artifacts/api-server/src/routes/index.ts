import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portfolioAuthRouter from "./portfolio-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portfolioAuthRouter);

export default router;
