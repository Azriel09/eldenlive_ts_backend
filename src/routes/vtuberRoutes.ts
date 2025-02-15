import { Router } from "express";
import { getVtubers } from "../controller/vtuberControllers";

const router = Router();

router.get("/vtubers", getVtubers);

export default router;
