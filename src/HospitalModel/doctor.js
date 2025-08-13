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

    department: { type: String, required: true }, // e.g., Cardiology, Neurology
     // e.g., MBBS, MD
    experience: { type: Number, default: 0 }, // Years of experience
    availableSlots: [
    {
      day: { type: String, required: true },
      start: { type: String, required: true },
      end: { type: String, required: true }
    }
  ],// e.g., ["09:00", "10:00", "14:00"]
    image: String, // Profile picture

    isApproved: { type: Boolean, default: false }, // Admin approval
    isVerified: { type: Boolean, default: false }, // Email verification

    emailOTP: String,
    emailOTPExpiry: Date,
    resendOTPCounter: { type: Number, default: 0 },
    resendOTPWindowStart: Date,
    lastResendAt: Date,
  },
  { timestamps: true }
);

// Hash password before saving
doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with hashed password
doctorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
doctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: "doctor",
      department: this.department,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate Refresh Token
doctorSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: "doctor",
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Doctor = mongoose.model("Doctor", doctorSchema);
