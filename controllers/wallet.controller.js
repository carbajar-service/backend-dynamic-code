const walletService = require("../services/wallet.service.js");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

class WalletController {
    // Get My Wallet
    getMyWalletByDriver = async (req, res) => {
        const result = await walletService.getMyWalletByDriver(req.driverId);
        return responser.send(200, "User Wallet Fetched", req, res, result);
    };

    getTransactions = async (req, res) => {
        logger.info("Fetching wallet transactions");
        const ownerId = req.driverId;
        // 🔎 Query params
        let { page, limit, type, source } = req.query;
        // validation
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20;
        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 20;
        const data = await walletService.getTransactions(
            ownerId,
            page,
            limit,
        );
        logger.data("Transactions fetched successfully", data);
        return responser.send(
            200,
            "Transactions fetched successfully",
            req,
            res,
            data
        );
    }

}

module.exports = new WalletController();