import crypto from "crypto";
import { User } from "../../HospitalModel/User.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { sendEmail } from "../../HospitalUtils/emailUtils/sendEmail.js";

const generateAccessandRefreshToken = async (id) => {
  try {
    const user = await User.findById(id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(501, "Problem occurred while generating tokens");
  }
};

const registerUser = asynchandler(async (req, res) => {
  const { name, email, password, isrole } = req.body;

  if ([name, email, password, isrole].some((field) => !field?.trim())) {
    throw new ApiError(401, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ name }, { email }] });
  if (existedUser) throw new ApiError(401, "Username or email already exists");

  const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const emailOTPExpiry = Date.now() + 1000 * 60 * 5;

  const user = await User.create({
    name,
    email,
    password,
    isrole,
    emailOTP,
    emailOTPExpiry,
    resendOTPCounter: 0,
    resendOTPWindowStart: new Date(),
    lastResendAt: new Date()
  });

  await sendEmail({
    to: email,
    subject: "Your Email Verification OTP",
    html: `<h2>Hello ${name},</h2>
           <p>Your OTP for email verification is:</p>
           <h3>${emailOTP}</h3>
           <p>This OTP will expire in 5 minutes.</p>`
  });

  return res.status(201).json(
    new ApiResponse(201, "Registration successful. OTP sent to your email.")
  );
});

const verifyEmail = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user || user.emailOTP !== otp || user.emailOTPExpiry < Date.now()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpiry = undefined;
  user.resendOTPCounter = 0;
  user.resendOTPWindowStart = undefined;
  user.lastResendAt = undefined;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

const resendOTP = asynchandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) throw new ApiError(400, "User is already verified");

  const now = Date.now();
  const windowDuration = 15 * 60 * 1000; // 15 minutes
  const cooldown = 60 * 1000; // 1 minute

  if (!user.resendOTPWindowStart || now - user.resendOTPWindowStart.getTime() > windowDuration) {
    user.resendOTPCounter = 0;
    user.resendOTPWindowStart = new Date();
  }

  if (user.lastResendAt && now - user.lastResendAt.getTime() < cooldown) {
    const waitTime = Math.ceil((cooldown - (now - user.lastResendAt.getTime())) / 1000);
    throw new ApiError(429, `Please wait ${waitTime} seconds before requesting another OTP`);
  }

  if (user.resendOTPCounter >= 3) {
    throw new ApiError(429, "Maximum OTP resend limit reached. Try again after 15 minutes");
  }

  const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const newExpiry = Date.now() + 1000 * 60 * 5;

  user.emailOTP = newOTP;
  user.emailOTPExpiry = newExpiry;
  user.resendOTPCounter += 1;
  user.lastResendAt = new Date();

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: email,
    subject: "Your New OTP - eClinic Pro",
    html: `<h2>Hello ${user.name},</h2>
           <p>Your new OTP is:</p>
           <h3>${newOTP}</h3>
           <p>This OTP is valid for the next 5 minutes.</p>`
  });

  return res.status(200).json(new ApiResponse(200, {}, "OTP resent successfully"));
});

const loginUser = asynchandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!(name || email) || !password) {
    throw new ApiError(400, "Username or password required");
  }

  const user = await User.findOne({ $or: [{ name }, { email }] });
  if (!user) throw new ApiError(404, "User doesn't exist");
  if (!user.isVerified) throw new ApiError(401, "Please verify your email before logging in");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const updateUser = asynchandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ name }, { email }] });
  if (existingUser) throw new ApiError(409, "User already exists");

  const updateData = { name, email, password };

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
    context: "query",
    select: "-password"
  });

  return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

export {
  registerUser,
  verifyEmail,
  resendOTP,
  loginUser,
  logoutUser,
  updateUser
};
