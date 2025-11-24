const walletService = require("../services/wallet.service.js");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

class WalletController {
    // Get My Wallet
    getMyWalletByDriver = async (req, res) => {
        const result = await walletService.getMyWalletByDriver(req.driverId);
        return responser.send(200, "User Wallet Fetched", req, res, result);
    };
}

module.exports = new WalletController();