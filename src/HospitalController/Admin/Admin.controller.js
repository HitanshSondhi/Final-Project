import { AuditLog } from "../../HospitalModel/auditLog.js";
import { Product } from "../../HospitalModel/product.js";
import { Prescription } from "../../HospitalModel/prescription.js";
import { ApiResponse } from "../../HospitalUtils/ApiResponse.js";
import { asynchandler } from "../../HospitalUtils/asynchandler.js";

// Get Audit Logs
export const getAuditLogs = asynchandler(async (req, res) => {
    const { user, action, resource, startDate, endDate } = req.query;

    const filter = {};
    if (user) filter.user = user;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(100); // Limit to last 100 for performance

    return res.status(200).json(new ApiResponse(200, logs, "Audit logs fetched"));
});

// Stock Valuation Report
export const getStockValuation = asynchandler(async (req, res) => {
    const valuation = await Product.aggregate([
        {
            $project: {
                name: 1,
                totalQuantity: 1,
                unitPrice: 1,
                value: { $multiply: ["$totalQuantity", "$unitPrice"] }
            }
        },
        {
            $group: {
                _id: null,
                totalValue: { $sum: "$value" },
                products: { $push: "$$ROOT" }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, valuation[0] || { totalValue: 0, products: [] }, "Stock valuation generated"));
});

// Helper to log actions
export const logAction = async (userId, action, resource, resourceId, details, status = "SUCCESS") => {
    try {
        await AuditLog.create({
            user: userId,
            action,
            resource,
            resourceId,
            details,
            status
        });
    } catch (error) {
        console.error("Audit Log Error:", error);
    }
};
