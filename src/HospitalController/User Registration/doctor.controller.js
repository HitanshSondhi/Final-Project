import { User } from "../../HospitalModel/User.js";
import { Doctor } from "../../HospitalModel/doctor.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { sendEmail } from "../../HospitalUtils/emailUtils/sendEmail.js";
import { redis } from "../../db/connectRedis.js";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


const generateAccessandRefreshToken = async (id) => {
  try {
    const doctor = await Doctor.findById(id);
    const accessToken = doctor.generateAccessToken();
    const refreshToken = doctor.generateRefreshToken();
    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(501, "Problem occurred while generating tokens");
  }
};


const registerDoctor = asynchandler(async (req, res) => {
  const { name, email, password, department, specialization, slots } = req.body;

  if ([name, email, password, department, specialization].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedDoctor = await Doctor.findOne({ email });
  if (existedDoctor) throw new ApiError(409, "Doctor with this email already exists");

  const otp = generateOTP();
  const doctorPayload = JSON.stringify({ name, email, password, department, specialization, slots });

  
  await redis.set(`doctorOtp:${email}`, otp, "EX", 300);
  await redis.set(`doctorRegisterPayload:${email}`, doctorPayload, "EX", 600);
  await redis.set(`doctorResendCount:${email}`, 0, "EX", 900);

  await sendEmail({
    to: email,
    subject: "eClinic Pro | Doctor Registration OTP",
    html: `<h2>Hello Dr. ${name},</h2>
           <p>Your OTP for doctor registration is:</p>
           <h3>${otp}</h3>
           <p>This OTP will expire in 5 minutes.</p>`
  });

  return res.status(200).json(new ApiResponse(200, {}, "OTP sent to email. Please verify to complete registration."));
});


const verifyDoctor = asynchandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const savedOtp = await redis.get(`doctorOtp:${email}`);
  const payload = await redis.get(`doctorRegisterPayload:${email}`);

  if (!savedOtp || savedOtp !== otp || !payload) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const { name, password, department, specialization, slots } = JSON.parse(payload);

  const doctor = await Doctor.create({
    name,
    email,
    password,
    department,
    specialization,
    slots,
    isVerified: true,
    isApproved: true,
  });

  await redis.del(`doctorOtp:${email}`);
  await redis.del(`doctorRegisterPayload:${email}`);
  await redis.del(`doctorResendCount:${email}`);

  return res.status(201).json(new ApiResponse(201, doctor, "Doctor registered successfully"));
});


const loginDoctor = asynchandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const doctor = await Doctor.findOne({ email });
  if (!doctor) throw new ApiError(404, "Doctor not found");
  if (!doctor.isVerified) throw new ApiError(401, "Please verify your email before logging in");

  const isPasswordValid = await doctor.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(doctor._id);
  const loggedInDoctor = await Doctor.findById(doctor._id).select("-password -refreshToken");

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { doctor: loggedInDoctor, accessToken, refreshToken }, "Doctor logged in successfully"));
});


const logoutDoctor = asynchandler(async (req, res) => {
  await Doctor.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Doctor logged out successfully"));
});

export {
  registerDoctor,
  verifyDoctor,
  loginDoctor,
  logoutDoctor
};
