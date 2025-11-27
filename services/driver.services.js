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

// register driver
module.exports.driverRegister = async (body) => {
    logger.info("driver registration started");
    if (!body.email) throw new AppError(404, "Email Required");
    if (!body.phoneNumber) throw new AppError(404, "Phone Number Required");
    if (!body.password) throw new AppError(404, "Password Required");

    const isEmailExist = await driverModel.findOne({ email: body.email });
    if (isEmailExist) throw new AppError(429, "Email already exists");

    const isPhoneExist = await driverModel.findOne({ phoneNumber: body.phoneNumber });
    if (isPhoneExist) throw new AppError(429, "Phone number already exists");

    const hashedPassword = bcrypt.hashSync(body.password, 10);
    const payload = {
        username: generateUniqueUsername('DRI'),
        email: body.email,
        phoneNumber: Number(body.phoneNumber),
        password: hashedPassword,
        phoneOTP: generateOTP(),
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
        if (body.phoneOTP !== String(driver.phoneOTP)) {
            throw new AppError(401, 'Invalid OTP');
        }
        // If OTP is valid, mark phone as verified and reset OTP
        await driverModel.findOneAndUpdate(
            { _id: driver._id },
            // { phoneOTP: null, },
            { $unset: { phoneOTP: "" } }
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
    logger.info("Refresh service Starting");
    const filter = { phoneNumber: body.phoneNumber };
    const driver = await driverModel.findOne(filter);
    if (!driver) {
        throw new AppError(404, "Your not a existing driver.Register first!");
    } const option = { new: true };
    const record = await driverModel.findOneAndUpdate(
        { _id: driver._id },
        { phoneOTP: generateOTP() },
        option
    );
    await sms.smsOTPV2(record);
    logger.info(record);
    record.phoneOTP = undefined;
    // return record;
    const d = `Successfully refresh OTP sent to ${body.phoneNumber}!`
    return d;
};

// get DriverProfile
