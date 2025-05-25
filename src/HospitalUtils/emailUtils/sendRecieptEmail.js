import nodemailer from "nodemailer";

export const sendReceiptEmail = async (toEmail, paymentId, amount) => {
  const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

  await transporter.sendMail({
    from: `"Hospital Payments" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Payment Receipt",
    html: `<p>Thank you for your payment.</p>
           <p>Payment ID: <strong>${paymentId}</strong></p>
           <p>Amount: ₹${amount / 100}</p>`
  });
};


