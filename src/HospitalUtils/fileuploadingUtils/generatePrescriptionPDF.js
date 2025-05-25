import PDFDocument from "pdfkit";
import axios from "axios";
import fs from "fs";
import path from "path";

export const generatePrescriptionPDF = async (data, filename) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filePath = path.join("uploads", filename);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    try {
      const imageUrl = "https://res.cloudinary.com/dfhcviz9w/image/upload/v1747924300/medical_records_d9uis4.png";
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data);
      doc.image(imageBuffer, 220, 20, { width: 150 });
    } catch (err) {
      console.error("Image error:", err.message);
    }

    doc.moveDown(5);

    doc.font('Helvetica-Bold').fontSize(20).text("eClinic Pro – Prescription", { align: "center", underline: true });
    doc.moveDown();

    doc.font('Helvetica').fontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text(`Doctor: ${sanitize(data.doctorName)}`);
    doc.text(`Patient: ${sanitize(data.patientName)}`);
    doc.text(`Diagnosis: ${sanitize(data.diagnosis)}`);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Notes:");
    doc.font("Helvetica-Oblique").text(sanitize(data.notes));
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(14).text("Prescribed Medicines:");
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12);
    (data.prescriptionDetails || []).forEach((med, index) => {
      const medName = sanitize(med.medicine || "N/A");
      const dosage = sanitize(med.dosage || "N/A");
      const duration = sanitize(med.duration || "N/A");
      doc.text(`${index + 1}. ${medName} – ${dosage}, ${duration}`);
    });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (err) => reject(err));
  });
};

function sanitize(text) {
  return String(text || "").replace(/[^\x00-\x7F]/g, ""); // removes non-ASCII
}
