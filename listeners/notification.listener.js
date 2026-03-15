const appEventEmitter = require("../utils/eventEmitter");
const { EVENTS } = require("../utils/events");
const logger = require("../utils/logs");
const { withRetry } = require("../utils/retryHandler");
const dlqService = require("../services/dlq.service");
const accountDriverModel = require("../models/accountDriver.model");
const accountAgencyModel = require("../models/agencyProfile.model");
const fcmTokenService = require("../services/driver.services");
const { sendPushNotificationToMultiple } = require("../services/firebase/sendPushNotification")

appEventEmitter.on(EVENTS.LEAD_CREATED, async (payload) => {
    try {

        const { leadRecord } = payload;
        const city = leadRecord.userCity;

        logger.info(`EVENT: LEAD_CREATED ${leadRecord._id}`);
        logger.info(`Finding drivers & agencies in city ${city}`);

        // 1️⃣ Find drivers
        const drivers = await accountDriverModel
            .find({ city })
            .select("driverId");

        // 2️⃣ Find agencies
        const agencies = await accountAgencyModel
            .find({ city })
            .select("agencyId");

        if (!drivers.length && !agencies.length) {
            logger.warn("No drivers or agencies found in this city");
            return;
        }

        // 3️⃣ Extract IDs
        const driverIds = drivers.map(d => d.driverId);
        const agencyIds = agencies.map(a => a.agencyId);

        // 4️⃣ Get FCM tokens
        const driverTokens = driverIds.length
            ? await fcmTokenService.getUserFcmTokens(driverIds)
            : [];

        const agencyTokens = agencyIds.length
            ? await fcmTokenService.getUserFcmTokens(agencyIds)
            : [];

        // 5️⃣ Merge tokens
        const tokens = [...driverTokens, ...agencyTokens];

        if (!tokens.length) {
            logger.info("No FCM tokens found for drivers/agencies");
            return;
        }

        const notificationMessage = `New ${leadRecord.tripType} trip available`;

        const data = {
            type: "lead",
            leadId: leadRecord._id.toString(),
            ownerId: leadRecord.userId?.toString()
        };

        // 6️⃣ Send push notification
        await sendPushNotificationToMultiple(
            tokens,
            "New Lead Available",
            notificationMessage,
            data
        );

        logger.info(`Notification sent to ${tokens.length} devices`);

    } catch (error) {
        logger.error("LEAD_CREATED push notification failed", error);
        await dlqService.pushToDLQ({
            eventName: EVENTS.LEAD_CREATED,
            payload,
            error,
            retryCount: 3
        });
    }
});