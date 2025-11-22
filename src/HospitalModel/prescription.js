import mongoose, { Schema } from "mongoose";

const prescriptionSchema = new Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor", // Changed from User to Doctor for clarity if applicable, or keep User if Doctor is a role
            required: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
        },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Optional if linking to inventory
                medicineName: { type: String, required: true },
                dosage: { type: String, required: true },
                frequency: { type: String, required: true }, // e.g., "1-0-1"
                duration: { type: String, required: true }, // e.g., "5 days"
                quantity: { type: Number, required: true }, // Total qty to dispense
            },
        ],
        status: {
            type: String,
            enum: ["PENDING", "RECEIVED", "DISPENSED", "CANCELLED"],
            default: "PENDING",
        },
        priority: {
            type: String,
            enum: ["ROUTINE", "URGENT", "EMERGENCY"],
            default: "ROUTINE",
        },
        notes: String,
    },
    { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);

