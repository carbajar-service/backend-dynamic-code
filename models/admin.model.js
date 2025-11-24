const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const adminSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        fullName: { type: String },
        email: { type: String, required: true, unique: true },
        emailOtp: { type: Number, },
        phoneNumber: { type: Number, required: true, unique: true },
        phoneOTP: { type: Number, },
        password: { type: String },
        accountType: {
            type: String,
            default: "admin",
        },
        isAdmin: { type: Boolean, required: true },
        profilePicture: { type: String },
        collectionName: {
            type: String,
            default: "admin",
        }
    },
    {
        timestamps: true,
    }
);

adminSchema.plugin(paginate);
adminSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("admin", adminSchema);
