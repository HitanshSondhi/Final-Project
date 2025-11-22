import { Product } from "../../HospitalModel/product.js";
import { Batch } from "../../HospitalModel/batch.js";
import { InventoryTransaction } from "../../HospitalModel/inventoryTransaction.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import mongoose from "mongoose";

// Add new stock (Receive)
export const receiveStock = asynchandler(async (req, res) => {
    const { productId, batchNumber, quantity, expiryDate, supplier, unitPrice } = req.body;
    const userId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);
        if (!product) throw new ApiError(404, "Product not found");

        // Check if batch exists
        let batch = await Batch.findOne({ product: productId, batchNumber }).session(session);

        if (batch) {
            // Update existing batch
            batch.quantity += quantity;
            await batch.save({ session });
        } else {
            // Create new batch
            batch = await Batch.create([{
                product: productId,
                batchNumber,
                quantity,
                expiryDate,
                supplier,
                isActive: true
            }], { session });
            batch = batch[0];
        }

        // Create transaction
        await InventoryTransaction.create([{
            product: productId,
            batch: batch._id,
            type: "RECEIVE",
            quantity: quantity,
            referenceType: "Manual", // Or PurchaseOrder if implemented
            performedBy: userId,
            notes: `Received stock from ${supplier}`
        }], { session });

        // Update product total
        product.totalQuantity += quantity;
        // Optional: update price if changed
        if (unitPrice) product.unitPrice = unitPrice;
        await product.save({ session });

        await session.commitTransaction();

        return res.status(201).json(new ApiResponse(201, batch, "Stock received successfully"));

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

// Create new product
export const createProduct = asynchandler(async (req, res) => {
    const product = await Product.create(req.body);
    return res.status(201).json(new ApiResponse(201, product, "Product created"));
});

// Check reorder levels
export const checkReorder = asynchandler(async (req, res) => {
    // Find products where totalQuantity <= reorderLevel
    const products = await Product.find({
        $expr: { $lte: ["$totalQuantity", "$reorderLevel"] }
    });

    return res.status(200).json(new ApiResponse(200, products, "Low stock products fetched"));
});

// Check expiry
export const checkExpiry = asynchandler(async (req, res) => {
    const { days } = req.query; // Check batches expiring in X days
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + (parseInt(days) || 30));

    const batches = await Batch.find({
        expiryDate: { $lte: thresholdDate, $gte: new Date() },
        quantity: { $gt: 0 },
        isActive: true
    }).populate("product", "name");

    return res.status(200).json(new ApiResponse(200, batches, "Expiring batches fetched"));
});
