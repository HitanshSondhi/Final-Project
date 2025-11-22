import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    gender: String,
    dob: Date,
    address: String,
    department: { type: String, required: true },
    experience: { type: Number, default: 0 },

    // Available slots with full Date objects
    availableSlots: [
      {
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true }
      }
    ],

    image: String,
    isApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    emailOTP: String,
    emailOTPExpiry: Date,
    resendOTPCounter: { type: Number, default: 0 },
    resendOTPWindowStart: Date,
    lastResendAt: Date,
    lastBookingAttempt: Date,
  },
  { timestamps: true }
);

// Hash password
doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
doctorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate tokens
doctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, name: this.name, role: "doctor", department: this.department },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

doctorSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id, role: "doctor" }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const Doctor = mongoose.model("Doctor", doctorSchema);
