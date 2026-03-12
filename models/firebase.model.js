const mongoose = require("mongoose");
const schema = mongoose.Schema;

const fcmTokenSchema = new schema(
    {
        ownerId: { type: schema.Types.ObjectId, ref: "driver", required: true },
        fcmToken: {
            type: String,
            required: true,
        },
        deviceType: {
            type: String,
            enum: ["android", "ios", "web","unknown"],
            default: "android",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("firebase", fcmTokenSchema);
