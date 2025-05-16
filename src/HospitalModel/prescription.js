import mongoose ,{Schema}from "mongoose";

const prescriptionSchema=mongoose.Schema({
    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    patient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    time:{
        type:Date,
        default:Date.now
    },
    medicines:{
        type:String,
        dosage:String,
        frequency:Number,
        duration:String

    },
    notes:String
},{timestamp:true});

export const prescription=mongoose.model("Prescription", prescriptionSchema);

