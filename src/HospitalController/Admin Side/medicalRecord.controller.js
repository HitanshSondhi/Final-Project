import { MedicalRecord } from "../../HospitalModel/MedicalRecord.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { sendEmail } from "../../HospitalUtils/emailUtils/sendEmail.js";
import { PDFGenerator } from "../../HospitalUtils/fileuploadingUtils/generatePrescriptionPDF.js";
import { letterQueue } from "../../jobs/letter.queue.js";

// import { agenda } from "../../jobs/agenda.js";

 const createMedicalRecord = asynchandler(async (req, res) => {
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

  
  const newRecord = new MedicalRecord({
    patient: patientId,
    doctor: doctorId,
    diagnosis,
    notes,
    prescriptionDetails: prescriptionDetails
      ? JSON.parse(prescriptionDetails)
      : {},
    pdfUrl: null, 
    bill: { amount },
  });

  await newRecord.save();

  
 await letterQueue.add("generate-and-send-prescription", {
    recordId: newRecord._id,
    patientName,
    doctorName,
    diagnosis,
    notes,
    prescriptionDetails: prescriptionDetails
      ? JSON.parse(prescriptionDetails)
      : {},
    email,
  });

  
  res.status(202).json({
    message: "Medical record is being processed and will be sent via email shortly.",
    data: newRecord,
  });
});
export default createMedicalRecord;