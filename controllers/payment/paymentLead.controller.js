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

/* =====================================================
   3️⃣ GET MY PAYMENT HISTORY
===================================================== */
module.exports.getMyPayments = async (req, res) => {
    logger.info("getMyPayments");

    const user = req.user;
    const query = req.query;

    const data = await leadPaymentService.getMyPayments(user, query);

    logger.data("Fetched user payments", data);
    return responser.send(200, "Payments fetched successfully", req, res, data);
};

/* =====================================================
   4️⃣ GET SINGLE PAYMENT
===================================================== */
module.exports.getSinglePayment = async (req, res) => {
    logger.info("getSinglePayment");

    const { paymentId } = req.params;

    const data = await leadPaymentService.getSinglePayment(paymentId);

    logger.data("Fetched single payment", data);
    return responser.send(200, "Payment fetched successfully", req, res, data);
};

/* =====================================================
   5️⃣ ADMIN - GET ALL PAYMENTS
===================================================== */
module.exports.getAllPaymentsAdmin = async (req, res) => {
    logger.info("getAllPaymentsAdmin");

    const query = req.query;

    const data = await leadPaymentService.getAllPaymentsAdmin(query);

    logger.data("Fetched all payments (admin)", data);
    return responser.send(200, "All payments fetched successfully", req, res, data);
};