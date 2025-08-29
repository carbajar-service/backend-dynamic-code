// const { logger, AppError, } = require("database-connection-function-com")
const logger = require("../utils/logs");
const AppError = require("../utils/appError")
const bcrypt = require("bcryptjs");

// custom packages
const staffModel = require("../models/staff.model");
const tokenService = require("../middlewares/token");
const { generateOTP, generateUniqueUsername } = require('../utils/utils');
const sms = require('./sms/fast2sms');

// register staff
module.exports.staffRegister = async (body) => {
    logger.info("staff registration started");
    if (!body.email) throw new AppError(404, "Email Required");
    if (!body.phoneNumber) throw new AppError(404, "Phone Number Required");
    if (!body.password) throw new AppError(404, "Password Required");

    const isEmailExist = await staffModel.findOne({ email: body.email });
    if (isEmailExist) throw new AppError(429, "Email already exists");

    const isPhoneExist = await staffModel.findOne({ phoneNumber: body.phoneNumber });
    if (isPhoneExist) throw new AppError(429, "Phone number already exists");

    const hashedPassword = bcrypt.hashSync(body.password, 10);
    const payload = {
        username: generateUniqueUsername('STAFF'),
        fullName: body.fullName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        isStaff: true,
        phoneOTP: generateOTP(),
    };
    logger.info(payload);
    const staffCreation = await staffModel.create(payload);
    const staff = await staffModel.findOne({ _id: staffCreation._id }).select("-password -__v")
    await sms.smsOTPV2(staff);
    staff.phoneOTP = undefined;
    return staff
};

module.exports.staffLogin = async (body) => {
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
    const staff = await staffModel.findOne(filter);
    if (!staff) {
        throw new AppError(404, 'staff does not exist');
    }

    // If login is via password
    if (body.password) {
        const isPasswordValid = bcrypt.compareSync(body.password, staff.password);
        if (!isPasswordValid) {
            throw new AppError(401, 'Invalid credentials');
        }
    }

    // If login is via OTP
    if (body.phoneOTP) {
        if (body.phoneOTP !== String(staff.phoneOTP)) {
            throw new AppError(401, 'Invalid OTP');
        }
        // If OTP is valid, mark phone as verified and reset OTP
        await staffModel.findOneAndUpdate(
            { _id: staff._id },
            { phoneOTP: null, }
        );
    }

    // Generate tokens
    const accessToken = tokenService.signToken(staff._id, 'access');
    const refreshToken = tokenService.signToken(staff._id, 'refresh');

    const record = {
        _id: staff._id,
        username: staff.username,
        email: staff.email,
        fullName: staff.fullName,
        accountType: staff.accountType,
        accessToken,
        refreshToken,
    };

    return record;
};

module.exports.refreshOtp = async (body) => {
    logger.info("Refresh service Starting");
    const filter = { phoneNumber: body.phoneNumber };
    const staff = await staffModel.findOne(filter);
    if (!staff) {
        throw new AppError(404, "Your not a existing staff.Register first!");
    }
    const option = { new: true };
    const record = await staffModel.findOneAndUpdate(
        { _id: staff.id },
        { phoneOTP: generateOTP() },
        option
    );
    await sms.smsOTPV2(record);
    logger.info(record);
    record.phoneOTP = undefined;
    return record;
};

module.exports.findOneRecord = async (condition, populateQuery) => {
    const record = await staffModel.findOne(condition).populate(populateQuery);
    return record;
};