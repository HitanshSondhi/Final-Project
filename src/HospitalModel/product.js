import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        name: { type: String, required: true, index: true },
        genericName: { type: String, index: true },
        sku: { type: String, unique: true, required: true },
        description: String,
        category: { type: String, required: true }, // e.g., "Tablet", "Syrup", "Injection"
        manufacturer: String,

        // Inventory levels
        totalQuantity: { type: Number, default: 0 }, // Aggregated from batches
        reorderLevel: { type: Number, default: 10 }, // Alert when stock dips below this

        unitPrice: { type: Number, required: true },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
