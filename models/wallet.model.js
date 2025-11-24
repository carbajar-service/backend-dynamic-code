const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;
const accountUserModel = require("./accountUser.model");
const accountDriverModel = require("./accountDriver.model");

const walletSchema = new schema(
    {
        accountUserId: { type: schema.Types.ObjectId, ref: "accountUser" },
        accountDriverId: { type: schema.Types.ObjectId, ref: "accountDriver" },
        balance: { type: Number, default: 0 }, // Current balance
        accountType: { type: String, enum: ["driver", "user"] }
    },
    { timestamps: true }
);

walletSchema.plugin(paginate);
walletSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("wallet", walletSchema);
