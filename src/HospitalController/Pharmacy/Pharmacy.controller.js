import { Prescription } from "../../HospitalModel/prescription.js";
import { Product } from "../../HospitalModel/product.js";
import { Batch } from "../../HospitalModel/batch.js";
import { InventoryTransaction } from "../../HospitalModel/inventoryTransaction.js";
import { ApiError } from "../../HospitalUtils/ApiError.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";
import mongoose from "mongoose";

// Doctor sends prescription to pharmacy
export const sendToPharmacy = asynchandler(async (req, res) => {
    const { patientId, appointmentId, items, priority, notes } = req.body;
    const doctorId = req.user._id;

    const prescription = await Prescription.create({
        doctor: doctorId,
        patient: patientId,
        appointment: appointmentId,
        items,
        priority,
        notes,
        status: "RECEIVED", // Automatically received by pharmacy system
    });

    // Notify pharmacy (socket.io or push notification logic here - omitted for now)

    return res
        .status(201)
        .json(new ApiResponse(201, prescription, "Prescription sent to pharmacy"));
});

// Pharmacist views queue
export const getPharmacyQueue = asynchandler(async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : { status: { $in: ["RECEIVED", "PENDING"] } };

    const prescriptions = await Prescription.find(filter)
        .populate("patient", "name email")
        .populate("doctor", "name")
        .sort({ priority: -1, createdAt: 1 }); // Urgent first, then FIFO

    return res.status(200).json(new ApiResponse(200, prescriptions, "Pharmacy queue fetched"));
});

// Pharmacist dispenses prescription
export const dispensePrescription = asynchandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const pharmacistId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const prescription = await Prescription.findById(prescriptionId).session(session);
        if (!prescription) throw new ApiError(404, "Prescription not found");
        if (prescription.status === "DISPENSED") throw new ApiError(400, "Already dispensed");

        for (const item of prescription.items) {
            // If item is linked to a product, deduct stock
            if (item.product) {
                let quantityNeeded = item.quantity;

                // Find batches with stock, sorted by expiry (FEFO)
                const batches = await Batch.find({
                    product: item.product,
                    quantity: { $gt: 0 },
                    expiryDate: { $gt: new Date() },
                    isActive: true,
                })
                    .sort({ expiryDate: 1 })
                    .session(session);

                let totalAvailable = batches.reduce((acc, b) => acc + b.quantity, 0);
                if (totalAvailable < quantityNeeded) {
                    throw new ApiError(400, `Insufficient stock for product ${item.medicineName}`);
                }

                for (const batch of batches) {
                    if (quantityNeeded <= 0) break;

                    const deduct = Math.min(batch.quantity, quantityNeeded);

                    // Update batch
                    batch.quantity -= deduct;
                    if (batch.quantity === 0) batch.isActive = false; // Optional: mark empty batches inactive
                    await batch.save({ session });

                    // Create transaction record
                    await InventoryTransaction.create(
                        [
                            {
                                product: item.product,
                                batch: batch._id,
                                type: "ISSUE",
                                quantity: deduct,
                                referenceType: "Prescription",
                                referenceId: prescription._id,
                                performedBy: pharmacistId,
                            },
                        ],
                        { session }
                    );

                    quantityNeeded -= deduct;
                }

                // Update product total quantity
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { totalQuantity: -item.quantity } },
                    { session }
                );
            }
        }

        prescription.status = "DISPENSED";
        await prescription.save({ session });

        await session.commitTransaction();

        return res
            .status(200)
            .json(new ApiResponse(200, prescription, "Prescription dispensed successfully"));
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});
