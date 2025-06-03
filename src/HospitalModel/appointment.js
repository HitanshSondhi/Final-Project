import mongoose ,{Schema}from "mongoose";

const appointmentSchema=mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    doctor:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"User",
        required:true
    },
    time:{type:Date,required:true},
    symptoms:String,
    prescription:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Prescription"
    },
    status:{
        type:String,
        required:true,
        enum:["pending","completed","canceled"]
    }

},{timestamp:true});


const appointment=mongoose.model("Appointment",appointmentSchema);
