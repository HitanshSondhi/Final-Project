import { appointment } from "../../HospitalModel/appointment";
import { Doctor } from "../../HospitalModel/doctor";
import { ApiError } from "../../HospitalUtils/ApiError";
import { ApiResponse } from "../../HospitalUtils/ApiResponse";
import { asynchandler } from "../../HospitalUtils/asynchandler";

const getAllDoctorsbyDepartment=asynchandler(async(req,res)=>{
const {department}=req.query;
if(!department.trim()){
    throw new ApiError(400,"Department name is required");
}

const doctors=await Doctor.find({
    department:{$options:"i"}
}).select("name email specialisation")

    

})