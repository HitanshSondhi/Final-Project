import createMedicalRecord from "../HospitalController/Admin Side/medicalRecord.controller.js";
import express from "express";
import upload from "../middleware/upload.js";

const medicalRecordRouter = express.Router();


medicalRecordRouter.post("/create", upload.single("pdfFile"), createMedicalRecord);

export default medicalRecordRouter;
