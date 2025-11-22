import { Router } from "express";
import { verifyJWT } from "../middleware/authentication.js";
import { getAuditLogs, getStockValuation } from "../HospitalController/Admin/Admin.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/audit-logs", getAuditLogs);
router.get("/stock-valuation", getStockValuation);

export default router;
