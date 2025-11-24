const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        fullName: { type: String },
        email: { type: String },
        phoneNumber: { type: Number, required: true, unique: true },
        phoneOTP: { type: Number, },
        password: { type: String },
        accountType: {
            type: String,
            default: "user",
        },
        profilePicture: { type: String },
        collectionName: {
            type: String,
            default: "users",
        },
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(paginate);
userSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("users", userSchema);
