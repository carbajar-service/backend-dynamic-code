const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const driverSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        emailOtp: { type: Number, },
        phoneNumber: { type: Number, required: true, unique: true },
        phoneOTP: { type: Number, },
        password: { type: String },
        accountType: {
            type: String,
            default: "driver",
        },
        isDriver: { type: Boolean, default: true },
        collectionName: {
            type: String,
            default: "driver",
        },
    },
    {
        timestamps: true,
    }
);

driverSchema.plugin(paginate);
driverSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("driver", driverSchema);
