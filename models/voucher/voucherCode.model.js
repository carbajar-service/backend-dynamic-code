// models/voucherCode.model.js
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const voucherCodeSchema = new schema(
    {
        voucherMasterId: {
            type: schema.Types.ObjectId,
            ref: "voucherMaster"
        },
        batchId: {
            type: schema.Types.ObjectId,
            ref: "voucherBatch"
        },
        code: {
            type: String,
            unique: true,
            required: true
        },
        used: { type: Boolean, default: false },
        usedBy: { type: schema.Types.ObjectId },
        usedAt: { type: Date }
    },
    { timestamps: true }
);

module.exports = mongoose.model("voucherCode", voucherCodeSchema);