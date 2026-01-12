const DLQModel = require("../models/deadLetterQueue.model");

module.exports.pushToDLQ = async ({
    eventName,
    payload,
    error,
    retryCount
}) => {
    await DLQModel.create({
        eventName,
        payload,
        errorMessage: error.message,
        errorStack: error.stack,
        retryCount
    });
};
