const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const bankTransferSchema = new schema(
  {
    // ✅ POLYMORPHIC OWNER
    ownerId: { type: schema.Types.ObjectId, ref: "driver", required: true, index: true },
    ownerType: {
      type: String,
      enum: ["individual", "agency"],
      required: true,
      index: true
    },

    accountNumber: {
      type: String,
      required: true
    },

    cardName: { type: String },

    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      validate: {
        validator: v => ifscRegex.test(v),
        message: props => `${props.value} is not a valid IFSC code`
      }
    },

    accountHolderName: {
      type: String,
      required: true
    },

    bankName: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// 🔒 Prevent duplicates per owner
bankTransferSchema.index(
  { ownerId: 1, accountNumber: 1 },
  { unique: true }
);

bankTransferSchema.index({ ifscCode: 1 });

bankTransferSchema.plugin(paginate);
bankTransferSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("bankTransfer", bankTransferSchema);
