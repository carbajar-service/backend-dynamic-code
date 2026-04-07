const razorpay = require("../../core/razorpay");
const Payment = require("../../models/payment.model");
const Wallet = require("../../models/wallet.model");
const WalletTxn = require("../../models/WalletTransaction");
const crypto = require("crypto");
const config = require("../../config/index");
const mongoose = require("mongoose");
const AppError = require("../../utils/appError");

// ✅ Create Order
exports.createTopup = async (ownerId, body) => {
    if (!body.amount || body.amount <= 0) {
        throw new AppError(400, "Invalid amount");
    }

    const order = await razorpay.orders.create({
        amount: body.amount * 100,
        currency: "INR",
    });

    await Payment.create({
        ownerId,
        orderId: order.id,
        amount: body.amount,
        status: "created",
    });

    return order;
};

// ✅ Verify Payment + Wallet Credit (SAFE)
exports.verify = async (data, ownerId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = data;

        // 🔐 Signature verification
        const expected = crypto
            .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expected !== razorpay_signature) {
            throw new AppError(400, "Invalid signature");
        }

        // 🔎 Find payment
        const paymentDoc = await Payment.findOne({
            orderId: razorpay_order_id,
        }).session(session);

        if (!paymentDoc) {
            throw new AppError(404, "Payment not found");
        }

        // 🚫 Idempotency check
        if (paymentDoc.status === "paid") {
            await session.commitTransaction();
            return { message: "Already processed" };
        }

        // 👛 Wallet MUST exist
        const wallet = await Wallet.findOne({ ownerId }).session(session);

        if (!wallet) {
            throw new AppError(500, "Wallet not found — system inconsistency");
        }

        // 🔄 Update payment
        paymentDoc.status = "paid";
        paymentDoc.paymentId = razorpay_payment_id;
        paymentDoc.paidAt = new Date();
        await paymentDoc.save({ session });

        // 💰 Update balance
        wallet.balance += paymentDoc.amount;
        await wallet.save({ session });

        // 🧾 Wallet transaction (idempotent via paymentId)
        await WalletTxn.create(
            [{
                ownerId: ownerId,
                amount: paymentDoc.amount,
                type: "credit",
                source: "razorpay",
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                status: "success",
                balanceAfter: wallet.balance,
            }],
            { session }
        );

        await session.commitTransaction();
        return wallet;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};