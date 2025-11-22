import { Router } from "express";
import { verifyJWT } from "../middleware/authentication.js";
import { sendToPharmacy, getPharmacyQueue, dispensePrescription } from "../HospitalController/Pharmacy/Pharmacy.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/send", sendToPharmacy); // Doctor sends
router.get("/queue", getPharmacyQueue); // Pharmacist views
router.post("/dispense/:prescriptionId", dispensePrescription); // Pharmacist dispenses

export default router;
