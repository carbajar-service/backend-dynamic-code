// models/voucherMaster.model.js
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const voucherMasterSchema = new schema(
    {
        name: { type: String, required: true },
        codePrefix: { type: String }, // used if generating batch codes
        type: {
            type: String,
            enum: ["discount", "wallet_credit", "driver_bonus", "agency_bonus"],
            required: true
        },
        discountType: {
            type: String,
            enum: ["flat", "percentage"],
        },
        value: { type: Number, required: true },
        maxDiscountAmount: { type: Number }, // useful for percentage
        minTripAmount: { type: Number },
        totalUsageLimit: { type: Number },
        perUserLimit: { type: Number, default: 1 },
        validFrom: { type: Date, required: true },
        validTo: { type: Date, required: true },
        applicableFor: {
            type: String,
            enum: ["user", "driver", "agency", "all"],
            default: "all"
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        createdBy: { type: schema.Types.ObjectId, ref: "admin" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("voucherMaster", voucherMasterSchema);