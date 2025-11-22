import mongoose, { Schema } from "mongoose";

const batchSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        batchNumber: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        expiryDate: { type: Date, required: true },
        manufacturingDate: Date,
        supplier: String,

        isActive: { type: Boolean, default: true }, // False if empty or expired
    },
    { timestamps: true }
);

// Compound index for unique batch per product
batchSchema.index({ product: 1, batchNumber: 1 }, { unique: true });

export const Batch = mongoose.model("Batch", batchSchema);
