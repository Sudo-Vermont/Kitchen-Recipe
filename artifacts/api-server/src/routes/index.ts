import { Router, type IRouter } from "express";
import healthRouter from "./health";
import recipesRouter from "./recipes";
import storageRouter from "./storage";
import videoImportRouter from "./video-import";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(videoImportRouter);
router.use(recipesRouter);

export default router;
