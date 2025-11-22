import mongoose, { Schema } from "mongoose";

const inventoryTransactionSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        batch: { type: Schema.Types.ObjectId, ref: "Batch" }, // Optional for some types
        type: {
            type: String,
            enum: ["RECEIVE", "ISSUE", "ADJUSTMENT", "RETURN"],
            required: true
        },
        quantity: { type: Number, required: true }, // Positive for add, negative for remove? Or always positive and type defines sign. Let's use type defines sign logic in controller, store absolute here usually, but signed is easier for aggregation. Let's store SIGNED quantity.
        // Actually, standard is usually absolute quantity + type. Let's stick to absolute quantity here and handle logic in controller.

        referenceType: { type: String, enum: ["Prescription", "PurchaseOrder", "Manual", "Audit"] },
        referenceId: { type: Schema.Types.ObjectId }, // ID of the prescription or PO

        performedBy: { type: Schema.Types.ObjectId, ref: "User" }, // User who did the action
        notes: String,
    },
    { timestamps: true }
);

export const InventoryTransaction = mongoose.model("InventoryTransaction", inventoryTransactionSchema);
