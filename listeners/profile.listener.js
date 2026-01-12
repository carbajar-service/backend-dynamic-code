const appEventEmitter = require("../utils/eventEmitter");
const { EVENTS } = require("../utils/events");
const logger = require("../utils/logs");

appEventEmitter.on(EVENTS.PROFILE_COMPLETED, async (payload) => {
    try {
        logger.info(`EVENT: PROFILE_COMPLETED for driver ${payload.driverId}`);
        const data = payload
        logger.info(data);

        // ✅ Examples of what you can do here:
        // - Send notification
        // - Send email
        // - Update analytics
        // - Unlock features
        // - Auto-submit for admin approval

        // Example:
        // await notificationService.sendProfileCompleted(payload.driverId);

    } catch (error) {
        logger.error("PROFILE_COMPLETED event failed", error);
    }
});
