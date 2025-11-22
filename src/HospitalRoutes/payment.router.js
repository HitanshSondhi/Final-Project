import Razorpay from "razorpay";
import crypto from "crypto";
import express from "express";

// import express from "express";
// import { createOrder, verifyPayment } from "../HospitalController/payment controller/payment.controller.js";

// const paymentRouter = express.Router();

// paymentRouter.post("/order", createOrder);
// paymentRouter.post("/verify", verifyPayment);

// export default paymentRouter

const paymentRouter = express();
// app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // from Test Mode
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create an order
paymentRouter.post("/order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // amount in paise (₹1 = 100 paise)
      currency: "INR",
      receipt: "order_rcptid_11",
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating order");
  }
});

// Verify Payment signature (after success)
paymentRouter.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    res.json({ success: true, message: "Payment verified successfully" });
  } else {
    res.json({ success: false, message: "Payment verification failed" });
  }
});
// console.log(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);

export default paymentRouter


