const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;

const accountDriverSchema = new schema(
    {
        firstName: { type: String },
        lastName: { type: String },
        profilePicture: { type: String },
        dob: { type: String, },
        gender: { type: String, enum: ["male", "female", "other"], required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        driverId: { type: schema.Types.ObjectId, ref: "driver", required: true },
        walletId: { type: schema.Types.ObjectId, ref: "wallet", },
        vehiclesId: [{ type: schema.Types.ObjectId, ref: "vehicle", }],
        documentIds: [{ type: schema.Types.ObjectId, ref: "driverDocument", }],
        accountStatus: {
            type: String,
            enum: ["pending", "rejected", "approved"],
            default: "pending"
        },
        reasonForRejection: { type: String },
        profileCompleted: { type: Boolean, default: false },
        documentVerification: { type: Boolean, default: false },
        driverType: { type: String, enum: ["individual", "agency"] },
        verifiedBy: { type: schema.Types.ObjectId },//admin
        verifiedAt: { type: Date },
        createdBy: { type: schema.Types.ObjectId, ref: "driver" },
        updatedBy: { type: schema.Types.ObjectId, ref: "driver" },
    },
    { timestamps: true }
);

accountDriverSchema.index({ driverId: 1 }, { unique: true });
accountDriverSchema.index({ walletId: 1 }, { unique: true });
accountDriverSchema.plugin(paginate);
accountDriverSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("accountDriver", accountDriverSchema);
