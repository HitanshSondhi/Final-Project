import express from "express";
import upload from "../middleware/upload.js";
import { createMedicalRecord } from "../HospitalController/medicalRecord.controller.js";

const medicalRecordRouter = express.Router();

// Accept either file upload or manual form
medicalRecordRouter.post("/create", upload.single("pdfFile"), createMedicalRecord);

export default medicalRecordRouter;
