const logger = require("../../utils/logs");
const AppError = require("../../utils/appError");
const axios = require("axios");
const config = require("../../config/index");

module.exports.smsOTPV2 = async (payload) => {
    try {
        logger.data("Sending OTP:", payload.phoneOTP);
        const message = `Dear User ${payload.phoneOTP} is the OTP for your login at CarBajar. Enjoy the service! carbajar.com`;
        const response = await axios.get(
            "http://bulksms.saakshisoftware.in/api/mt/SendSMS",
            {
                params: {
                    user: config.SMS_USER,
                    password: config.SMS_PASSWORD,
                    senderid: config.SMS_SENDER,
                    channel: config.SMS_CHANNEL,
                    DCS: 0,
                    flashsms: 0,
                    number: payload.phoneNumber,
                    text: message,
                    route: config.SMS_ROUTE,
                    DLTTemplateId: config.SMS_OTP_TEMPLATE_ID,
                    PEID: config.SMS_PEID,
                },
            }
        );

        logger.data("SMS Response:", response.data);

        return response.data;

    } catch (err) {
        const errData = err?.response?.data?.ErrorMessage || err.message;
        logger.error("SMS Error:", errData);

        throw new AppError(400, "SMS Sending Failed", errData);
    }
};
