const logger = require("../utils/logs");
const AppError = require("../utils/appError")
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// custom packages
const adminModel = require("../models/admin.model");
const tokenService = require("../middlewares/token");
const { generateOTP, generateUniqueUsername } = require('../utils/utils');
const sms = require('./sms/fast2sms');

const userModel = require("../models/user.model");
const driverModel = require("../models/driver.model");
const accountDriverModel = require("../models/accountDriver.model");
const accountUserModel = require("../models/accountUser.model");
const vehicleModel = require("../models/vehicle.model");
const driverDocumentModel = require("../models/driverDocument.model");
const leadModel = require("../models/lead.model");
const APIFeatures = require("../utils/apiFeature");

// register admin
module.exports.adminRegister = async (body) => {
    logger.info("admin registration started");
    if (!body.email) throw new AppError(404, "Email Required");
    if (!body.phoneNumber) throw new AppError(404, "Phone Number Required");
    if (!body.password) throw new AppError(404, "Password Required");

    const isEmailExist = await adminModel.findOne({ email: body.email });
    if (isEmailExist) throw new AppError(429, "Email already exists");

    const isPhoneExist = await adminModel.findOne({ phoneNumber: body.phoneNumber });
    if (isPhoneExist) throw new AppError(429, "Phone number already exists");

    const hashedPassword = bcrypt.hashSync(body.password, 10);
    const payload = {
        username: generateUniqueUsername('ADMIN'),
        fullName: body.fullName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        isAdmin: true,
        phoneOTP: generateOTP(),
    };
    logger.info(payload);
    const adminCreation = await adminModel.create(payload);
    const admin = await adminModel.findOne({ _id: adminCreation._id }).select("-password -__v")
    // await sms.smsOTPV2(admin);
    admin.phoneOTP = undefined;
    return admin
};

module.exports.adminLogin = async (body) => {
    logger.info(`Login service started`);

    // Check if the login is with email/phone and password OR phoneNumber and OTP
    if (!(body.email || body.phoneNumber)) {
        throw new AppError(400, 'Email or Phone Number is required');
    }

    if (!(body.password || body.phoneOTP)) {
        throw new AppError(400, 'Password or OTP is required');
    }

    let filter = {};

    // Build filter based on email or phoneNumber
    if (body.email) {
        filter.email = body.email;
    } else if (body.phoneNumber) {
        filter.phoneNumber = body.phoneNumber;
    }

    // Find user by email or phoneNumber
    const admin = await adminModel.findOne(filter);
    if (!admin) {
        throw new AppError(404, 'admin does not exist');
    }

    // If login is via password
    if (body.password) {
        const isPasswordValid = bcrypt.compareSync(body.password, admin.password);
        if (!isPasswordValid) {
            throw new AppError(401, 'Invalid credentials');
        }
    }

    // If login is via OTP
    if (body.phoneOTP) {
        if (body.phoneOTP !== String(admin.phoneOTP)) {
            throw new AppError(401, 'Invalid OTP');
        }
        // If OTP is valid, mark phone as verified and reset OTP
        await adminModel.findOneAndUpdate(
            { _id: admin._id },
            { phoneOTP: null, }
        );
    }

    // Generate tokens
    const accessToken = tokenService.signToken(admin._id, 'access');
    const refreshToken = tokenService.signToken(admin._id, 'refresh');

    const record = {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        accountType: admin.accountType,
        accessToken,
        refreshToken,
    };

    return record;
};

module.exports.refreshOtp = async (body) => {
    logger.info("Refresh service Starting");
    const filter = { phoneNumber: body.phoneNumber };
    const admin = await adminModel.findOne(filter);
    if (!admin) {
        throw new AppError(404, "Your not a existing admin.Register first!");
    }
    const option = { new: true };
    const record = await adminModel.findOneAndUpdate(
        { _id: admin.id },
        { phoneOTP: generateOTP() },
        option
    );
    await sms.smsOTPV2(record);
    logger.info(record);
    record.phoneOTP = undefined;
    return record;
};

// get all users 
module.exports.getAllUsersProfiles = async (query) => {
    logger.info(`Get All Users Public`);
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const record = await new APIFeatures(query)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(populateQuery)
        .exec(accountUserModel);
    return record.data;
};

// get single user by id
module.exports.getSingleUserId = async (userId) => {
    logger.info("START:Get only account");
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const user = await accountUserModel.findOne({ _id: userId }).populate(populateQuery);
    if (!user) throw new AppError(404, "User not found")
    return user;
};

const driverPopulateQuery = [
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
        ]
    },
    {
        path: "documentIds",
        select: [
            "_id",
            "documentType",
            "documentStatus",
            "documentVerification"
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
// get all driver
module.exports.getAllDriversProfiles = async (query) => {
    logger.info(`Get All Drivers Public`);
    const record = await new APIFeatures(query)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(driverPopulateQuery)
        .exec(accountDriverModel);
    return record.data;
};

// get single driver by id
module.exports.getSingleDriver = async (driverId) => {
    logger.info("START:Get only one driver");
    const driver = await accountDriverModel.findOne({ _id: driverId }).populate(driverPopulateQuery);
    if (!driver) throw new AppError(404, "Driver not found")
    return driver;
};

// get all leads
module.exports.getAllLeads = async (query) => {
    logger.info(`Get All Leads Public`);
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const record = await new APIFeatures(query)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(populateQuery)
        .exec(leadModel);
    return record.data;
};

// get single driver by id
module.exports.getSingleLead = async (leadId) => {
    logger.info("START:Get only one lead");
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "walletId", select: ["_id", "balance"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const lead = await leadModel.findOne({ _id: leadId }).populate(populateQuery);
    if (!lead) throw new AppError(404, "Lead not found")
    return lead;
};

// 10. get all users counts
// 11. get all drivers counts
// 12. get all agency's
// 13. get single agency by id
// 16. get lead by users
// 17. get lead by drivers
// 18. get lead by agency
// 19. filter api for lead
// 20. assign lead to driver or agency
// 21. assign/remove lead 

// 7. approve driver profile / get 
// TODO
module.exports.approveDriverFullProfileTx = async (accountDriverId, data, adminId) => {
    logger.info("START: Approve full driver profile (TX)");

    if (!accountDriverId) {
        throw new AppError(400, "accountDriverId is required");
    }

    if (!["approved", "rejected"].includes(data.status)) {
        throw new AppError(400, "Invalid status value");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        /* ======================================================
           FETCH DRIVER ACCOUNT
        ====================================================== */
        const accountDriver = await accountDriverModel
            .findById(accountDriverId)
            .session(session);

        if (!accountDriver) {
            throw new AppError(404, "Driver account not found");
        }

        const driverId = accountDriver.driverId;

        /* ======================================================
           OPTIONAL SAFETY CHECK (ONLY WHEN APPROVING)
        ====================================================== */
        if (data.status === "approved") {
            const pendingVehicles = await vehicleModel.countDocuments({
                driverId,
                vehicleStatus: { $ne: "approved" }
            }).session(session);

            const pendingDocs = await driverDocumentModel.countDocuments({
                driverId,
                documentStatus: { $ne: "approved" }
            }).session(session);

            if (pendingVehicles > 0 || pendingDocs > 0) {
                throw new AppError(
                    400,
                    "All vehicles and documents must be approved first"
                );
            }
        }

        /* ======================================================
           1️⃣ UPDATE VEHICLES (ALL)
        ====================================================== */
        await vehicleModel.updateMany(
            { driverId },
            {
                $set: {
                    vehicleStatus: data.status,
                    rejectionReason:
                        data.status === "rejected" ? data.rejectionReason : null
                }
            },
            { session }
        );

        /* ======================================================
           2️⃣ UPDATE DOCUMENTS (ALL)
        ====================================================== */
        await driverDocumentModel.updateMany(
            { driverId },
            {
                $set: {
                    documentStatus: data.status,
                    documentVerification: true,
                    rejectionReason:
                        data.status === "rejected" ? data.rejectionReason : null,
                    verifiedBy: adminId,
                    verifiedAt: new Date()
                }
            },
            { session }
        );

        /* ======================================================
           3️⃣ UPDATE DRIVER PROFILE (FINAL DECISION)
        ====================================================== */
        await accountDriverModel.findByIdAndUpdate(
            accountDriverId,
            {
                $set: {
                    accountStatus: data.status,
                    documentVerification: true,
                    documentRejectionReason:
                        data.status === "rejected" ? data.documentRejectionReason : null
                }
            },
            { session }
        );

        /* ======================================================
           COMMIT
        ====================================================== */
        await session.commitTransaction();
        session.endSession();

        logger.info("END: Full driver approval committed");

        return {
            message: `Driver ${data.status} successfully`,
            driverId,
            status: data.status
        };

    } catch (error) {
        /* ======================================================
           ROLLBACK
        ====================================================== */
        await session.abortTransaction();
        session.endSession();

        logger.error("TX FAILED: Driver approval rolled back", error);
        throw error;
    }
};
