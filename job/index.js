const cron = require("node-cron");
const leadCron = require("./lead");

cron.schedule("*/2 * * * *", leadCron.run);
