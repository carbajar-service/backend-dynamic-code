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

// accept vehicle 
module.exports.approveVehicleTx = async (vehicleId, data, adminId) => {
    logger.info("START: Approve vehicle (TX)");
    if (!vehicleId) {
        throw new AppError(400, "vehicleId is required");
    }
    if (!["approved", "rejected"].includes(data.status)) {
        throw new AppError(400, "Invalid status value");
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1️⃣ Fetch vehicle
        const vehicle = await vehicleModel
            .findOne({ _id: vehicleId })
            .session(session);
        if (!vehicle) {
            throw new AppError(404, "Vehicle not found");
        }

        // 2️⃣ Prepare update payload
        const updatePayload = {
            vehicleStatus: data.status,
            verifiedBy: adminId,
            verifiedAt: new Date(),
        };

        if (data.status === "rejected") {
            if (!data.vehicleRejectionReason) {
                throw new AppError(400, "vehicleRejectionReason is required");
            }
            updatePayload.vehicleRejectionReason = data.vehicleRejectionReason;
        }

        // 3️⃣ Update vehicle
        await vehicleModel.findOneAndUpdate(
            { _id: vehicle._id },
            { $set: updatePayload },
            { session, new: true }
        );

        // 4️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();

        logger.info("END: Vehicle approval committed");

        return {
            message: `Vehicle ${data.status} successfully`,
            vehicleId,
            status: data.status,
            verifiedBy: adminId
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error("TX FAILED: Vehicle approval rolled back", error);
        throw error;
    }
};

// accept docs
module.exports.approveDocumentTx = async (documentId, data, adminId) => {
    logger.info("START: Approve document (TX)");

    if (!documentId) {
        throw new AppError(400, "documentId is required");
    }

    if (!["approved", "rejected"].includes(data.status)) {
        throw new AppError(400, "Invalid status value");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1️⃣ Fetch document
        const document = await driverDocumentModel
            .findOne({ _id: documentId })
            .session(session);

        if (!document) {
            throw new AppError(404, "Document not found");
        }

        // 2️⃣ Prepare update payload
        const updatePayload = {
            documentStatus: data.status,
            documentVerification: data.status === "approved",
            verifiedBy: adminId,
            verifiedAt: new Date()
        };

        // If rejected → reason is mandatory
        if (data.status === "rejected") {
            if (!data.documentRejectionReason) {
                throw new AppError(400, "documentRejectionReason is required");
            }
            updatePayload.documentRejectionReason = data.documentRejectionReason;
        }

        // 3️⃣ Update document
        await driverDocumentModel.findOneAndUpdate(
            { _id: document._id },
            { $set: updatePayload },
            { session, new: true }
        );

        // 4️⃣ Commit
        await session.commitTransaction();
        session.endSession();

        logger.info("END: Document approval committed");

        return {
            message: `Document ${data.status} successfully`,
            documentId,
            status: data.status,
            verifiedBy: adminId
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error("TX FAILED: Document approval rolled back", error);
        throw error;
    }
};

// accept profile
module.exports.approveDriverProfileTx = async (accountDriverId, data, adminId) => {
    logger.info("START: Approve driver profile (TX)");

    if (!accountDriverId) {
        throw new AppError(400, "accountDriverId is required");
    }

    if (!["approved", "rejected"].includes(data.status)) {
        throw new AppError(400, "Invalid status value");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1️⃣ Fetch account driver
        const accountDriver = await accountDriverModel
            .findOne({ _id: accountDriverId })
            .session(session);

        if (!accountDriver) {
            throw new AppError(404, "Driver account not found");
        }

        const driverId = accountDriver.driverId;

        // 2️⃣ Safety check when approving
        if (data.status === "approved") {
            const pendingVehicles = await vehicleModel.countDocuments({
                driverId,
                vehicleStatus: { $ne: "approved" }
            }).session(session);

            const pendingDocs = await driverDocumentModel.countDocuments({
                driverId,
                documentStatus: { $ne: "approved" }
            }).session(session);

            // if (pendingDocs > 0) {
            //     throw new AppError(
            //         400,
            //         "All documents must be approved first"
            //     );
            // }
        }

        // 3️⃣ Prepare update payload
        const updatePayload = {
            accountStatus: data.status,
            documentVerification: data.status === "approved",
            reasonForRejection: null,
            verifiedBy: adminId,
            verifiedAt: new Date(),
        };

        // Rejection reason mandatory if rejected
        if (data.status === "rejected") {
            if (!data.rejectionReason) {
                throw new AppError(400, "rejectionReason is required");
            }
            updatePayload.reasonForRejection = data.rejectionReason;
        }

        // 4️⃣ Update account driver
        await accountDriverModel.findOneAndUpdate(
            { _id: accountDriverId },
            { $set: updatePayload },
            { session, new: true }
        );

        // 5️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();

        logger.info("END: Driver profile approval committed");

        return {
            message: `Driver profile ${data.status} successfully`,
            driverId,
            status: data.status,
            verifiedBy: adminId
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error("TX FAILED: Driver profile approval rolled back", error);
        throw error;
    }
};

// get all vehicles
module.exports.getAllVehicles = async (query) => {
    logger.info(`Get All Vehicles Public`);
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "verifiedBy", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
    ];
    const record = await new APIFeatures(query)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(populateQuery)
        .exec(vehicleModel);
    return record.data;
};

// get single vehicle by id
module.exports.getSingleVehicle = async (vehicleId) => {
    logger.info("START:Get only one vehicle");
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "verifiedBy", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
    ];
    const vehicle = await vehicleModel.findOne({ _id: vehicleId }).populate(populateQuery);
    if (!vehicle) throw new AppError(404, "Vehicle not found")
    return vehicle;
};

// get all Document
module.exports.getAllDocuments = async (query) => {
    logger.info(`Get All Vehicles Public`);
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "verifiedBy", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
    ];
    const record = await new APIFeatures(query)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(populateQuery)
        .exec(driverDocumentModel);
    return record.data;
};

// get single document by id
module.exports.getSingleDocument = async (documentId) => {
    logger.info("START:Get only one document");
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "verifiedBy", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
    ];
    const document = await driverDocumentModel.findOne({ _id: documentId }).populate(populateQuery);
    if (!document) throw new AppError(404, "Document not found")
    return document;
};

// assign/remove lead 
// 2.accept ride by driver
module.exports.assignLeadByAdminToDriver = async (leadId, driverId, admin) => {
    logger.info("START: Admin assign lead to driver");

    if (!leadId || !driverId) {
        throw new AppError(400, "leadId and driverId are required");
    }

    // 1️⃣ Fetch lead
    const lead = await leadModel.findOne({ _id: leadId });
    if (!lead) {
        throw new AppError(404, "Lead not found");
    }

    // 2️⃣ Prevent assigning cancelled / completed leads
    if (["CANCELLED", "COMPLETED"].includes(lead.leadStatus)) {
        throw new AppError(400, `Cannot assign a ${lead.leadStatus} lead`);
    }

    // 3️⃣ Prevent reassignment if already confirmed
    if (lead.leadStatus === "CONFIRMED") {
        throw new AppError(400, "Lead already confirmed by driver");
    }

    // 4️⃣ Admin assigns lead (NOT confirming)
    const updateData = {
        $set: {
            leadStatus: "CONFIRMED", // remains same
            // updatedBy: admin._id,
            "assign.driverId": driverId,
            "assign.assignedAt": new Date(),
            "assign.assignmentStatus": "pending",
            "assign.assignType": "admin"
        }
    };

    await leadModel.findOneAndUpdate({ _id: leadId }, updateData, { new: true });

    // 5️⃣ Populate response
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] },
        { path: "assign.driverId", select: ["_id", "username", "phoneNumber"] }
    ];

    const updatedLead = await leadModel
        .findOne({ _id: leadId })
        .select("-__v -cancellationHistory -rejectionHistory")
        .populate(populateQuery)
    logger.info("END: Admin assigned lead to driver successfully");

    return updatedLead;
};

module.exports.unassignLeadByAdmin = async (leadId, admin) => {
    logger.info("START: Admin unassign lead");
    if (!leadId) {
        throw new AppError(400, "leadId is required");
    }
    // 1️⃣ Fetch lead
    const lead = await leadModel.findOne({ _id: leadId });
    if (!lead) {
        throw new AppError(404, "Lead not found");
    }

    // 2️⃣ Validate current state
    if (!lead.assign?.driverId) {
        throw new AppError(400, "Lead is not assigned to any driver");
    }

    if (["CANCELLED", "COMPLETED"].includes(lead.leadStatus)) {
        throw new AppError(400, `Cannot unassign a ${lead.leadStatus} lead`);
    }

    // 3️⃣ Unassign (schema-aligned)
    const updateData = {
        $set: {
            leadStatus: "NEW-LEAD",
            updatedBy: admin._id,
            "assign.driverId": null,
            "assign.assignedAt": null,
            "assign.assignmentStatus": "pending",
            "assign.assignType": "admin"
        }
    };

    await leadModel.findOneAndUpdate({ _id: leadId }, updateData, { new: true });

    // 4️⃣ Return updated lead (optional populate)
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] }
    ];

    const updatedLead = await leadModel
        .findOne({ _id: leadId })
        .select("-__v -cancellationHistory -rejectionHistory")
        .populate(populateQuery)
    logger.info("END: Admin unassigned lead successfully");

    return updatedLead;
};

module.exports.assignLeadByAdminToAgency = async (leadId, agencyId, admin) => {
    logger.info("START: Admin assign lead to agency");

    if (!leadId || !agencyId) {
        throw new AppError(400, "leadId and agencyId are required");
    }

    const lead = await leadModel.findOne({ _id: leadId });
    if (!lead) {
        throw new AppError(404, "Lead not found");
    }

    // Prevent assignment if already confirmed
    if (lead.leadStatus === "CONFIRMED") {
        throw new AppError(400, "Lead already confirmed");
    }

    const updateData = {
        $set: {
            leadStatus: "ASSIGNED",
            updatedBy: admin._id,
            "assign.agencyId": agencyId,
            "assign.driverId": null,
            "assign.assignedAt": new Date(),
            "assign.assignmentStatus": "assigned",
            "assign.assignType": "admin"
        }
    };

    await leadService.updateRecord({ _id: leadId }, updateData);

    const populateQuery = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] },
        { path: "assign.agencyId", select: ["_id", "agencyName", "phoneNumber"] }
    ];

    const updatedLead = await leadService.findOneRecord(
        { _id: leadId },
        "-__v -cancellationHistory -rejectionHistory",
        populateQuery
    );

    logger.info("END: Admin assigned lead to agency");

    return updatedLead;
};

// 12. get all agency's
// 13. get single agency by id

// get all driver
module.exports.getAllAgencyProfiles = async (query) => {
    logger.info("Get All Agency Profiles");

    // 🔑 Force agency filter
    const filterQuery = {
        ...query,
        profileType: "agency"
    };

    const record = await new APIFeatures(filterQuery)
        .filter()
        .orRegexMultipleSearch("searchFilter")
        .sort()
        .paginate()
        .populate(driverPopulateQuery)
        .exec(accountDriverModel);
    return record.data;
};


// get single driver by id
module.exports.getSingleAgency = async (agencyId) => {
    logger.info("START:Get only one agency");
    const condition = {
        _id: agencyId,
        profileType: "agency"
    }
    const agency = await accountDriverModel.findOne(condition).populate(driverPopulateQuery);
    if (!agency) throw new AppError(404, "Agency not found")
    return agency;
};