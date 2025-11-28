const LeadModel = require("../models/lead.model");
const logger = require("../utils/logs");

// Run every minute
module.exports.run = async () => {
    try {
        logger.info("CRON: Checking leads to update showFlag...");
        const fifteenMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        // Find all leads that need update
        const leads = await LeadModel.find({
            showFlag: false,
            leadStatus: "NEW-LEAD",
            createdAt: { $lte: fifteenMinutesAgo }
        });

        if (!leads.length) {
            logger.info("CRON: No leads to update for showFlag");
            return;
        }
        logger.info(`CRON: Found ${leads.length} leads to update`);
        for (const lead of leads) {
            lead.showFlag = true;
            lead.updatedAt = new Date();
            await lead.save();
            logger.info(`CRON: showFlag updated for Lead ID: ${lead._id}`);
        }
    } catch (error) {
        logger.error("CRON ERROR (showFlag):", error);
    }
};
