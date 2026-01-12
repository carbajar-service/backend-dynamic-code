const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;

const vehicleSchema = new mongoose.Schema(
    {
        driverId: { type: schema.Types.ObjectId, ref: "driver", required: true, index: true },
        vehicleType: { type: String, required: true },
        vehicleName: { type: String, required: true },
        vehicleNumber: { type: String, required: true, unique: true },
        vehicleRc: { type: String, required: true, unique: true },
        vehicleRcImages: [{ image: { type: String } }],
        vehicleImages: [{ image: { type: String } }],
        vehicleStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        vehicleBrand: { type: String, required: true },
        vehicleModel: { type: String, required: true },
        numberOfSeats: { type: String, },
        regYear: { type: String, required: true },
        verifiedBy: { type: schema.Types.ObjectId },//admin
        verifiedAt: { type: Date },
        createdBy: { type: schema.Types.ObjectId, ref: "driver" },
        updatedBy: { type: schema.Types.ObjectId, ref: "driver" }
    },
    { timestamps: true }
);

vehicleSchema.plugin(paginate);
vehicleSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("vehicle", vehicleSchema);
