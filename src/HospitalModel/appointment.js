import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },

    // Store start and end times of the appointment
    startTime: { type: Date, required: true },
    endTime: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(value) {
          // Ensure duration is 30 minutes
          return (value - this.startTime) === 30 * 60 * 1000;
        },
        message: "Appointment must be exactly 30 minutes long"
      }
    },

    mode: { type: String, enum: ["online", "offline"], required: true },
    symptoms: { type: String },
    prescription: { type: Schema.Types.ObjectId, ref: "Prescription" },
    status: { type: String, enum: ["pending", "scheduled", "completed", "cancelled"], default: "pending" },

    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    paymentDetails: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
  },
  { timestamps: true }
);

// Optional: auto-set endTime if only startTime is provided
// appointmentSchema.pre("validate", function(next) {
//   if (this.startTime && !this.endTime) {
//     this.endTime = new Date(this.startTime.getTime() + 30 * 60 * 1000);
//   }
//   next();
// });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
