import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,
  isPaid: { type: Boolean, default: false },
  paidAt: Date
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
