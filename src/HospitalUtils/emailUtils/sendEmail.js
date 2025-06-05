import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email with or without attachments
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {Array} [options.attachments] - Array of {filename, path}
 */
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
