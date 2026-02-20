const accountAgencyModel = require("../models/agencyProfile.model");
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
    const record = await accountAgencyModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await accountAgencyModel.findOne(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await accountAgencyModel.find(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await accountAgencyModel.findOneAndUpdate(condition, body, option);
    return record;
};

// 1 create account
module.exports.createAccount = async (body, loggedInAgency) => {
    logger.info("START: Creating account");

    const requiredFields = [
        "agencyName",
        "city",
        "state",
        "pinCode",
        "address",
        "ownerName"
    ];

    for (const field of requiredFields) {
        if (!body[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }
    const walletId = new mongoose.Types.ObjectId();
    const accountExists = await this.findOneRecord({ agencyId: loggedInAgency?._id });
    if (accountExists) {
        throw new AppError(409, "Already Account Exists.You Can't Create Account")
    }
    if (body.profilePicture) {
        const singlePicture = await uploadOnCloudinary(body.profilePicture, "Profile");
        body.profilePicture = singlePicture?.secure_url;
    }

    // Prepare payload
    const payloadData = {
        agencyId: loggedInAgency._id,
        createdBy: loggedInAgency._id,
        updatedBy: loggedInAgency._id,
        agencyStatus: "pending",
        gender: body.gender,
        city: body.city,
        ownerName: body.ownerName,
        state: body.state,
        profilePicture: body.profilePicture,
        address: body.address,
        pinCode: body.pinCode,
        agencyName: body.agencyName,
        walletId: walletId
    };

    // Optional fields
    if (body.gstNumber) payloadData.gstNumber = body.gstNumber;
    if (body.panNumber) payloadData.panNumber = body.panNumber;

    const record = await this.createRecord(payloadData);
    // TODO Create the wallet of the user
    const walletPayload = {
        accountagencyId: record?._id,
        accountType: "driver"
    }
    await walletService.createWallet(walletPayload, walletId);
    await driverService.updateRecord({ _id: loggedInAgency._id }, { accountId: record._id })
    const populateQuery = [
        { path: "agencyId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const account = await this.findOneRecord({ _id: record._id }, "", populateQuery);
    return account;
};

// get all account new commit
module.exports.getAllAgencyAccounts = async (query) => {
    logger.info("START:Get All Accounts");
    const populateQuery = [
        { path: "agencyId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
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
        .exec(accountAgencyModel);
    return record.data;
};

module.exports.getOneAgencyAccount = async (accountId) => {
    logger.info("START:Get only account");
    const populateQuery = [
        { path: "agencyId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        { path: "walletId", select: ["_id", "balance"] },
    ];
    const account = await this.findOneRecord({ _id: accountId }, "-__v", populateQuery);
    if (!account) throw new AppError(404, "account not found")
    return account;
};

module.exports.updateProfileStatus = async (loggedInAgency, body) => {
    logger.info("START: updating agency profile completion status");
    if (!loggedInAgency) {
        throw new AppError(401, "Unauthorized: agency not logged in");
    }
    const condition = { agencyId: loggedInAgency._id };
    const profile = await this.findOneRecord(condition);
    if (!profile) {
        throw new AppError(404, "Account not found");
    }
    const updatePayload = {
        updatedBy: loggedInAgency._id
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
            agencyId: loggedInAgency._id,
            accountAgencyId: updatedRecord._id,
            source: "system",
            timestamp: new Date()
        });
    }
    logger.info("END: agency profile status updated");
    return updatedRecord;
};

// update api
module.exports.updateAccount = async (accountId, body) => {
    logger.info("START:Updating the account");

    const updatePayload = {
        updatedBy: body.agencyId,
    };
    if (body.gstNumber) updatePayload.gstNumber = body.gstNumber;
    if (body.agencyName) updatePayload.agencyName = body.agencyName;
    if (body.panNumber) updatePayload.panNumber = body.panNumber;
    if (body.ownerName) updatePayload.ownerName = body.ownerName;
    if (body.pinCode) updatePayload.pinCode = body.pinCode;
    if (body.address) updatePayload.address = body.address;
    // todo update gpr vehicle docs
    if (body.city) updatePayload.city = body.city;
    if (body.state) updatePayload.state = body.state;
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
    const update = await accountAgencyModel.findOneAndDelete({ _id: accountId });
    if (!update) throw new AppError(404, "account not found in collection");
    return true;
};

/**
 * =========================
 * GET DRIVER PROFILE
 * =========================
 */
module.exports.getProfile = async (loggedInAgency) => {
    logger.info("START: get driver profile");

    if (!loggedInAgency) {
        throw new AppError(401, "Unauthorized: driver not logged in");
    }

    const populateQuery = [
        {
            path: "agencyId",
            select: ["_id", "username", "email", "phoneNumber", "accountType"]
        },
        {
            path: "vehicleIds",
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
                "vehicleRc",
                "vehicleRcImages",
                "vehicleImages"
            ]
        },
        {
            path: "documentIds",
            select: [
                "_id",
                "documentType",
                "documentStatus",
                "documentVerification",
                "documentNumber",
                "documentImages"
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

    const profile = await accountAgencyModel
        .findOne({ agencyId: loggedInAgency._id })
        .select("-__v -verifiedBy -verifiedAt")
        .populate(populateQuery);

    if (!profile) {
        throw new AppError(404, "Driver profile not found");
    }

    logger.info("END: get driver profile");
    return profile;
};