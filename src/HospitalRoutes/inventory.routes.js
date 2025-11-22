import { Router } from "express";
import { verifyJWT } from "../middleware/authentication.js";
import { receiveStock, createProduct, checkReorder, checkExpiry } from "../HospitalController/Inventory/Inventory.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/products", createProduct);
router.post("/receive", receiveStock);
router.get("/reorder", checkReorder);
router.get("/expiry", checkExpiry);

export default router;
