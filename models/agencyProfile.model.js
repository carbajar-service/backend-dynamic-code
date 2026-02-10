const mongoose = require("mongoose");
const schema = mongoose.Schema;
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const agencyProfileSchema = new schema(
    {
        // in driver table we are managing agency also 
        agencyId: {
            type: schema.Types.ObjectId,
            ref: "driver",
            unique: true,
            required: true
        },
        agencyName: { type: String, required: true },
        gstNumber: { type: String },
        panNumber: { type: String },
        ownerName: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pinCode: { type: String, required: true },
        address: { type: String, required: true },
        vehicleIds: [
            { type: schema.Types.ObjectId, ref: "vehicle" }
        ],
        documentIds: [{ type: schema.Types.ObjectId, ref: "driverDocument", }],
        walletId: {
            type: schema.Types.ObjectId,
            ref: "wallet"
        },
        agencyStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        reasonForRejection: { type: String },
        profileCompleted: { type: Boolean, default: false },
        documentVerification: { type: Boolean, default: false },
        verifiedBy: { type: schema.Types.ObjectId, ref: "admin" },//admin
        verifiedAt: { type: Date },
        createdBy: { type: schema.Types.ObjectId, ref: "driver" },
        updatedBy: { type: schema.Types.ObjectId, ref: "driver" },
    },
    { timestamps: true }
);
// agencyProfileSchema.index({ agencyId: 1 }, { unique: true });
agencyProfileSchema.index({ walletId: 1 }, { unique: true });
agencyProfileSchema.plugin(paginate);
agencyProfileSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("agencyProfile", agencyProfileSchema);
