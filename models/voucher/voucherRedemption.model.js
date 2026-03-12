// models/voucherRedemption.model.js
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const voucherRedemptionSchema = new schema(
    {
        voucherMasterId: {
            type: schema.Types.ObjectId,
            ref: "voucherMaster",
            required: true
        },
        voucherCodeId: {
            type: schema.Types.ObjectId,
            ref: "voucherCode"
        },
        userId: {
            type: schema.Types.ObjectId,
            ref: "user"
        },
        driverId: {
            type: schema.Types.ObjectId,
            ref: "driver"
        },
        agencyId: {
            type: schema.Types.ObjectId,
            ref: "driver"
        },
        leadId: {
            type: schema.Types.ObjectId,
            ref: "lead"
        },
        discountAmount: { type: Number },
        redeemedAt: { type: Date, default: Date.now }

    },
    { timestamps: true }
);

module.exports = mongoose.model("voucherRedemption", voucherRedemptionSchema);