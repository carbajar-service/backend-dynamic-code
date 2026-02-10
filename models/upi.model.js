const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const schema = mongoose.Schema;

const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

const upiSchema = new schema({
  // ✅ POLYMORPHIC OWNER
  ownerId: {
    type: schema.Types.ObjectId,
    required: true,
    index: true
  },

  ownerType: {
    type: String,
    enum: ["user", "driver", "agency"],
    required: true,
    index: true
  },
  upiId: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: v => upiRegex.test(v),
      message: props => `${props.value} is not a valid UPI ID`
    }
  },
  upiHolderName: {
    type: String,
    required: true
  },
  // TODO like atribute gpay or phonePay amazon pay etc 
  upiType: { type: String }
}, { timestamps: true });

upiSchema.index({ upiId: true })
upiSchema.plugin(paginate);
upiSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("upi", upiSchema);
