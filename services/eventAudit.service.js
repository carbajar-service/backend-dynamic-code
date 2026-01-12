const EventAuditLog = require("../models/eventAuditLog.model");

module.exports.logEvent = async ({
    eventName,
    payload,
    source,
    req // optional
}) => {
    const logPayload = {
        eventName,
        driverId: payload?.driverId,
        accountDriverId: payload?.accountDriverId,
        vehicleId: payload?.vehicleId,
        documentId: payload?.documentId,
        source,
        payload
    };

    if (req) {
        logPayload.ipAddress = req.ip;
        logPayload.userAgent = req.headers["user-agent"];
    }

    await EventAuditLog.create(logPayload);
};
