const voucherService = require("../../services/voucher/voucher.service");
const logger = require("../../utils/logs");
const responser = require("../utils/responser");

module.exports.generateVoucherBatch = async (req, res) => {
    const data = await voucherService.generateVoucherBatch(
        req.body,
        req.admin._id
    );
    res.status(200).json({
        message: "Voucher batch generated",
        data
    });
};