import * as upiService from "../services/upi.service.js";
import * as bankTransferService from "../services/bankTransfer.service.js";
import * as responser from "../core/responser.js";

class bankController {
    // 🟢 UPI Service
    createUpi = async (req, res) => {
        const reqData = req.body;
        reqData.userId = req.userId;
        const result = await upiService.createNewUpi(reqData);
        return responser.send(201, "UPI Created", req, res, result);
    };

    getAllUpis = async (req, res) => {
        const loggedInUser = req.user;
        const result = await upiService.getAllUpis(loggedInUser, req.query);
        return responser.send(200, "Fetched All UPIs", req, res, result);
    };

    getOneUpi = async (req, res) => {
        const result = await upiService.getOneUpi(req.params.id);
        return responser.send(200, "Fetched Single UPI", req, res, result);
    };

    deleteUpi = async (req, res) => {
        await upiService.deleteUpi(req.params.id);
        return responser.send(200, "UPI Deleted Successfully", req, res, true);
    };

    // 🟢 Bank Transfer Service
    createBankTransfer = async (req, res) => {
        const reqData = req.body;
        reqData.userId = req.userId;
        const result = await bankTransferService.createNewBankTransfer(reqData);
        return responser.send(201, "Bank Transfer Created", req, res, result);
    };

    getAllBankTransfers = async (req, res) => {
        const loggedInUser = req.user;
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

export default new bankController();
