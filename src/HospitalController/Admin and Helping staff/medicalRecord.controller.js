import { MedicalRecord } from "../../HospitalModel/MedicalRecord.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { sendEmail } from "../../HospitalUtils/emailUtils/sendEmail.js";
import { PDFGenerator } from "../../HospitalUtils/fileuploadingUtils/generatePrescriptionPDF.js";
import { agenda } from "../../jobs/agenda.js";

// export const createMedicalRecord = asynchandler(async (req, res) => {
//   const {
//     patientId,
//     patientName,
//     doctorId,
//     doctorName,
//     diagnosis,
//     notes,
//     prescriptionDetails,
//     amount,
//     email,
//   } = req.body;

//   let prescriptionPdfUrl = null;

//   if (req.file) {
//     // Upload manually provided PDF
//     const cloudRes = await uploadOnCloudinary(req.file.path);
//     if (!cloudRes?.secure_url) {
//       return res.status(500).json({ message: "Cloudinary upload failed" });
//     }
//     prescriptionPdfUrl = cloudRes.secure_url;
//   } else {
//     // Generate prescription PDF from HTML
//     const html = buildPrescriptionHTML({
//       doctorName,
//       patientName,
//       diagnosis,
//       notes,
//       prescriptionDetails: JSON.parse(prescriptionDetails),
//     });

//     const filename = `${Date.now()}_prescription.pdf`;

//     prescriptionPdfUrl = await PDFGenerator.generate({
//       html,
//       filename,
//       folder: "prescriptions"
//     });
//   }

//   const newRecord = new MedicalRecord({
//     patient: patientId,
//     doctor: doctorId,
//     diagnosis,
//     notes,
//     prescriptionDetails: prescriptionDetails
//       ? JSON.parse(prescriptionDetails)
//       : {},
//     pdfUrl: prescriptionPdfUrl,
//     bill: { amount },
//   });

//   await newRecord.save();

//   await sendEmail({
//     to: email,
//     subject: "Your eClinic Pro Medical Prescription",
//     html: `
//       <h3>Hello ${patientName},</h3>
//       <p>Your medical prescription from Dr. ${doctorName} has been generated.</p>
//       <p>Click the button below to view/download your document:</p>
//       <a href="${prescriptionPdfUrl}" style="display:inline-block;padding:10px 20px;margin:10px 0;background-color:#007BFF;color:white;border-radius:5px;text-decoration:none;">Download Prescription</a>
//       <p>Stay healthy,<br>eClinic Pro Team</p>
//     `,
//     attachments: [
//       {
//         filename: "prescription.pdf",
//         path: prescriptionPdfUrl,
//       }
//     ]
//   });

//   res.status(201).json({
//     message: "Medical record saved and email sent successfully.",
//     data: newRecord,
//   });
// });

// // 🔧 Local helper to build prescription HTML
// function buildPrescriptionHTML({ doctorName, patientName, diagnosis, notes, prescriptionDetails }) {
//   const sanitize = (text) => String(text || "").replace(/[^\x00-\x7F]/g, "");

//   const medicines = (prescriptionDetails || []).map((med, i) => {
//     return `
//       <tr>
//         <td>${i + 1}</td>
//         <td>${sanitize(med.medicine || "N/A")}</td>
//         <td>${sanitize(med.dosage || "N/A")}</td>
//         <td>${sanitize(med.duration || "N/A")}</td>
//       </tr>
//     `;
//   }).join("");

//   return `
//   <html>
//     <head>
//       <style>
//         body {
//           font-family: 'Arial', sans-serif;
//           padding: 40px;
//           margin: 0;
//           font-size: 14px;
//           line-height: 1.5;
//         }

//         .header {
//           text-align: center;
//           border-bottom: 1px solid #ccc;
//           padding-bottom: 10px;
//         }

//         .logo {
//           height: 60px;
//         }

//         .hospital-info {
//           text-align: center;
//           margin-top: 5px;
//           font-size: 12px;
//           color: #444;
//         }

//         .section {
//           margin-top: 30px;
//         }

//         .section-title {
//           font-weight: bold;
//           text-decoration: underline;
//           margin-bottom: 10px;
//         }

//         .info-table td {
//           padding: 4px 10px;
//         }

//         .meds-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-top: 10px;
//         }

//         .meds-table th, .meds-table td {
//           border: 1px solid #ccc;
//           padding: 8px;
//           text-align: left;
//         }

//         .footer {
//           margin-top: 40px;
//           font-size: 11px;
//           color: #777;
//           text-align: center;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="header">
//         <img src="https://res.cloudinary.com/dfhcviz9w/image/upload/v1747924300/medical_records_d9uis4.png" class="logo" />
//         <h2>eClinic Pro – Prescription</h2>
//         <div class="hospital-info">
//           123 Health Ave, Wellness City, IN 302019<br>
//           Phone: +91-9876543210 | Email: contact@eclinicpro.in
//         </div>
//       </div>

//       <div class="section">
//         <table class="info-table">
//           <tr>
//             <td><strong>Date:</strong></td>
//             <td>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</td>
//           </tr>
//           <tr>
//             <td><strong>Doctor:</strong></td>
//             <td>Dr. ${sanitize(doctorName)}</td>
//           </tr>
//           <tr>
//             <td><strong>Patient:</strong></td>
//             <td>${sanitize(patientName)}</td>
//           </tr>
//           <tr>
//             <td><strong>Diagnosis:</strong></td>
//             <td>${sanitize(diagnosis)}</td>
//           </tr>
//         </table>
//       </div>

//       <div class="section">
//         <div class="section-title">Notes:</div>
//         <p><em>${sanitize(notes)}</em></p>
//       </div>

//       <div class="section">
//         <div class="section-title">Prescribed Medicines:</div>
//         <table class="meds-table">
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Medicine</th>
//               <th>Dosage</th>
//               <th>Duration</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${medicines}
//           </tbody>
//         </table>
//       </div>

//       <div class="footer">
//         This prescription was generated electronically by eClinic Pro – Digital Healthcare Suite.
//       </div>
//     </body>
//   </html>
//   `;
// }

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

  // 1. Create the initial medical record without the PDF URL
  const newRecord = new MedicalRecord({
    patient: patientId,
    doctor: doctorId,
    diagnosis,
    notes,
    prescriptionDetails: prescriptionDetails
      ? JSON.parse(prescriptionDetails)
      : {},
    pdfUrl: null, // This will be updated by the background job
    bill: { amount },
  });

  await newRecord.save();

  // 2. Schedule the background job
  await agenda.now('generate-and-send-prescription', {
    recordId: newRecord._id,
    patientName,
    doctorName,
    diagnosis,
    notes,
    prescriptionDetails: prescriptionDetails ? JSON.parse(prescriptionDetails) : {},
    email,
  });

  // 3. Respond to the user immediately
  res.status(202).json({
    message: "Medical record is being processed and will be sent via email shortly.",
    data: newRecord,
  });
});