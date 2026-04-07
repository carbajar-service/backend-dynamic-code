const mongoose = require("mongoose");

const walletTxnSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "driver",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: [
        "razorpay",
        "admin",
        "refund",
        "purchase",
        "bonus",
        "withdrawal"
      ],
      required: true,
      index: true,
    },

    orderId: {
      type: String,
      index: true,
    },

    paymentId: {
      type: String,
      index: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },

    balanceAfter: {
      type: Number, // VERY IMPORTANT for audit/debugging
    },

    description: {
      type: String,
      trim: true,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate credit from same payment
walletTxnSchema.index(
  { paymentId: 1, type: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("WalletTxn", walletTxnSchema);