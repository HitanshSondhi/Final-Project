import nodemailer from "nodemailer";

export const sendEmail = async (to, name) => {
  if (!to) {
    console.error("❌ Email recipient is missing.");
    throw new Error("Recipient email address is required.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Hospital Admin" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Welcome to eClinic Pro!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
        <div style="text-align: center;">
          <img src="logo.png" alt="Company Logo" style="height: 60px; margin-bottom: 20px;" />
        </div>
        <h2 style="color: #333;">Welcome to <span style="color: #007BFF;">eClinic Pro</span>!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for signing up. We're thrilled to have you on board at <strong>eClinic Pro</strong>.</p>
        <p>Feel free to explore your dashboard and begin using our platform for managing your healthcare operations more effectively.</p>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;" />

        <p style="font-size: 12px; color: #888;">Need help? Contact us at <a href="mailto:support@eclinicpro.com">support@eclinicpro.com</a>.</p>
        <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} eClinic Pro. All rights reserved.</p>
      </div>
    `,
  };

  console.log("📧 Sending email to:", to);
  await transporter.sendMail(mailOptions);
  console.log("✅ Email sent.");
};
