import mongoose ,{Schema}from "mongoose";

const medicalRecordsSchema=mongoose.Schema({
    patient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    diagnosis:String,
    notes:String,
    treatment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Prescription"

    },
    
   bill: {
  amount: Number,
  time: {
    type: Date,
    default: Date.now
  }
},
     
    pdfUrl: String,

},{timestamp:true})


export const MedicalRecord=mongoose.model("MedicalRecord",medicalRecordsSchema);