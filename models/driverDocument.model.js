const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;

const driverDocumentSchema = new mongoose.Schema(
    {
        driverId: { type: schema.Types.ObjectId, ref: "driver", required: true, index: true },
        aadharNumber: { type: String, unique: true },
        driverDL: { type: String, unique: true },
        documentType: {
            type: String,
            enum: [
                "aadhar",
                "pan",
                "driving_license",
                "insurance",
                "permit",
                "gst",
                "agency_license"
            ],
            required: true
        },
        documentNumber: { type: String },
        documentFile: { type: String, },
        documentStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        documentVerification: { type: Boolean, default: false },
        rejectionReason: { type: String },
        verifiedBy: { type: schema.Types.ObjectId },//admin
        verifiedAt: { type: Date },
        createdBy: { type: schema.Types.ObjectId, ref: "driver", },
        updatedBy: { type: schema.Types.ObjectId, ref: "driver", },
    },
    { timestamps: true }
);

driverDocumentSchema.plugin(paginate);
driverDocumentSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("driverDocument", driverDocumentSchema);