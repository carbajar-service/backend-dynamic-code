const mongoose = require("mongoose");
const schema = mongoose.Schema;
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const leadSchema = new schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        tripType: { type: String, enum: ["One Way", "Round Trip"], required: true },
        locations: {
            type: [String], // Array of locations
            validate: {
                validator: arr => arr.length >= 1,
                message: "At least one location required"
            }
        },
        totalKm: { type: String },
        totalAmount: { type: Number, default: 0 },
        vehicleType: { type: String, enum: ["SUV", "Sedan", "Hatchback"] },
        pickUpDate: { type: Date, required: true },
        pickUpTime: { type: Date },
        userCity: { type: String },
        adminSeen: { type: Boolean, default: false },
        createdDate: { type: String }, // If this is a user-input display date
        leadStatus: {
            type: String,
            enum: ["NEW-LEAD", "FOLLOW-UP", "CONFIRMED", "CANCELLED"],
            default: "NEW-LEAD"
        },
        uniqueLeadName: { type: String, unique: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    },
    { timestamps: true }
);

leadSchema.index({ uniqueLeadName: 1 }, { unique: true });
leadSchema.plugin(paginate);
leadSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("lead", leadSchema);
