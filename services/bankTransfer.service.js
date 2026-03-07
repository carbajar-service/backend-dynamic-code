const bankTransferModel = require("../models/bankTransfer.model.js");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const driverModel = require("../models/driver.model.js");

module.exports.createRecord = async (object) => {
    const record = await bankTransferModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await bankTransferModel.findOne(conditions).select(select)
        .populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const records = await bankTransferModel.find(conditions).select(select)
        .populate(populateQuery);
    return records;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true };
    const record = await bankTransferModel.findOneAndUpdate(condition, body, option);
    return record;
};

// GET BankTransfer
module.exports.createNewBankTransfer = async (data, loggedInOwner) => {
    logger.info("START: Creating Bank Transfer");

    /* =====================================================
       1️⃣ Validate owner context
    ===================================================== */
    if (!loggedInOwner?._id || !loggedInOwner?.accountType) {
        throw new AppError(403, "Invalid owner context");
    }

    const ownerId = loggedInOwner._id;
    const ownerType = loggedInOwner.accountType; // | driver | agency

    /* =====================================================
       2️⃣ Validate required fields
    ===================================================== */
    if (!data.accountNumber) throw new AppError(400, "Account Number is required");
    if (!data.ifscCode) throw new AppError(400, "IFSC Code is required");
    if (!data.bankName) throw new AppError(400, "Bank Name is required");
    if (!data.accountHolderName) throw new AppError(400, "Account Holder Name is required");

    /* =====================================================
       3️⃣ Prevent duplicate per owner
    ===================================================== */
    const existing = await bankTransferModel.findOne({
        ownerId,
        ownerType,
        accountNumber: data.accountNumber
    });

    if (existing) {
        throw new AppError(
            409,
            "Bank account already exists for this owner"
        );
    }

    /* =====================================================
       4️⃣ Create bank transfer record
    ===================================================== */
    const payload = {
        ownerId,
        ownerType,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        cardName: data.cardName || null
    };

    const created = await bankTransferModel.create(payload);
    logger.info("END: Bank Transfer Created Successfully");
    return created;
};

// BankTransfer for admin
module.exports.getOneBankTransfer = async (bankTransferId) => {
    logger.info("START: Get One Bank Transfer in Service");
    const populateData = [{ path: "ownerId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },]
    const bank = await this.findOneRecord({ _id: bankTransferId }, "", populateData);
    logger.info("END: Get Bank Transfer Successfully");
    return bank;
};

// Get All BankTransfer 
module.exports.getAllBankTransfers = async (loggedIn, query) => {
    logger.info("START: Get One Bank Transfer in Service");
    const populateData = [{ path: "ownerId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },];
    // check 
    const account = await driverModel.findOne({ _id: loggedIn._id });
    if (!account) throw new AppError("404", "Account Not Found")
    const condition = {
        ownerId: account._id
    }
    const bank = await this.findAllRecord(condition, "", populateData);
    logger.info("END: Get All Bank Transfer Successfully");
    return bank;
};

// Delete BankTransfer 
module.exports.deleteBankTransfers = async (bankTransferId) => {
    logger.info("START: Delete Bank Transfer in Service");
    const bank = await bankTransferModel.findByIdAndDelete({ _id: bankTransferId })
    logger.info("END: Delete Bank Transfer Successfully");
    return true;
};

