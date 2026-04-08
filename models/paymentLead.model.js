// models/paymentLead.model.js

const mongoose = require("mongoose");

const paymentLeadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    index: true
  },

  leadId: {   // ✅ CRITICAL LINK
    type: mongoose.Schema.Types.ObjectId,
    ref: "lead",
    index: true
  },

  orderId: {
    type: String,
    required: true,
    unique: true
  },

  paymentId: {
    type: String,
    unique: true,
    sparse: true
  },

  signature: String,

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  status: {
    type: String,
    enum: ["created", "paid", "failed", "refunded"],
    default: "created",
    index: true
  },
  method: String,
  razorpayResponse: Object,
  paidAt: Date,
  failedReason: String,
  refundedAt: Date,
  paymentStage: {
    type: String,
    enum: ["ADVANCE", "FINAL"],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("paymentLead", paymentLeadSchema);