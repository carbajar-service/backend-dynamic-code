const mongoose = require("mongoose");
const schema = mongoose.Schema;

const deadLetterQueueSchema = new schema(
    {
        eventName: { type: String, required: true },
        payload: { type: Object, required: true },
        errorMessage: { type: String },
        errorStack: { type: String },
        failedAt: { type: Date, default: Date.now },
        retryCount: { type: Number }
    },
    { timestamps: true }
);

module.exports = mongoose.model("deadLetterQueue", deadLetterQueueSchema);
