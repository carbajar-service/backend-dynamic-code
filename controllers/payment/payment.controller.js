const paymentService = require("../../services/payment/payment.service");
const logger = require("../../utils/logs");
const responser = require("../../utils/responser");

module.exports.topupWallet = async (req, res) => {
    logger.info("Creating The TopUp Order");
    const reqData = req.body;
    const loggedIn = req.driverId;
    const data = await paymentService.createTopup(loggedIn, reqData);
    logger.data("successfully order created", data);
    return responser.send(201, `TopUp order created successfully`, req, res, data);
};

module.exports.verifyPayment = async (req, res) => {
    logger.info("verifyPayment Order");
    const reqData = req.body;
    const loggedIn = req.driverId;
    const data = await paymentService.verify(reqData, loggedIn);
    logger.data("Payment verified & wallet credited", data);
    return responser.send(200, "Payment verified successfully", req, res, data);
};
