import mongoose ,{Schema}from "mongoose";

const billingSchmema=mongoose.model({
    patient:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:True
    },
    doctor:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:True
    },
    items:[{
        description:String,
        cost:Number
    }],
    totalamount:Number,
    paid:{type:Boolean,default:false},
    paymentMethod:{
        type:String,
        enum:["cash","card","insurance","upi"],
        default:"cash"
    },
    paidAt:Date,

},{timestamps:true})

export const billing=mongoose.model("Billing",billingSchmema);

