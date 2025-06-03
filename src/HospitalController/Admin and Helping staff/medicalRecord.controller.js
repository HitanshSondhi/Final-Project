import fs from "fs";
import { MedicalRecord } from "../../HospitalModel/MedicalRecord.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { MedicalRecordsEmail } from "../../HospitalUtils/emailUtils/medicalEmail.js";
import { uploadOnCloudinary } from "../../HospitalUtils/fileuploadingUtils/cloudinary.js";
import { generatePrescriptionPDF } from "../../HospitalUtils/fileuploadingUtils/generatePrescriptionPDF.js";

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

  
  if (req.file) {
    localFilePath = req.file.path;
  } else {
   
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

  
  const cloudRes = await uploadOnCloudinary(localFilePath);
  if (!cloudRes?.secure_url) {
    return res.status(500).json({ message: "Cloudinary upload failed" });
  }

  
  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }

  
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

  
  await MedicalRecordsEmail(
  { name: patientName, email: email },
  cloudRes.secure_url  
);

  res.status(201).json({
    message: "Medical record saved and email sent successfully.",
    data: newRecord,
  });
});
