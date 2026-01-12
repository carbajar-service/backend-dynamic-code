const appEventEmitter = require("../utils/eventEmitter");
const { EVENTS } = require("../utils/events");
const eventAuditService = require("../services/eventAudit.service");

Object.values(EVENTS).forEach((eventName) => {
    appEventEmitter.on(eventName, async (payload) => {
        try {
            await eventAuditService.logEvent({
                eventName,
                payload,
                source: payload.source || "system"
            });
        } catch (err) {
            console.error("Audit log failed:", err);
        }
    });
});
