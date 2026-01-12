const { MAX_RETRIES, RETRY_DELAY_MS } = require("../config/index");

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports.withRetry = async (handlerFn, payload, context = {}) => {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            return await handlerFn(payload);
        } catch (error) {
            if (attempt >= MAX_RETRIES) {
                throw error;
            }
            console.error(
                `Retry attempt ${attempt} failed for ${context.eventName}. Retrying...`
            );
            await wait(RETRY_DELAY_MS);
        }
    }
};
