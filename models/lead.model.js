const mongoose = require("mongoose");
const schema = mongoose.Schema;
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const user = require("./user.model");

const leadSchema = new schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
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
        vehicleType: { type: String },//, enum: ["SUV", "Sedan", "Hatchback"] 
        pickUpDate: { type: Date, required: true },
        pickUpTime: { type: Date },
        userCity: { type: String },
        adminSeen: { type: Boolean, default: false },
        createdDate: { type: String }, // If this is a user-input display date
        leadStatus: {
            type: String,
            enum: ["NEW-LEAD", "CONFIRMED", "CANCELLED", "COMPLETED", "STARTED"],
            default: "NEW-LEAD"
        },
        showFlag: { type: Boolean, default: false },
        uniqueLeadName: { type: String, unique: true },
        createdBy: { type: schema.Types.ObjectId, ref: "users" },
        updatedBy: { type: schema.Types.ObjectId, ref: "users" },
        assign: {
            driverId: { type: schema.Types.ObjectId, ref: "driver" },
            assignedAt: { type: Date },
            assignmentStatus: {
                type: String,
                enum: ["pending", "accepted", "rejected"],
                default: "pending"
            },
            assignType: {
                type: String,
                enum: ["auto", "manual"],
                default: "auto"
            }
        },
        rejectionHistory: [
            {
                reason: String,
                rejectedBy: { type: schema.Types.ObjectId, ref: "driver" },
                rejectedAt: { type: Date, default: Date.now }
            }
        ],
        cancellationReason: { type: String },
        cancellationHistory: [
            {
                reason: String,
                cancelledBy: { type: schema.Types.ObjectId, ref: "users" },
                cancelledAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

leadSchema.plugin(paginate);
leadSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("lead", leadSchema);
