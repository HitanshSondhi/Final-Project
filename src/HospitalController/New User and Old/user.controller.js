import { User } from "../../HospitalModel/User.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import { sendEmail } from "../../HospitalUtils/emailUtils/sendEmail.js";

const generateAccessandRefreshToken = async (id) => {
  try {
    const user = await User.findById(id); // await was missing
    const accessToken = user.generateAccessToken(); // () was missing
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }; // ✅ must return the tokens
  } catch (error) {
    throw new ApiError(501, "Problem occurred while generating tokens");
  }
};

const registerUser = asynchandler(async (req, res) => {
  const { name, email, password, isrole } = req.body;

  if ([name, email, password, isrole].some((field) => !field?.trim())) {
    throw new ApiError(401, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ name }, { email }],
  });

  if (existedUser) {
    throw new ApiError(401, "Username and email already exist");
  }

  const user = await User.create({
    name,
    email,
    password,
    isrole,
  });

  const createdUser = await User.findById(user._id).select("-password");
  console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  await sendEmail(
    email,
    "Welcome to Our Hospital!",
    `<h2>Hello ${name},</h2><p>Your registration is successful. We're glad to have you onboard!</p>`
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

const updateUser = asynchandler(async (req, res) => {
  const { id } = req.params;

  const { name, email, password, isrole } = req.body;

  const existingUser = await User.findOne({
    $or: [{ name }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User aleardy exists");
  }

  const updateData = {
    name,
    email,
    password,
  };

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
    context: "query",
    select: "-password",
  });

  console.log(updatedUser);

  return res.status(201).json(new ApiResponse(201, "User updated successfuly"));
});


const loginUser=asynchandler(async(req,res)=>{
  const{name,email,password,role}=req.body;
  if(!(name && password)){
    throw new ApiError(400,"username or password required")
  }
  const user= await User.findOne({
    $or:[{name},{email}]
  }) 
  if(!user){
    throw new ApiError(404,"User doesn't exist");
  }

  const isPasswordValid=user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401,"invalid credentials");
  }
  const{accessToken,refreshToken}= await generateAccessandRefreshToken(user._id)
    const logedInUser =await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user:logedInUser,accessToken,refreshToken
        },"User Logged in successfully")
    )
  
})

const logoutUser=asynchandler(async(req,res)=>{
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
  )
  const options={
        httpOnly:true,
        secure:true
    }
  return res.status(200).clearCookie("accessToken",options).clearCookie("refereshToken",options).json(new ApiResponse(200,{},"User Loged Out Successfully"))
})


export { registerUser, updateUser,loginUser,logoutUser };
