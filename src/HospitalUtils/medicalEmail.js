import nodemailer from "nodemailer";

export const MedicalRecordsEmail = async (user, pdfUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Hospital Team" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Your Medical Prescription and Record",
    html: `
      <p>Dear ${user.name},</p>
      <p>Your medical prescription and record has been securely saved.</p>
      <p>You can download or view it here: <a href="${pdfUrl}" target="_blank">Download PDF</a></p>
      <br/>
      <p>Regards,</p>
      <p>Hospital Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
