// const { logger, AppError, } = require("database-connection-function-com")
const logger = require("../utils/logs");
const AppError = require("../utils/appError")
const bcrypt = require("bcryptjs");

// custom packages
const driverModel = require("../models/driver.model");
const tokenService = require("../middlewares/token");
const { generateOTP, generateUniqueUsername } = require('../utils/utils');
const sms = require('./sms/fast2sms');
const accountDriverService = require("./accountDriver.service");
const leadService = require("./lead.service");
const LeadModel = require("../models/lead.model");

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await driverModel.findOneAndUpdate(condition, body, option);
    return record;
};

// register driver
module.exports.driverRegister = async (body) => {
    logger.info("driver registration started");
    if (!body.email) throw new AppError(404, "Email Required");
    if (!body.phoneNumber) throw new AppError(404, "Phone Number Required");
    if (!body.password) throw new AppError(404, "Password Required");
    if (!body.accountType) throw new AppError(404, "Account Type Required")

    const isEmailExist = await driverModel.findOne({ email: body.email });
    if (isEmailExist) throw new AppError(429, "Email already exists");

    const isPhoneExist = await driverModel.findOne({ phoneNumber: body.phoneNumber });
    if (isPhoneExist) throw new AppError(429, "Phone number already exists");
    let account
    switch (body.accountType) {
        case "individual":
            account = "individual"
            break;
        case "agency":
            account = "agency"
            break
        default:
            throw new AppError("404", "type Not found");
    }
    const hashedPassword = bcrypt.hashSync(body.password, 10);
    const payload = {
        username: generateUniqueUsername('DRI'),
        email: body.email,
        phoneNumber: Number(body.phoneNumber),
        password: hashedPassword,
        phoneOTP: generateOTP(),
        phoneOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        accountType: account
    };
    logger.info(payload);
    const delareCreation = await driverModel.create(payload);
    const driver = await driverModel.findOne({ _id: delareCreation._id }).select("-password -__v")
    await sms.smsOTPV2(driver);
    driver.phoneOTP = undefined;
    return driver
};

// DriverLogin
module.exports.driverLogin = async (body) => {
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
    const driver = await driverModel.findOne(filter);
    if (!driver) {
        throw new AppError(404, 'driver does not exist');
    }

    // If login is via password
    if (body.password) {
        const isPasswordValid = bcrypt.compareSync(body.password, driver.password);
        if (!isPasswordValid) {
            throw new AppError(401, 'Invalid credentials');
        }
    }

    // If login is via OTP
    if (body.phoneOTP) {
        if (!driver.phoneOTP || !driver.phoneOTPExpiresAt) {
            throw new AppError(400, "OTP not generated");
        }

        if (Date.now() > driver.phoneOTPExpiresAt.getTime()) {
            throw new AppError(401, "OTP expired");
        }

        if (body.phoneOTP !== String(driver.phoneOTP)) {
            throw new AppError(401, 'Invalid OTP');
        }
        // If OTP is valid, mark phone as verified and reset OTP
        await driverModel.findOneAndUpdate(
            { _id: driver._id },
            {
                $set: { phoneIsVerified: true },
                $unset: { phoneOTP: "", phoneOTPExpiresAt: "" }
            }, { new: true, runValidators: false }
        );
    }

    // Generate tokens
    const accessToken = tokenService.signToken(driver._id, 'access');
    const refreshToken = tokenService.signToken(driver._id, 'refresh');

    const account = await accountDriverService.findOneRecord({ driverId: driver?._id });
    const accountCompleted = account?.profileCompleted === true;
    // changed to account success
    let accountApproved;
    if (account?.accountStatus === null) {
        accountApproved = "still account not created"
    } else {
        accountApproved = account?.accountStatus
    }
    let accountRejected = account?.accountStatus === "rejected" ? account?.reasonForRejection : undefined;
    const record = {
        _id: driver._id,
        username: driver.username,
        email: driver.email,
        accountType: driver.accountType,
        phoneNumber: driver.phoneNumber,
        accessToken,
        refreshToken,
        accountCompleted,
        accountApproved,
        accountRejected
    };
    return record;
};

// refreshOTP
module.exports.refreshOtp = async (body) => {
    logger.info("Refresh OTP service starting");
    const driver = await driverModel.findOne({ phoneNumber: body.phoneNumber });
    if (!driver) {
        throw new AppError(404, "You are not an existing driver / agency. Register first!");
    }
    const otp = generateOTP();
    const record = await driverModel.findOneAndUpdate(
        { _id: driver._id },
        {
            phoneOTP: otp,
            phoneOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
        },
        { new: true }
    );
    // Send OTP via SMS
    await sms.smsOTPV2(record);
    // Hide OTP before returning / logging
    record.phoneOTP = undefined;
    record.phoneOTPExpiresAt = undefined;
    logger.info(`OTP refreshed for ${body.phoneNumber}`);
    return `Successfully refreshed OTP sent to ${body.phoneNumber}!`;
};


// get DriverProfile

// 1.driver Matching Leads
module.exports.getDriverMatchingLeads = async (loggedInDriver) => {
    logger.info("Start:Get Driver Matching Ride");
    const driverPayload = {
        driverId: loggedInDriver?._id,
        accountStatus: "approved",
        profileCompleted: true
    }
    const driverAccount = await accountDriverService.findOneRecord(driverPayload, "city state  vehicleType");
    console.log("aa", driverAccount);

    if (!driverAccount) {
        throw new AppError(403, "Driver account not approved or not found");
    }
    const now = new Date();
    const condition = {
        userCity: driverAccount.city,
        vehicleType: driverAccount.vehicleType,
        leadStatus: "NEW-LEAD",
        showFlag: true,
        // pickUpDate: { $gte: now.toISOString().split("T")[0] }, // Future or today pickups only
        "assign.driverId": { $exists: false } // Ensure not already taken
    };

    console.log("con", condition);
    const populateData = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] }
    ]
    const leads = await leadService.findAllRecord(condition, "-__v -cancellationHistory -rejectionHistory", populateData);
    console.log("lead", leads);

    return leads;
};

// 2.accept ride by driver
module.exports.acceptLeadByDriver = async (leadId, loggedInDriver) => {
    logger.info("START: Driver Accept Lead");
    const lead = await leadService.findOneRecord({ _id: leadId });
    if (!lead) throw new AppError(404, "Lead not found");
    if (lead.leadStatus !== "NEW-LEAD") {
        throw new AppError(400, "Lead is already accepted by another driver");
    }
    // Prevent same driver from accepting again
    if (lead.assign?.driverId?.toString() === loggedInDriver._id.toString()) {
        throw new AppError(400, "You have already accepted this lead");
    }
    // Prevent accepting past pickup time
    const pickupDateTime = new Date(`${lead.pickUpDate}T${lead.pickUpTime}`);
    if (pickupDateTime <= new Date()) {
        throw new AppError(400, "Pickup time has passed. Cannot accept");
    }
    // Assign and update status
    const updateData = {
        $set: {
            leadStatus: "CONFIRMED",
            updatedBy: loggedInDriver._id,
            "assign.driverId": loggedInDriver._id,
            "assign.assignedAt": new Date(),
            "assign.assignmentStatus": "accepted",
            "assign.assignType": "auto"
        }
    };
    await leadService.updateRecord({ _id: leadId }, updateData);
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] },
        { path: "assign.driverId", select: ["_id", "username", "phoneNumber"] }
    ];

    const updatedLead = await leadService.findOneRecord(
        { _id: leadId },
        "-__v -cancellationHistory -rejectionHistory",
        populateQuery
    );
    logger.info("Lead accepted successfully using atomic update");
    return updatedLead;
};

// 3.cancel ride by driver 
module.exports.cancelRideByDriver = async (leadId, loggedInDriver, body) => {
    logger.info("START: Driver Cancel Ride");

    if (!body.reason) {
        throw new AppError(400, "Cancellation reason is required");
    }
    // 1. Find the lead
    const lead = await leadService.findOneRecord({ _id: leadId });
    if (!lead) {
        throw new AppError(404, "Lead not found");
    }
    // 2. Ensure this driver is assigned to this lead
    if (!lead.assign?.driverId || lead.assign.driverId.toString() !== loggedInDriver._id.toString()) {
        throw new AppError(403, "You are not assigned to this ride");
    }
    // 3. Ensure ride is in a cancellable state
    if (!["CONFIRMED"].includes(lead.leadStatus)) {
        throw new AppError(400, `Ride cannot be cancelled in current status: ${lead.leadStatus}`);
    }
    // 4. Optional: prevent cancel after pickup time if you want strict rule
    const pickupDateTime = new Date(`${lead.pickUpDate}T${lead.pickUpTime}`);
    if (pickupDateTime <= new Date()) {
        throw new AppError(400, "You cannot cancel the ride after pickup time");
    }
    // 5. Build update object (atomic) – use $set + $push
    // TODO need to correct this logic
    const updateData = {
        $set: {
            leadStatus: "CANCELLED",
            updatedBy: loggedInDriver._id,
            "assign.assignmentStatus": "rejected"
        },
        $push: {
            rejectionHistory: {
                reason: body.reason,
                rejectedBy: loggedInDriver._id,
                rejectedAt: new Date()
            }
        }
    };
    await leadService.updateRecord({ _id: leadId }, updateData);

    // 6. Fetch updated lead (single, with populate if needed)
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] },
        { path: "assign.driverId", select: ["_id", "username", "phoneNumber"] }
    ];
    const updatedLead = await leadService.findOneRecord(
        { _id: leadId },
        "-__v",
        populateQuery
    );
    logger.info("Ride cancelled successfully by driver");
    // If you want only simple data back:
    return {
        leadStatus: updatedLead.leadStatus,
        cancellationReason: updatedLead.cancellationReason
    };
};

// 4. started ride by driver
module.exports.startRideByDriver = async (leadId, loggedInDriver) => {
    logger.info("START: Driver Start Ride");
    // Fetch lead
    const lead = await leadService.findOneRecord({ _id: leadId });
    if (!lead) throw new AppError(404, "Lead not found");
    // Check if assigned to driver
    if (!lead.assign?.driverId || lead.assign.driverId.toString() !== loggedInDriver._id.toString()) {
        throw new AppError(403, "You are not assigned to this ride");
    }
    // Must be accepted (CONFIRMED) before starting
    if (lead.leadStatus !== "CONFIRMED") {
        throw new AppError(400, `Ride must be in CONFIRMED before starting. Current: ${lead.leadStatus}`);
    }

    // ⏱ Validate Pickup Time
    if (!lead.pickUpDate || !lead.pickUpTime) {
        throw new AppError(400, "Pickup date and time are required to start ride");
    }

    const pickupDateTime = new Date(`${lead.pickUpDate.toISOString().split("T")[0]}T${new Date(lead.pickUpTime).toLocaleTimeString('en-GB', { hour12: false })}`);
    const now = new Date();

    // Too early — Cannot start before pickup time
    if (now < pickupDateTime) {
        throw new AppError(400, "You cannot start the ride before the pickup time");
    }

    // Update lead status to STARTED
    const updatedLead = await leadService.updateRecord(
        { _id: leadId },
        {
            $set: {
                leadStatus: "STARTED",
                updatedBy: loggedInDriver._id,
                startedAt: new Date()
            }
        }
    );

    logger.info("Ride started successfully by driver");
    return {
        leadId: updatedLead._id,
        leadStatus: updatedLead.leadStatus,
        startedAt: updatedLead.startedAt
    };
};

// 5. complete ride by driver
module.exports.completeRideByDriver = async (leadId, loggedInDriver) => {
    logger.info("START: Driver Complete Ride");

    // Fetch lead
    const lead = await leadService.findOneRecord({ _id: leadId });
    if (!lead) throw new AppError(404, "Lead not found");

    // Check if assigned to driver
    if (!lead.assign?.driverId || lead.assign.driverId.toString() !== loggedInDriver._id.toString()) {
        throw new AppError(403, "You are not assigned to this ride");
    }

    // Status must be Started before completion
    if (lead.leadStatus !== "STARTED") {
        throw new AppError(400, `Ride must be STARTED before completing. Current: ${lead.leadStatus}`);
    }

    // Set to completed
    const updatedLead = await leadService.updateRecord(
        { _id: leadId },
        {
            $set: {
                leadStatus: "COMPLETED",
                updatedBy: loggedInDriver._id,
                completedAt: new Date()
            }
        }
    );

    logger.info("Ride completed successfully by driver");

    return {
        leadId: updatedLead._id,
        leadStatus: updatedLead.leadStatus,
        completedAt: updatedLead.completedAt
    };
};

// 6. driver history
module.exports.getDriverHistory = async (loggedInDriver, query) => {
    logger.info("START: Get Driver Ride History");

    const type = (query.type || "").toLowerCase();
    let statusFilter = {};

    switch (type) {
        case "accepted":
            statusFilter = { leadStatus: { $in: ["CONFIRMED"] } };
            break;
        case "completed":
            statusFilter = { leadStatus: "COMPLETED" };
            break;
        case "started":
            statusFilter = { leadStatus: "STARTED" };
            break;
        case "cancelled":
            statusFilter = { leadStatus: "CANCELLED" };
            break;
        default:
            statusFilter = { leadStatus: { $in: ["STARTED", "CONFIRMED", "COMPLETED", "CANCELLED"] } };
            break;
    }

    const condition = {
        "assign.driverId": loggedInDriver._id,
        ...statusFilter
    };

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const populateQuery = [
        { path: "userId", select: ["_id", "username", "phoneNumber"] }
    ];

    const leads = await LeadModel.find(condition)
        .populate(populateQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await LeadModel.countDocuments(condition);

    logger.info("END: Driver Ride History");

    return {
        docs: leads,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        limit: Number(limit)
    };
};

// 7. DriverEarnings
module.exports.getDriverEarnings = async (loggedInDriver, query) => {
    logger.info("START: Driver Earnings Report");

    const type = query.type || "all";
    const match = {
        "assign.driverId": loggedInDriver._id,
        leadStatus: "COMPLETED"
    };

    const date = new Date();

    if (type === "daily") {
        match.completedAt = {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lte: new Date()
        };
    }

    if (type === "monthly") {
        match.completedAt = {
            $gte: new Date(date.getFullYear(), date.getMonth(), 1),
            $lte: new Date()
        };
    }

    const result = await LeadModel.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: "$totalAmount" },
                ridesCompleted: { $sum: 1 }
            }
        },
        { $project: { _id: 0 } }
    ]);

    const earnings = result[0] || { totalEarnings: 0, ridesCompleted: 0 };

    logger.info("END: Driver Earnings Report");

    return earnings;
};

// get single lead/ride 
