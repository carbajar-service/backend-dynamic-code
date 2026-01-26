const accountDriverModel = require("../models/accountDriver.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError")
const driverService = require("./driver.services");
const APIFeatures = require("../utils/apiFeature")
const walletService = require("./wallet.service");
const { uploadOnCloudinary } = require("../core/cloudImage");
const mongoose = require("mongoose");
const appEventEmitter = require("../utils/eventEmitter");
const { EVENTS } = require("../utils/events");

module.exports.createRecord = async (object) => {
    const record = await accountDriverModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await accountDriverModel.findOne(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await accountDriverModel.find(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await accountDriverModel.findOneAndUpdate(condition, body, option);
    return record;
};

// 1 create account
module.exports.createAccount = async (body, loggedInDriver) => {
    logger.info("START: Creating account");
    const requiredFields = [
        "gender",
        "city",
        "state",
        "pinCode",
        "address",
        "profileType"
    ];

    for (const field of requiredFields) {
        if (!body[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }
    const walletId = new mongoose.Types.ObjectId();
    const accountExists = await this.findOneRecord({ driverId: loggedInDriver?._id });
    if (accountExists) {
        throw new AppError(409, "Already Account Exists.You Can't Create Account")
    }
    if (body.profilePicture) {
        const singlePicture = await uploadOnCloudinary(body.profilePicture, "Profile");
        body.profilePicture = singlePicture?.secure_url;
    }

    // Prepare payload
    const payloadData = {
        driverId: loggedInDriver._id,
        createdBy: loggedInDriver._id,
        updatedBy: loggedInDriver._id,
        accountStatus: "pending",
        gender: body.gender,
        city: body.city,
        state: body.state,
        profilePicture: body.profilePicture,
        address: body.address,
        pinCode: body.pinCode,
        walletId: walletId,
        profileType: body.profileType
    };

    // Optional fields
    if (body.firstName) payloadData.firstName = body.firstName;
    if (body.lastName) payloadData.lastName = body.lastName;
    if (body.dob) payloadData.dob = body.dob;
    const record = await this.createRecord(payloadData);
    // TODO Create the wallet of the user
    const walletPayload = {
        accountDriverId: record?._id,
        accountType: "driver"
    }
    await walletService.createWallet(walletPayload, walletId);
    await driverService.updateRecord({ _id: loggedInDriver._id }, { accountId: record._id })
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const account = await this.findOneRecord({ _id: record._id }, "", populateQuery);
    return account;
};

// get all account new commit
module.exports.getAllDriverAccounts = async (query) => {
    logger.info("START:Get All Accounts");
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
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
        .exec(accountDriverModel);
    return record.data;
};

module.exports.getOneDriverAccount = async (accountId) => {
    logger.info("START:Get only account");
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        { path: "walletId", select: ["_id", "balance"] },
    ];
    const account = await this.findOneRecord({ _id: accountId }, "-__v", populateQuery);
    if (!account) throw new AppError(404, "account not found")
    return account;
};

module.exports.updateProfileStatus = async (loggedInDriver, body) => {
    logger.info("START: updating driver profile completion status");
    if (!loggedInDriver) {
        throw new AppError(401, "Unauthorized: driver not logged in");
    }
    const condition = { driverId: loggedInDriver._id };
    const profile = await this.findOneRecord(condition);
    if (!profile) {
        throw new AppError(404, "Account not found");
    }
    const updatePayload = {
        updatedBy: loggedInDriver._id
    };
    if (body.profileCompleted !== undefined) {
        const isProfileCompleted = Boolean(body.profileCompleted);
        if (isProfileCompleted) {
            if (!profile.vehiclesId || profile.vehiclesId.length === 0) {
                throw new AppError(400, "Add at least one vehicle to complete profile");
            }
            if (!profile.documentIds || profile.documentIds.length === 0) {
                throw new AppError(400, "Upload required documents to complete profile");
            }
        }
        updatePayload.profileCompleted = isProfileCompleted;
    }
    const updatedRecord = await this.updateRecord(condition, updatePayload);
    /**
     * 🔔 EMIT EVENT ONLY WHEN PROFILE IS COMPLETED
     */
    if (
        body.profileCompleted === true &&
        profile.profileCompleted === false
    ) {
        appEventEmitter.emit(EVENTS.PROFILE_COMPLETED, {
            driverId: loggedInDriver._id,
            accountDriverId: updatedRecord._id,
            source: "system",
            timestamp: new Date()
        });
    }
    logger.info("END: driver profile status updated");
    return updatedRecord;
};

// update api
module.exports.updateAccount = async (accountId, body) => {
    logger.info("START:Updating the account");

    const updatePayload = {
        updatedBy: body.driverId,
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
            const singlePicture = await uploadOnCloudinary(body.profilePicture, "Profile");
            updatePayload.profilePicture = singlePicture?.secure_url;
        }
    }
    const record = await this.updateRecord({ _id: accountId }, updatePayload);
    if (!record) throw new AppError(404, "Account not found in collection");
    return record;
};

module.exports.deleteAccount = async (accountId) => {
    logger.info("START:Deleting the account");
    const update = await accountDriverModel.findOneAndDelete({ _id: accountId });
    if (!update) throw new AppError(404, "account not found in collection");
    return true;
};

/**
 * =========================
 * GET DRIVER PROFILE
 * =========================
 */
module.exports.getProfile = async (loggedInDriver) => {
    logger.info("START: get driver profile");

    if (!loggedInDriver) {
        throw new AppError(401, "Unauthorized: driver not logged in");
    }

    const populateQuery = [
        {
            path: "driverId",
            select: ["_id", "username", "email", "phoneNumber", "accountType"]
        },
        {
            path: "vehiclesId",
            select: [
                "_id",
                "vehicleType",
                "vehicleName",
                "vehicleNumber",
                "vehicleStatus",
                "vehicleBrand",
                "vehicleModel",
                "numberOfSeats",
                "regYear",
                "vehicleRc"
            ]
        },
        {
            path: "documentIds",
            select: [
                "_id",
                "documentType",
                "documentStatus",
                "documentVerification",
                "documentNumber"
            ]
        },
        {
            path: "walletId",
            select: ["_id", "balance"]
        },
        {
            path: "createdBy",
            select: ["_id", "username"]
        },
        {
            path: "updatedBy",
            select: ["_id", "username"]
        }
    ];

    const profile = await accountDriverModel
        .findOne({ driverId: loggedInDriver._id })
        .select("-__v -verifiedBy -verifiedAt")
        .populate(populateQuery);

    if (!profile) {
        throw new AppError(404, "Driver profile not found");
    }

    logger.info("END: get driver profile");
    return profile;
};