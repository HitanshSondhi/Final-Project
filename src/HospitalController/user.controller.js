import { User } from "../HospitalModel/User.js";
import { ApiError } from "../HospitalUtils/ApiError.js";
import { ApiResponse } from "../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../HospitalUtils/asynchandler.js";

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

  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

const updateUser=asynchandler(async(req,res)=>{
 const {id}=req.params;

 const { name, email, password, isrole } = req.body;

 const existingUser = await User.findOne({
    $or: [{ name }, { email }],
  });

  if(existingUser){
    throw new ApiError(409,"User aleardy exists");
  }

  const updateData={
    name,
    email,
    password

  }

  const updatedUser=await User.findByIdAndUpdate(id,updateData,{
    new:true,
    runValidators:true,
    context:"query",
    select:"-password",
  })

  console.log(updatedUser);

  return res.status(201).json(new ApiResponse(201,"User updated successfuly"))


})



export {
   registerUser ,
   updateUser
  
  };
