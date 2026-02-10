import { bankTransferModel } from "../models/bankTransfer.model.js";
import * as logger from "../utils/log.js";
import AppError from "../core/appError.js";
import * as accountService from "./account.service.js"

export const createRecord = async (object) => {
    const record = await bankTransferModel.create(object);
    return record;
};

export const findOneRecord = async (conditions, select, populateQuery) => {
    const record = await bankTransferModel.findOne(conditions).select(select)
        .populate(populateQuery);
    return record;
};

export const findAllRecord = async (conditions, select, populateQuery) => {
    const records = await bankTransferModel.find(conditions).select(select)
        .populate(populateQuery);
    return records;
};

export const updateRecord = async (condition, body) => {
    const option = { new: true };
    const record = await bankTransferModel.findOneAndUpdate(condition, body, option);
    return record;
};

// GET BankTransfer
export const createNewBankTransfer = async (data) => {
    logger.info("START: Creating Bank Transfer in Service");

    // Basic validation
    if (!data.accountNumber) throw new AppError(400, "Account Number is required");
    if (!data.ifscCode) throw new AppError(400, "IFSC Code is required");
    if (!data.bankName) throw new AppError(400, "Bank Name is required");
    if (!data.accountHolderName) throw new AppError(400, "Account Holder Name is required");
    const account = await accountService.findOneRecord({ userId: data.userId });
    if (!account) throw new AppError("404", "Account Not Found")
    const existing = await findOneRecord({
        accountId: account._id,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode
    });
    if (existing) {
        throw new AppError(409, "Bank account with this IFSC and account number already exists");
    }
    const payload = {
        accountId: account._id,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        cardName: data.cardName || null
    };
    const created = await createRecord(payload);
    logger.info("END: Created Bank Transfer Successfully");
    return created;
};

// BankTransfer for admin
export const getOneBankTransfer = async (bankTransferId) => {
    logger.info("START: Get One Bank Transfer in Service");
    const populateData = [{ path: "accountId", select: ["_id", "firstName", "lastName", "userId"] }]
    const bank = await findOneRecord({ _id: bankTransferId }, "", populateData);
    logger.info("END: Get Bank Transfer Successfully");
    return bank;
};

// Get All BankTransfer 
export const getAllBankTransfers = async (loggedIn, query) => {
    logger.info("START: Get One Bank Transfer in Service");
    const populateData = [{ path: "accountId", select: ["_id", "firstName", "lastName", "userId"] }];
    // check 
    const account = await accountService.findOneRecord({ userId: loggedIn._id });
    if (!account) throw new AppError("404", "Account Not Found")
    const condition = {
        accountId: account._id
    }
    const bank = await findAllRecord(condition, "", populateData);
    logger.info("END: Get All Bank Transfer Successfully");
    return bank;
};

// Delete BankTransfer 
export const deleteBankTransfers = async (bankTransferId) => {
    logger.info("START: Delete Bank Transfer in Service");
    const bank = await bankTransferModel.findByIdAndDelete({ _id: bankTransferId })
    logger.info("END: Delete Bank Transfer Successfully");
    return true;
};

