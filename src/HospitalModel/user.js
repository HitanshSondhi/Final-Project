import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import bcrypt from"bcrypt";
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
    },
    password:{
        required:true,
        unique:true,
    },
    isrole:{
        required:true,
        type:String,
        enum:["patient","doctor","admin"]

    },
    
    phone:String,
    gender:String,
    dob:Date,
    address:String,
    specialization:String,
    isApproved:{
        type:Boolean,
        default:false
    },


},{timestamps:true})
export const user = mongoose.model("User", userSchema)