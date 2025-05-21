import fs from "fs";
import { MedicalRecord } from "../HospitalModel/MedicalRecord.js";
import { asynchandler } from "../HospitalUtils/asynchandler.js";
import { uploadOnCloudinary } from "../HospitalUtils/fileuploadingUtils/cloudinary.js";
import { generatePrescriptionPDF } from "../HospitalUtils/generatePrescriptionPDF.js";
import { MedicalRecordsEmail } from "../HospitalUtils/medicalEmail.js";

export const createMedicalRecord = asynchandler(async (req, res) => {
  const {
    patientId,
    patientName,
    doctorId,
    doctorName,
    diagnosis,
    notes,
    prescriptionDetails,
    amount,
    email,
  } = req.body;

  let localFilePath = null;

  // ✅ CASE 1: File is uploaded by doctor (skip PDF generation)
  if (req.file) {
    localFilePath = req.file.path;
  } else {
    // ✅ CASE 2: Manual fill-up – generate PDF
    const filename = `${Date.now()}_prescription.pdf`;
    localFilePath = await generatePrescriptionPDF(
      {
        doctorName,
        patientName,
        diagnosis,
        notes,
        prescriptionDetails: JSON.parse(prescriptionDetails),
      },
      filename
    );
  }

  // ✅ Upload to Cloudinary
  const cloudRes = await uploadOnCloudinary(localFilePath);
  if (!cloudRes?.secure_url) {
    return res.status(500).json({ message: "Cloudinary upload failed" });
  }

  // Delete local file after upload
  if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

  // ✅ Save record
  const newRecord = new MedicalRecord({
    patient: patientId,
    doctor: doctorId,
    diagnosis,
    notes,
    prescriptionDetails: prescriptionDetails
      ? JSON.parse(prescriptionDetails)
      : {},
    pdfUrl: cloudRes.secure_url,
    bill: { amount },
  });

  await newRecord.save();

  // ✅ Send Email
  await MedicalRecordsEmail(
    { name: patientName, email: email },
    localFilePath // or cloud URL
  );

  res
    .status(201)
    .json({ message: "Record saved and email sent.", data: newRecord });
});
