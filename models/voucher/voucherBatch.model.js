// models/voucherBatch.model.js
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const voucherBatchSchema = new schema(
    {
        voucherMasterId: {
            type: schema.Types.ObjectId,
            ref: "voucherMaster",
            required: true
        },
        batchName: { type: String },
        prefix: { type: String },
        totalVouchers: { type: Number },
        generatedBy: { type: schema.Types.ObjectId, ref: "admin" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("voucherBatch", voucherBatchSchema);