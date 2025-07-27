import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (!to || !subject || !html) {
    throw new Error("Missing email to, subject, or HTML content");
  }

  const mailOptions = {
    from: `"eClinic Pro" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments
  };

  console.log(`📧 Sending email to: ${to}`);
  await transporter.sendMail(mailOptions);
  console.log("✅ Email sent.");
};
