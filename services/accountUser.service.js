const accountUserModel = require("../models/accountUser.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError")
const userService = require("./user.services");
const APIFeatures = require("../utils/apiFeature")
const walletService = require("./wallet.service");
const { uploadOnCloudinary } = require("../core/cloudImage");
const mongoose = require("mongoose");
// const { sendPushNotificationToMultiple } = require("../utils/firebase/sendPushNotification");
// const { getUserFcmTokens } = require("./auth.service");

// Generate a new Mongo ObjectId
const newId = new mongoose.mongo.ObjectId();

module.exports.createRecord = async (object) => {
    const record = await accountUserModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await accountUserModel.findOne(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await accountUserModel.find(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await accountUserModel.findOneAndUpdate(condition, body, option);
    return record;
};

module.exports.createAccount = async (body, loggedInUser) => {
    logger.info("START: Creating account");
    const requiredFields = [
        "gender",
        "city",
        "state",
        "profilePicture"
    ];

    for (const field of requiredFields) {
        if (!body[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }
    const accountExists = await this.findOneRecord({ userId: loggedInUser?._id });
    if (accountExists) {
        throw new AppError(409, "Already Account Exists.You Can't Create Account")
    }
    if (body.profilePicture) {
        const singlePicture = await uploadOnCloudinary(body.profilePicture, "UserProfile");
        body.profilePicture = singlePicture?.secure_url;
    }

    // Prepare payload
    const payloadData = {
        userId: loggedInUser._id,
        createdBy: loggedInUser._id,
        updatedBy: loggedInUser._id,
        accountStatus: "active",
        profileCompleted: true,
        gender: body.gender,
        city: body.city,
        state: body.state,
        profilePicture: body.profilePicture,
        walletId: newId,
    };

    // Optional fields
    if (body.firstName) payloadData.firstName = body.firstName;
    if (body.lastName) payloadData.lastName = body.lastName;
    if (body.dob) payloadData.dob = body.dob;
    const record = await this.createRecord(payloadData);
    // TODO Create the wallet of the user
    const walletPayload = {
        accountUserId: record?._id,
        accountType: "user"
    }
    await walletService.createWallet(walletPayload, newId);
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const account = await this.findOneRecord({ _id: record._id }, "", populateQuery);
    return account;

};

// get all account 
module.exports.getAllDriverAccounts = async (query) => {
    logger.info("START:Get All Accounts");
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const record = await new APIFeatures(query)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(populateQuery)
        .limitFields(null, ['-__v'])
        .exec(accountUserModel);
    return record.data;
};

module.exports.getOneUserAccount = async (accountId) => {
    logger.info("START:Get only account");
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        { path: "walletId", select: ["_id", "balance"] },
    ];
    const account = await this.findOneRecord({ _id: accountId }, "-__v", populateQuery);
    if (!account) throw new AppError(404, "Account not found");
    return account;
};

// update api
module.exports.updateAccount = async (accountId, body) => {
    logger.info("START:Updating the account");

    const updatePayload = {
        updatedBy: body.userId,
    };

    if (body.dob) updatePayload.dob = body.dob;
    if (body.gender) updatePayload.gender = body.gender;
    if (body.city) updatePayload.city = body.city;
    if (body.state) updatePayload.state = body.state;
    if (body.firstName) updatePayload.firstName = body.firstName;
    if (body.lastName) updatePayload.lastName = body.lastName;

    if (body.profilePicture) {
        if (
            body.profilePicture.startsWith("https://") ||
            body.profilePicture.startsWith("http://")
        ) {
            updatePayload.profilePicture = body.profilePicture;
        } else {
            const singlePicture = await uploadOnCloudinary(body.profilePicture, "UserProfile");
            updatePayload.profilePicture = singlePicture?.secure_url;
        }
    }

    const record = await this.updateRecord({ _id: accountId }, updatePayload);
    if (!record) throw new AppError(404, "Account not found in collection");
    return record;
};

module.exports.deleteAccount = async (accountId) => {
    logger.info("START:Deleting the account");
    const update = await accountUserModel.findOneAndDelete({ _id: accountId });
    if (!update) throw new AppError(404, "account not found in collection");
    return true;
};

// get my account profile by loggedIn 
module.exports.myAccountLoggedIn = async (loggedIn) => {
    const condition = {
        userId: loggedIn._id
    }
    const select = "-__v";
    const populateData = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        { path: "walletId", select: ["_id", "balance"] },
    ];
    const account = await this.findOneRecord(condition, select, populateData);
    return account;
}