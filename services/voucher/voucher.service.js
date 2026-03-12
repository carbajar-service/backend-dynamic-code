const voucherBatchModel = require("../../models/voucher/voucherBatch.model");
const voucherCodeModel = require("../../models/voucher/voucherCode.model");
const generateVoucher = require("../../utils/utils");

module.exports.generateVoucherBatch = async (data, adminId) => {
    const batch = await voucherBatchModel.create({
        voucherMasterId: data.voucherMasterId,
        batchName: data.batchName,
        prefix: data.prefix,
        totalCodes: data.count,
        generatedBy: adminId
    });
    const codes = [];
    for (let i = 0; i < data.count; i++) {
        const code = generateVoucher(data.prefix);
        codes.push({
            voucherMasterId: data.voucherMasterId,
            batchId: batch._id,
            code
        });
    }
    await voucherCodeModel.insertMany(codes);
    return {
        batchId: batch._id,
        totalGenerated: codes.length
    };
};