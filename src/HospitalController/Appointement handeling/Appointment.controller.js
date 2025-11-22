import Razorpay from "razorpay";
import { Appointment } from "../../HospitalModel/appointment.js";
import { Doctor } from "../../HospitalModel/doctor.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

import mongoose from "mongoose";

export const createAppointment = asynchandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { doctorId, dateTime, mode, symptoms, amount } = req.body;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User not authenticated");
    if (!doctorId || !dateTime || !mode || !amount)
      throw new ApiError(400, "Doctor, dateTime, mode, and amount are required");

    // ----------------------------
    // Step 1: Get doctor and slots (with LOCK)
    // ----------------------------
    // We perform a dummy update to lock the doctor document for this transaction
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: { lastBookingAttempt: new Date() } },
      { session, new: true }
    );

    if (!doctor) throw new ApiError(404, "Doctor not found");

    const availableSlots = doctor.availableSlots;
    if (!availableSlots || availableSlots.length === 0)
      throw new ApiError(400, "Doctor has no slots available");

    // ----------------------------
    // Step 2: Parse dateTime as IST
    // ----------------------------
    const [datePart, timePart] = dateTime.split("T");
    if (!datePart || !timePart) throw new ApiError(400, "Invalid dateTime format");

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    const appointmentDateIST = new Date(year, month - 1, day, hour, minute);

    if (isNaN(appointmentDateIST)) throw new ApiError(400, "Invalid date format");

    // ----------------------------
    // Step 3: Determine day name
    // ----------------------------
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = daysOfWeek[appointmentDateIST.getDay()];

    // ----------------------------
    // Step 4: Find slot for that day
    // ----------------------------
    const slot = availableSlots.find((s) => s.day === dayOfWeek);
    if (!slot) throw new ApiError(400, "Doctor has no slots on this day");

    // ----------------------------
    // Step 5: Check appointment within slot (30 min)
    // ----------------------------
    const [startHour, startMinute] = slot.start.split(":").map(Number);
    const [endHour, endMinute] = slot.end.split(":").map(Number);

    const slotStartMinutes = startHour * 60 + startMinute;
    const slotEndMinutes = endHour * 60 + endMinute;

    const appointmentMinutes = appointmentDateIST.getHours() * 60 + appointmentDateIST.getMinutes();

    if (appointmentMinutes < slotStartMinutes || appointmentMinutes + 30 > slotEndMinutes)
      throw new ApiError(
        400,
        "Requested time is not within doctor's available slot or exceeds 30 minutes"
      );

    const appointmentEndIST = new Date(appointmentDateIST.getTime() + 30 * 60 * 1000);

    // ----------------------------
    // Step 6: Check overlapping appointments
    // ----------------------------
    const overlapping = await Appointment.findOne({
      doctor: doctorId,
      status: { $in: ["scheduled", "completed"] },
      dateTime: { $lt: appointmentEndIST },
      $expr: {
        $gte: [{ $add: ["$dateTime", 30 * 60 * 1000] }, appointmentDateIST],
      },
    }).session(session);

    if (overlapping) throw new ApiError(400, "Slot already booked for another patient");

    // ----------------------------
    // Step 7: Create Razorpay order (simulate paid)
    // ----------------------------
    // Note: Razorpay creation is external and doesn't need to be in the DB transaction, 
    // but we keep it here for flow simplicity. If it fails, we abort.
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    order.amount_paid = order.amount;
    order.amount_due = 0;
    order.status = "paid";

    // ----------------------------
    // Step 8: Save appointment
    // ----------------------------
    const [appointment] = await Appointment.create([{
      user: userId,
      doctor: doctorId,
      dateTime: appointmentDateIST,
      mode,
      symptoms,
      status: "completed",
      paymentStatus: "paid",
      paymentDetails: {
        orderId: order.id,
        paymentId: `pay_${Date.now()}`,
      },
    }], { session });

    await session.commitTransaction();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { order, appointment },
          "Appointment created and payment marked as completed."
        )
      );

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});
export const updateAppointment = asynchandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { dateTime, mode, symptoms } = req.body;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "User not authenticated");

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  // Only the user who booked or an admin can update
  if (appointment.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update this appointment");
  }

  if (appointment.status === "cancelled" || appointment.status === "completed") {
    throw new ApiError(400, "Cannot update a cancelled or completed appointment");
  }

  if (dateTime) appointment.dateTime = new Date(dateTime);
  if (mode) appointment.mode = mode;
  if (symptoms) appointment.symptoms = symptoms;

  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, appointment, "Appointment updated successfully"));
});
export const cancelAppointment = asynchandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "User not authenticated");

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  // Only the user who booked or an admin can cancel
  if (appointment.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to cancel this appointment");
  }

  if (appointment.status === "cancelled") {
    throw new ApiError(400, "Appointment already cancelled");
  }

  // 🔹 Check if payment was done
  if (appointment.paymentStatus !== "paid") {
    throw new ApiError(400, "Cannot refund as payment was not completed");
  }

  // 🔹 Trigger refund via Razorpay
  try {
    const refund = await razorpay.payments.refund(appointment.paymentDetails.paymentId, {
      amount: appointment.paymentDetails.amount, // in paise
      speed: "optimum", // or "instant"
    });

    // 🔹 Update appointment after refund
    appointment.status = "cancelled";
    appointment.paymentStatus = "refunded";
    appointment.paymentDetails.refundId = refund.id;

    await appointment.save();

    return res.status(200).json(
      new ApiResponse(200, { appointment, refund }, "Appointment cancelled & payment refunded successfully")
    );
  } catch (err) {
    console.error("Refund error:", err);
    throw new ApiError(500, "Refund failed. Please contact support.");
  }
});

