import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User" }, // Who did it
        action: { type: String, required: true }, // e.g., "LOGIN", "VIEW_RECORD", "DISPENSE_DRUG"
        resource: { type: String, required: true }, // e.g., "Prescription", "PatientData"
        resourceId: { type: Schema.Types.ObjectId },

        details: { type: Schema.Types.Mixed }, // Flexible object for extra info
        ipAddress: String,
        userAgent: String,

        status: { type: String, enum: ["SUCCESS", "FAILURE"], default: "SUCCESS" },
    },
    { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
