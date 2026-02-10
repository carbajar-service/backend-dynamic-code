import { upiModel } from "../models/upi.model.js";
import * as logger from "../utils/log.js";
import AppError from "../core/appError.js";
import * as accountService from "./account.service.js"

export const createRecord = async (object) => {
    const record = await upiModel.create(object);
    return record;
};

export const findOneRecord = async (conditions, select, populateQuery) => {
    const record = await upiModel.findOne(conditions)
        .select(select).populate(populateQuery);
    return record;
};

export const findAllRecord = async (conditions, select, populateQuery) => {
    const records = await upiModel.find(conditions)
        .select(select).populate(populateQuery);
    return records;
};

export const updateRecord = async (condition, body) => {
    const option = { new: true };
    const record = await upiModel.findOneAndUpdate(condition, body, option);
    return record;
};

// Create New UPI
export const createNewUpi = async (data) => {
    logger.info("START: Creating UPI in Service");

    if (!data.upiId) throw new AppError(400, "UPI ID is required");
    if (!data.upiHolderName) throw new AppError(400, "UPI Holder Name is required");

    const account = await accountService.findOneRecord({ userId: data.userId });
    if (!account) throw new AppError("404", "Account Not Found");

    const existing = await findOneRecord({
        accountId: account._id,
        upiId: data.upiId
    });
    if (existing) {
        throw new AppError(409, "This UPI ID is already registered");
    }

    const payload = {
        accountId: account._id,
        upiId: data.upiId,
        upiHolderName: data.upiHolderName,
        upiType: data.upiType || null // optional: like PhonePe / GPay etc.
    };
    
    const created = await createRecord(payload);
    logger.info("END: Created UPI Successfully");
    return created;
};

// Get One UPI (Admin)
export const getOneUpi = async (upiId) => {
    logger.info("START: Get One UPI in Service");
    const populateData = [{ path: "accountId", select: ["_id", "firstName", "lastName", "userId"] }];
    const upi = await findOneRecord({ _id: upiId }, "", populateData);
    logger.info("END: Get One UPI Successfully");
    return upi;
};

// Get All UPIs (for user)
export const getAllUpis = async (loggedIn, query) => {
    logger.info("START: Get All UPIs in Service");

    const account = await accountService.findOneRecord({ userId: loggedIn._id });
    if (!account) throw new AppError("404", "Account Not Found");

    const condition = {
        accountId: account._id
    };

    const populateData = [{ path: "accountId", select: ["_id", "firstName", "lastName", "userId"] }];
    const upis = await findAllRecord(condition, "", populateData);

    logger.info("END: Get All UPIs Successfully");
    return upis;
};

// Delete UPI
export const deleteUpi = async (upiId) => {
    logger.info("START: Delete UPI in Service");
    await upiModel.findByIdAndDelete({ _id: upiId });
    logger.info("END: Delete UPI Successfully");
    return true;
};
