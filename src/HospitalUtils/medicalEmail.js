import nodemailer from "nodemailer";

export const MedicalRecordsEmail = async (patient, reportFilePath) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"eClinic Pro" <${process.env.EMAIL_USER}>`,
      to: patient.email,
      subject: "Your Medical Report from eClinic Pro",
      text: `Dear ${patient.name},\n\nYour medical report has been generated and is attached to this email.\n\nRegards,\neClinic Pro`,
      attachments: [
        {
          filename: "MedicalReport.pdf",
          path: reportFilePath,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
