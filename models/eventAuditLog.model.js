const mongoose = require("mongoose");
const schema = mongoose.Schema;

const eventAuditLogSchema = new schema(
    {
        eventName: { type: String, required: true },
        driverId: { type: schema.Types.ObjectId, ref: "driver" },
        accountDriverId: { type: schema.Types.ObjectId, ref: "accountDriver" },
        vehicleId: { type: schema.Types.ObjectId, ref: "vehicle" },
        documentId: { type: schema.Types.ObjectId, ref: "driverDocument" },
        source: {
            type: String,
            enum: ["driver", "admin", "system"],
            required: true
        },
        payload: { type: Object }, // full raw payload (for debugging)
        ipAddress: { type: String },
        userAgent: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model("eventAuditLog", eventAuditLogSchema);
