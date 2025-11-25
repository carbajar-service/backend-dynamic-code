const logger = require("../utils/logs");
const AppError = require("../utils/appError")
const bcrypt = require("bcryptjs");
// custom packages
const userService = require("./user.services");
const tokenService = require("../middlewares/token");
const { generateOTP, generateUniqueUsername } = require('../utils/utils');
const sms = require('./sms/fast2sms');

// user register
module.exports.createRegister = async (body) => {
    logger.info("creating user register");
    if (!body.phoneNumber) {
        throw new AppError(404, "Required Parameters");
    }
    const isPhoneNumberExists = await userService.findOneRecord({
        phoneNumber: body.phoneNumber,
    });
    if (isPhoneNumberExists) {
        const resentOtp = await userService.updateRecord(
            { _id: isPhoneNumberExists.id },
            { phoneOTP: generateOTP() }
        );
        await sms.smsOTPV2(resentOtp);
        logger.info(resentOtp);
        isPhoneNumberExists.phoneOTP = undefined;
        return isPhoneNumberExists;
    }
    const hashedPassword = bcrypt.hashSync(body.password, 10);
    const payload = {
        phoneNumber: body.phoneNumber,
        phoneOTP: generateOTP(),
        username: generateUniqueUsername('USR'),
        email: body.email
    };
    if (body.password) payload.password = hashedPassword;
    logger.info(payload);
    const user = await userService.createRecord(payload);
    await sms.smsOTPV2(user);
    user.phoneOTP = undefined;
    return user;
};

// userlogin with otp
// module.exports.authLogin = async (body) => {
//     logger.info("User Login Service Started");
//     // Validation: requires at least phoneNumber or email
//     if (!(body.phoneNumber || body.email)) {
//         throw new AppError(400, "Email or Phone Number is required");
//     }
//     // Validation: requires password or OTP
//     if (!(body.password || body.phoneOTP)) {
//         throw new AppError(400, "Password or OTP is required");
//     }
//     let filter = { accountType: "user" };
//     if (body.email) filter.email = body.email;
//     if (body.phoneNumber) filter.phoneNumber = body.phoneNumber;
//     const user = await userService.findOneRecord(filter);
//     logger.data("User Found", user);

//     if (!user) {
//         throw new AppError(404, "User does not exist. Register first!");
//     }
//     // Password Login
//     if (body.password) {
//         const isPasswordValid = bcrypt.compareSync(body.password, user.password);
//         if (!isPasswordValid) {
//             throw new AppError(401, "Invalid Credentials");
//         }
//     }

//     // OTP Login
//     if (body.phoneOTP) {
//         if (String(body.phoneOTP) !== String(user.phoneOTP)) {
//             throw new AppError(401, "Invalid OTP");
//         }
//         // Reset OTP after successful OTP validation
//         await this.updateRecord({ _id: user._id }, { $unset: { phoneOTP: "" } });
//     }
//     const accessToken = tokenService.signToken(user._id, "access");
//     const refreshToken = tokenService.signToken(user._id, "refresh");
//     const result = {
//         _id: user._id,
//         username: user.username,
//         phoneNumber: user.phoneNumber,
//         email: user.email,
//         accountType: user.accountType,
//         accessToken,
//         refreshToken
//     };
//     logger.info(`Login Success for User ID: ${user._id}`);
//     return result;
// };

module.exports.authLogin = async (body, res) => {
    logger.info("login service Starting");
    if (!body.phoneNumber || !body.phoneOTP) {
        throw new AppError(404, "Required Parameters");
    }
    const filter = { phoneNumber: body.phoneNumber, accountType: "user" };
    const user = await userService.findOneRecord(filter);
    logger.data("User info fetched", user);
    if (!user) {
        throw new AppError(404, "Your not a existing user.Register first!");
    }
    // if (user.isBlocked) {
    //     throw new AppError(404, "auth", "A_E016");
    // }
    if (body.phoneOTP !== String(user.phoneOTP))
        throw new AppError(400, "Invalid OTP!");

    const updateOtp = await userService.updateRecord(
        { _id: user.id },
        { phoneOTP: null, phoneisVerified: true }
    );
    logger.info(updateOtp);
    const accessToken = tokenService.signToken(user._id, "access");
    const refreshToken = tokenService.signToken(user._id, "refresh");
    const userObject = {
        accessToken: accessToken,
        refreshToken: refreshToken,
        id: user._id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        account: user.accountType,
    };
    return userObject
};

// user login otp
module.exports.refreshOtp = async (body) => {
    logger.info("Refresh service Starting");
    const filter = { phoneNumber: body.phoneNumber };
    const user = await userService.findOneRecord(filter);
    if (!user) {
        throw new AppError(404, "Your not a existing user.Register first!");
    }
    const option = { new: true };
    const record = await userService.updateRecord(
        { _id: user.id },
        { phoneOTP: generateOTP() },
        option
    );
    await sms.smsOTPV2(record);
    logger.info(record);
    record.phoneOTP = undefined;
    return record;
};
