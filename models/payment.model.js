// models/payment.model.js

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
      required: true,
    },

    // Razorpay Order ID (generated from backend)
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    // Razorpay Payment ID (comes after success)
    paymentId: {
      type: String,
      sparse: true,
    },

    // Razorpay Signature (for verification)
    signature: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
      min: 1, // avoid zero payments
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true,
    },

    method: {
      type: String, // upi, card, netbanking, wallet
    },

    description: {
      type: String,
      trim: true,
    },

    // Store extra context (VERY IMPORTANT)
    metadata: {
      type: Object,
      default: {},
      /*
        Example:
        {
          type: "wallet_recharge",
          walletId: "xxx",
          bookingId: "yyy"
        }
      */
    },

    // Razorpay response (optional but useful)
    razorpayResponse: {
      type: Object,
    },

    paidAt: {
      type: Date,
    },

    failedReason: {
      type: String,
    },

    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

// Indexes for performance
paymentSchema.index({ ownerId: 1, createdAt: -1 });
// paymentSchema.index({ orderId: 1 });

// Prevent duplicate payment save (important safety)
paymentSchema.index(
  { unique: true, sparse: true }
);

module.exports = mongoose.model("payment", paymentSchema);