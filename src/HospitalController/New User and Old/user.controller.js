import crypto from "crypto";
import { User } from "../../HospitalModel/User.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { sendEmail } from "../../HospitalUtils/emailUtils/sendEmail.js";
import { parseEnvToSeconds } from "../../HospitalUtils/redis/redisUtils.js";
import { redis } from "../../db/connectRedis.js";

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

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = asynchandler(async (req, res) => {
  const { name, email, password, isrole } = req.body;

  if ([name, email, password, isrole].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ name }, { email }] });
  if (existedUser) throw new ApiError(409, "Username or email already exists");

  const otp = generateOTP();
  const userPayload = JSON.stringify({ name, email, password, isrole });

  await redis.set(`otp:${email}`, otp, "EX", 300); 
  await redis.set(`registerPayload:${email}`, userPayload, "EX", 600); 
  await redis.set(`resendCount:${email}`, 0, "EX", 900);

  await sendEmail({
    to: email,
    subject: "eClinic Pro | Your OTP",
    html: `<h2>Hello ${name},</h2>
           <p>Your OTP for registration is:</p>
           <h3>${otp}</h3>
           <p>This OTP will expire in 5 minutes.</p>`
  });

  return res.status(200).json(new ApiResponse(200, {}, "OTP sent to email. Please verify to complete registration."));
});

const verifyUser = asynchandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const savedOtp = await redis.get(`otp:${email}`);
  const payload = await redis.get(`registerPayload:${email}`);

  if (!savedOtp || savedOtp !== otp || !payload) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const { name, password, isrole } = JSON.parse(payload);

  const alreadyExists = await User.findOne({ $or: [{ name }, { email }] });
  if (alreadyExists) throw new ApiError(409, "User already exists");

  const user = await User.create({
    name,
    email,
    password,
    isrole,
    isVerified: true,
    isApproved: true,
  });

  await redis.del(`otp:${email}`);
  await redis.del(`registerPayload:${email}`);
  await redis.del(`resendCount:${email}`);

  return res.status(201).json(new ApiResponse(201, user, "Email verified and user registered successfully."));
});



const verifyEmail = asynchandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const savedOtp = await redis.get(`otp:${email}`);
  if (!savedOtp || savedOtp !== otp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  await User.findOneAndUpdate({ email }, { isVerified: true });
  await redis.del(`otp:${email}`);
  await redis.del(`resendCount:${email}`);
  await redis.del(`cooldown:${email}`);

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

const resendOTP = asynchandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) throw new ApiError(400, "User is already verified");

  const cooldown = await redis.get(`cooldown:${email}`);
  const resendCount = await redis.get(`resendCount:${email}`);

  if (cooldown) throw new ApiError(429, "Wait 1 minute before requesting another OTP");
  if (resendCount && parseInt(resendCount) >= 3) {
    throw new ApiError(429, "Maximum OTP resend limit reached. Try again after 15 minutes");
  }

  const newOTP = generateOTP();
  await redis.set(`otp:${email}`, newOTP, "EX", 300);
  await redis.set(`cooldown:${email}`, 1, "EX", 60);
  await redis.incr(`resendCount:${email}`);
  await redis.expire(`resendCount:${email}`, 900);

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
  updateUser,
  verifyUser
};
