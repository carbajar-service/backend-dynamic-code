const walletModel = require("../models/wallet.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");
const driverModel = require("../models/driver.model");
const WalletTxn = require("../models/WalletTransaction");
const mongoose = require("mongoose");

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
    if (data.ownerId) payload.ownerId = data.ownerId;
    if (data.accountType) payload.accountType = data.accountType;
    const wallet = await this.createRecord(payload);
    return wallet;
}

// get My wallet for user
module.exports.getMyWalletByDriver = async (loggedIn) => {
    const account = await driverModel.findOne({ _id: loggedIn?._id });
    if (!account) throw new AppError(404, `Wallet Not Found.For This ${loggedIn?._id} Id`);
    const condition = {
        ownerId: loggedIn?._id
    }
    const populateQuery = [
        {
            path: "ownerId",
            select: ["_id", "username", "email", "phoneNumber"],
        }
    ];
    const wallet = await this.findOneRecord(condition, "-__v", populateQuery);
    if (!wallet) throw new AppError(404, "Wallet Not Found")
    return wallet;
}

exports.creditWallet = async (userId, amount, source = "admin") => {
    if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const wallet = await walletModel.findOne({ userId }).session(session);
        if (!wallet) throw new Error("Wallet not found");

        wallet.balance += amount;
        await wallet.save({ session });

        await WalletTxn.create([{
            userId,
            amount,
            type: "credit",
            source,
            status: "success",
            balanceAfter: wallet.balance
        }], { session });

        await session.commitTransaction();
        return wallet;

    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

exports.debitWallet = async (ownerId, amount, source = "manual") => {
    if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const wallet = await walletModel.findOne({ ownerId }).session(session);
        if (!wallet) throw new Error("Wallet not found");

        if (wallet.balance < amount) {
            throw new Error("Insufficient balance");
        }

        wallet.balance -= amount;
        await wallet.save({ session });

        await WalletTxn.create([{
            userId,
            amount,
            type: "debit",
            source,
            status: "success",
            balanceAfter: wallet.balance
        }], { session });

        await session.commitTransaction();
        return wallet;

    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

exports.getTransactions = async (ownerId, page = 1, limit = 20) => {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;

    const result = await WalletTxn.aggregate([
        {
            $match: { ownerId: new mongoose.Types.ObjectId(ownerId) }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]);

    const data = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
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