const walletModel = require("../models/wallet.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");
const accountDriverService = require("./accountDriver.service");
// const { sendPushNotificationToMultiple } = require("../utils/firebase/sendPushNotification");
// const { getUserFcmTokens } = require("./auth.service");

module.exports.createRecord = async (object) => {
    const record = await walletModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await walletModel.findOne(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await walletModel.find(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await walletModel.findOneAndUpdate(condition, body, option);
    return record;
};

// create the default wallet for the user 
module.exports.createWallet = async (data, id) => {
    const payload = {
        _id: id,
    }
    if (data.accountDriverId) payload.accountDriverId = data.accountDriverId;
    if (data.accountUserId) payload.accountUserId = data.accountUserId;
    if (data.accountType) payload.accountType = data.accountType;
    const wallet = await this.createRecord(payload);
    return wallet;
}

// get My wallet for user
module.exports.getMyWalletByDriver = async (loggedIn) => {
    const account = await accountDriverService.findOneRecord({ driverId: loggedIn?._id });
    if (!account) throw new AppError(404, `Account Not Found.For This ${loggedIn?._id} Id`);
    const condition = {
        accountDriverId: account?._id
    }
    const populateQuery = [
        {
            path: "accountDriverId",
            select: ["_id", "firstName", "lastName", "profilePicture", "driverId"],
            populate: {
                path: "driverId",
                select: ["_id", "username", "email", "phoneNumber"] // adjust fields as needed
            }
        }
    ];
    const wallet = await this.findOneRecord(condition, "-__v", populateQuery);
    if (!wallet) throw new AppError(404, "Wallet Not Found")
    return wallet;
}

// get all wallet for admin
module.exports.getAllWalletsByAdmin = async (query) => {
    const populateQuery = [
        {
            path: "promotionIds",
            select: ["_id", "compensation", "location", "brandLogo", "brandNiche", "brandName"],
            options: { sort: { compensation: -1 } }
        },
        {
            path: "accountId",
            select: ["_id", "firstName", "lastName", "profilePicture", "userId"],
            populate: {
                path: "userId",
                select: ["_id", "username", "email", "phoneNumber"] // adjust fields as needed
            }
        }
    ];

    // Fetch all wallets
    const wallets = await walletModel.find({}, "-__v").populate(populateQuery);
    if (!wallets || wallets.length === 0) {
        throw new AppError(404, "No wallets found");
    }
    return wallets;
};


// admin can increance the balance amount
module.exports.updatedWalletBalance = async (body) => {
    const { accountId, promotionId } = body;

    if (!accountId || !promotionId) {
        throw new AppError(400, 'accountId and promotionId are required.');
    }

    // 1️⃣ Find promotion with approved account
    const promotion = await promotionModel.findOne({
        $and: [
            { _id: promotionId },
            { 'appliedUsers.accountId': accountId },
            { 'appliedUsers.status': 'approved' }
        ]
    });

    if (!promotion) {
        throw new AppError(404, 'Promotion not found or account is not approved for this promotion.');
    }

    const amount = promotion.compensation;
    // 2️⃣ Find or create wallet
    const wallet = await walletModel.findOne({ accountId });

    if (!wallet) {
        throw new AppError(404, "Wallet Not Found")
    }

    const updatedWallet = await walletModel.findOneAndUpdate(
        { accountId }, // find condition
        {
            $addToSet: { promotionIds: promotionId },
            $inc: { balance: amount }
        },
        { new: true }
    );

    // 4️⃣ Send Push Notification
    const user = await accountModel.findOne({ _id: accountId })
    const tokens = await getUserFcmTokens(user.userId);

    const title = "Wallet Credited";
    const message = `₹${amount} has been credited to your wallet for promotion "${promotion.brandName}".`;
    const _data = {
        type: "wallet_credit",
        userId: user.userId,
        image: promotion.brandLogo
    }
    await sendPushNotificationToMultiple(tokens, title, message, _data);
    return {
        message: `Wallet updated successfully with ₹${amount}.`,
        wallet: updatedWallet
    };
};