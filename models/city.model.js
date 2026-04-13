// models/city.model.js

const mongoose = require('mongoose');
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const citySchema = new mongoose.Schema({
    cityName: {
        type: String,
        required: true,
        unique: true
    },
    basePrice: {
        type: Number,
    },
    price: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

citySchema.plugin(paginate);
citySchema.plugin(aggregatePaginate);

module.exports = mongoose.model('city', citySchema);