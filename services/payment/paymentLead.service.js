const razorpay = require("../../core/razorpay");
const paymentLead = require("../../models/paymentLead.model");
const lead = require("../../models/lead.model");
const crypto = require("crypto");
const config = require("../../config/index");
const mongoose = require("mongoose");
const AppError = require("../../utils/appError");
const logger = require("../../utils/logs");

// ✅ Create Order
exports.createLeadOrder = async (userId, leadId, amount, stage) => {
    const leadDoc = await lead.findById(leadId);
    if (!leadDoc) throw new AppError(404, "Lead not found");
    // 🚨 VALIDATIONS
    if (amount <= 0) throw new AppError(400, "Invalid amount");
    if (amount > leadDoc.pendingAmount) {
        throw new AppError(400, "Amount exceeds pending");
    }
    // Prevent FINAL before ADVANCE
    if (stage === "FINAL") {
        const advancePaid = await paymentLead.findOne({
            leadId,
            paymentStage: "ADVANCE",
            status: "paid"
        });
        if (!advancePaid) {
            throw new AppError(400, "Advance required first");
        }
    }

    // Prevent multiple ADVANCE
    if (stage === "ADVANCE") {
        const alreadyPaid = await paymentLead.findOne({
            leadId,
            paymentStage: "ADVANCE",
            status: "paid"
        });
        if (alreadyPaid) {
            throw new AppError(400, "Advance already paid");
        }
    }

    const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `lead_${leadId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`
    });

    await paymentLead.create({
        userId,
        leadId,
        orderId: order.id,
        amount,
        status: "created",
        paymentStage: stage
    });

    return order;
};

exports.verify = async (data) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = data;
        // 🔐 Signature verify
        const expected = crypto
            .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
        if (expected !== razorpay_signature) {
            throw new AppError(400, "Invalid signature");
        }
        // 🔎 Find payment
        const paymentDoc = await paymentLead.findOne({
            orderId: razorpay_order_id,
        }).session(session);
        if (!paymentDoc) {
            throw new AppError(404, "Payment not found");
        }
        // 🚫 Idempotency
        if (paymentDoc.status === "paid") {
            await session.commitTransaction();
            return { message: "Already processed" };
        }
        // 🔗 Get lead
        const leadDoc = await lead.findById(paymentDoc.leadId).session(session);
        if (!leadDoc) {
            throw new AppError(500, "Lead missing");
        }
        // 🚨 Validate amount again
        if (paymentDoc.amount > leadDoc.pendingAmount) {
            throw new AppError(400, "Overpayment not allowed");
        }
        // 🚨 FINAL before ADVANCE check
        if (paymentDoc.paymentStage === "FINAL") {
            const advancePaid = await paymentLead.findOne({
                leadId: leadDoc._id,
                paymentStage: "ADVANCE",
                status: "paid"
            }).session(session);

            if (!advancePaid) {
                throw new AppError(400, "Advance not paid");
            }
        }
        // 🚨 Prevent duplicate ADVANCE
        if (paymentDoc.paymentStage === "ADVANCE") {
            const existingAdvance = await paymentLead.findOne({
                leadId: leadDoc._id,
                paymentStage: "ADVANCE",
                status: "paid"
            }).session(session);

            if (existingAdvance) {
                throw new AppError(400, "Advance already paid");
            }
        }

        // ✅ Update payment
        paymentDoc.status = "paid";
        paymentDoc.paymentId = razorpay_payment_id;
        paymentDoc.signature = razorpay_signature;
        paymentDoc.paidAt = new Date();

        await paymentDoc.save({ session });

        // 💰 Update lead
        leadDoc.payments.push(paymentDoc._id);
        leadDoc.totalPaidAmount += paymentDoc.amount;
        leadDoc.pendingAmount -= paymentDoc.amount;

        // 🔥 STATUS CHANGE ONLY ON ADVANCE
        if (paymentDoc.paymentStage === "ADVANCE") {
            leadDoc.leadStatus = "NEW-LEAD";
        }

        // 🔥 FULL PAYMENT CHECK
        if (leadDoc.pendingAmount <= 0) {
            leadDoc.pendingAmount = 0;
            leadDoc.isFullyPaid = true;
        }

        await leadDoc.save({ session });

        await session.commitTransaction();

        return {
            message: "Payment successful",
            leadId: leadDoc._id,
            totalPaid: leadDoc.totalPaidAmount,
            pending: leadDoc.pendingAmount,
            status: leadDoc.leadStatus,
            isFullyPaid: leadDoc.isFullyPaid
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/* =====================================================
   3️⃣ GET MY PAYMENT HISTORY
===================================================== */
module.exports.getMyPayments = async (userId) => {
    logger.info("START: Get My Payments");
    const condition = {
        userId: new mongoose.Types.ObjectId(userId)
    };
    const payments = await paymentLead
        .find(condition)
        .populate([
            { path: "leadId", select: ["_id", "totalAmount", "status"] },
            { path: "userId", select: ["_id", "username", "email"] }
        ])
        .sort({ createdAt: -1 });

    return payments;
};

/* =====================================================
   4️⃣ GET SINGLE PAYMENT
===================================================== */
module.exports.getSinglePayment = async (paymentId) => {
    logger.info("START: Get Single Payment");
    if (!paymentId) throw new AppError(400, "Payment ID required");
    const payment = await paymentLead
        .findById(paymentId)
        .populate([
            { path: "leadId", select: ["_id", "totalAmount", "status"] },
            { path: "userId", select: ["_id", "username", "email"] }
        ]);
    if (!payment) throw new AppError(404, "Payment not found");
    return payment;
};

/* =====================================================
   5️⃣ ADMIN - GET ALL PAYMENTS
===================================================== */
module.exports.getAllPaymentsAdmin = async (query) => {
    logger.info("START: Get All Payments (Admin)");
    const payments = await paymentLead
        .find()
        .populate([
            { path: "leadId", select: ["_id", "price", "status"] },
            { path: "userId", select: ["_id", "username", "email"] }
        ])
        .sort({ createdAt: -1 });
    return payments;
};