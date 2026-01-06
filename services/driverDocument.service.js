const driverDocumentModel = require("../models/driverDocument.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");
const accountDriverService = require("./accountDriver.service");

/**
 * =========================
 * COMMON HELPERS
 * =========================
 */

module.exports.createRecord = async (object) => {
    const record = await driverDocumentModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await driverDocumentModel
        .findOne(conditions)
        .select(select)
        .populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await driverDocumentModel
        .find(conditions)
        .select(select)
        .populate(populateQuery);
    return record;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await driverDocumentModel.findOneAndUpdate(condition, body, option);
    return record;
};

/**
 * =========================
 * CREATE DOCUMENT
 * =========================
 */
module.exports.createDocument = async (data) => {
    logger.info("START: creating driver document");

    const requiredFields = [
        "driverId",
        "documentType",
        "documentFile"
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }

    // Prevent duplicate document type for same driver
    const existingDocument = await driverDocumentModel.findOne({
        driverId: data.driverId,
        documentType: data.documentType
    });

    if (existingDocument) {
        throw new AppError(409, "Document already uploaded");
    }

    const payload = {
        driverId: data.driverId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentFile: data.documentFile,
        createdBy: data.driverId,
        updatedBy: data.driverId
    };

    const document = await this.createRecord(payload);

    // OPTIONAL: update profile progress (documents uploaded)
    const condition = { driverId: data.driverId }
    const updatePayload = { $push: { documentIds: document._id } }
    await accountDriverService.updateRecord(condition, updatePayload);

    logger.info("END: driver document created");
    return document;
};

/**
 * =========================
 * UPDATE / REUPLOAD DOCUMENT
 * =========================
 */
module.exports.updateDocument = async (documentId, data, userId) => {
    logger.info("START: updating driver document");

    const document = await driverDocumentModel.findById(documentId);

    if (!document) {
        throw new AppError(404, "Document not found");
    }

    const updatePayload = {
        documentStatus: "pending",
        documentVerification: false,
        rejectionReason: null,
        updatedBy: userId
    };

    if (data.documentFile) updatePayload.documentFile = data.documentFile;
    if (data.documentNumber) updatePayload.documentNumber = data.documentNumber;

    const updatedDocument = await this.updateRecord(
        { _id: documentId },
        updatePayload
    );

    logger.info("END: driver document updated");
    return updatedDocument;
};

/**
 * =========================
 * VERIFY / REJECT DOCUMENT
 * =========================
 */
module.exports.verifyDocument = async (documentId, body, adminId) => {
    logger.info("START: verifying driver document");

    const document = await driverDocumentModel.findById(documentId);

    if (!document) {
        throw new AppError(404, "Document not found");
    }

    if (!["approved", "rejected"].includes(body.documentStatus)) {
        throw new AppError(400, "Invalid documentStatus");
    }

    const updatePayload = {
        documentStatus: body.documentStatus,
        documentVerification: body.documentStatus === "approved",
        rejectionReason: body.documentStatus === "rejected"
            ? body.rejectionReason
            : null,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        updatedBy: adminId
    };

    const updatedDocument = await this.updateRecord(
        { _id: documentId },
        updatePayload
    );

    logger.info("END: document verification completed");
    return updatedDocument;
};
