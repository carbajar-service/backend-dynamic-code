const leadPaymentService = require("../../services/payment/paymentLead.service");
const logger = require("../../utils/logs");
const responser = require("../../utils/responser");

// ✅ Create Payment Order for Lead
module.exports.createLeadPayment = async (req, res) => {
    logger.info("Creating Lead Payment Order");
    const reqData = req.body;
    const loggedIn = req.userId; // or req.driverId depending on your auth
    const data = await leadPaymentService.createLeadOrder(
        loggedIn,
        reqData.leadId,
        reqData.amount,
        reqData.stage // ADVANCE / FINAL
    );
    logger.data("Lead payment order created successfully", data);
    return responser.send(
        201,
        "Lead payment order created successfully",
        req,
        res,
        data
    );
};

// ✅ Verify Lead Payment
module.exports.verifyLeadPayment = async (req, res) => {
    logger.info("Verifying Lead Payment");
    const reqData = req.body;
    const loggedIn = req.userId; // optional (not needed in verify usually)
    const data = await leadPaymentService.verify(reqData);
    logger.data("Lead payment verified successfully", data);
    return responser.send(
        200,
        "Lead payment verified successfully",
        req,
        res,
        data
    );
};