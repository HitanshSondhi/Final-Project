import Payment from "../HospitalModel/payment.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../HospitalModel/User.js";
import { sendReceiptEmail } from "../HospitalUtils/emailUtils/sendRecieptEmail.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

export const createOrder = async (req, res) => {
  const { amount, userId } = req.body;

  try {
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId,
      amount: order.amount,
      currency: order.currency,
      razorpay_order_id: order.id
    });
    console.log(payment)

    res.status(200).json({ order, paymentId: payment._id });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed', details: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  try {
    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        isPaid: true,
        paidAt: new Date()
      },
      { new: true }
    ).populate('userId');

    if (!payment) return res.status(404).json({ message: "Payment record not found" });

    await sendReceiptEmail(payment.userId.email, payment._id, payment.amount);

    res.json({ success: true, message: "Payment verified & email sent" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};