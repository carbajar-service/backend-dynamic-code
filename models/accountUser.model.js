const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;

const accountUserSchema = new schema(
    {
        firstName: { type: String },
        lastName: { type: String },
        profilePicture: { type: String },
        dob: { type: String, },
        gender: { type: String, enum: ["male", "female", "other"], required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        accountStatus: {
            type: String,
            enum: ["pending", "rejected", "active"],
            default: "active"
        },
        reasonForRejection: { type: String },
        profileCompleted: { type: Boolean, default: false },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
        walletId: { type: schema.Types.ObjectId, ref: "wallet", },
        createdBy: { type: schema.Types.ObjectId, ref: "users" },
        updatedBy: { type: schema.Types.ObjectId, ref: "users" },
    },
    { timestamps: true }
);

accountUserSchema.index({ userId: 1 }, { unique: true });
accountUserSchema.index({ walletId: 1 }, { unique: true });
accountUserSchema.plugin(paginate);
accountUserSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("accountUser", accountUserSchema);
