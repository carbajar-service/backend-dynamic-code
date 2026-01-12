const appEventEmitter = require("../utils/eventEmitter");
const { EVENTS } = require("../utils/events");
const logger = require("../utils/logs");
const { withRetry } = require("../utils/retryHandler");
const dlqService = require("../services/dlq.service");
const emailService = require("../services/sms/email");
const { profileCompletedEmail } = require("../services/sms/templates/profileCompleted.email");
const driverModel = require("../models/driver.model");

appEventEmitter.on(EVENTS.PROFILE_COMPLETED, async (payload) => {
    try {
        logger.info(`EVENT: PROFILE_COMPLETED for driver ${payload.driverId}`);
        // ✅ Fetch driver ONCE
        const driver = await driverModel.findById(payload.driverId).lean();
        if (!driver || !driver.email) {
            throw new Error("Driver or email not found");
        }
        const driverName = `${driver.username}`.trim();
        const response = await emailService.sendEmail({
            from: "Web-Lead",
            to: driver.email,
            bcc: "sayeemroyal@gmail.com",
            subject: "Profile Completed 🎉",
            html: profileCompletedEmail({ driverName }),
        });
        logger.data("email send", response?.response)
    } catch (error) {
        logger.error("PROFILE_COMPLETED email failed", error);
        // ☠️ Push to DLQ
        await dlqService.pushToDLQ({
            eventName: EVENTS.PROFILE_COMPLETED,
            payload,
            error,
            retryCount: 3
        });
    }
});
