const bankTransferService = require("../services/bankTransfer.service.js");
const logger = require("../utils/logs");
const responser = require("../utils/responser")

class bankController {
    // 🟢 Bank Transfer Service
    createBankTransfer = async (req, res) => {
        const reqData = req.body;
        const loggedIn = req.driver;
        const result = await bankTransferService.createNewBankTransfer(reqData, loggedIn);
        return responser.send(201, "Bank Transfer Created", req, res, result);
    };

    getAllBankTransfers = async (req, res) => {
        const loggedInUser = req.driver;
        const result = await bankTransferService.getAllBankTransfers(loggedInUser, req.query);
        return responser.send(200, "Fetched All Bank Transfers", req, res, result);
    };

    getOneBankTransfer = async (req, res) => {
        const result = await bankTransferService.getOneBankTransfer(req.params.id);
        return responser.send(200, "Fetched Bank Transfer", req, res, result);
    };

    deleteBankTransfer = async (req, res) => {
        await bankTransferService.deleteBankTransfers(req.params.id);
        return responser.send(200, "Bank Transfer Deleted", req, res, true);
    };
}

module.exports = new bankController();