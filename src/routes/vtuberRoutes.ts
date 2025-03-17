import { Router } from "express";
import { getDeathsData, getBossData } from "../controller/vtuberControllers";

const router = Router();

router.get("/deaths", getDeathsData);
router.get("/boss", getBossData);


export default router;
