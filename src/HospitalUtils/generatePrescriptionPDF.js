import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePrescriptionPDF = (data, filename) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filePath = path.join("uploads", filename);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(18).text("eClinic Pro – Prescription", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Doctor: ${data.doctorName}`);
    doc.text(`Patient: ${data.patientName}`);
    doc.text(`Diagnosis: ${data.diagnosis}`);
    doc.text(`Notes: ${data.notes}`);
    doc.moveDown();

    doc.fontSize(14).text("Prescription:");
    for (let item of data.prescriptionDetails || []) {
      doc.text(`- ${item.medicine} | ${item.dosage} | ${item.duration}`);
    }

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
};
