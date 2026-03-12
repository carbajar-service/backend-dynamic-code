// models/notification.model.js
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const notificationSchema = new schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "driver",
        required: true
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tokens: [{ type: String }], // device tokens used
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    responses: { type: Object }, // full firebase response
    image: { type: String },
    type: {
        type: String,
        enum: ["transaction", "account", "wallet_credit", "lead"],
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("notification", notificationSchema);


// this is in driverservice
// const tokens = await getUserFcmTokens(record.userId);
// const _data = {
//     userId: record.userId,
//     type: "account",
//     image: record.profilePicture
// }
// this is in firebase push notification
// await sendPushNotificationToMultiple(tokens, "Profile Update", notificationMessage, _data);
