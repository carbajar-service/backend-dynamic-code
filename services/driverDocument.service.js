const driverDocumentModel = require("../models/driverDocument.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");
const accountDriverService = require("./accountDriver.service");
const upload = require("../core/cloudImage");

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
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }

    // Prevent duplicate document type for same driver
    const existingDocument = await driverDocumentModel.findOne({
        driverId: data.driverId,
    });

    if (existingDocument) {
        throw new AppError(409, "Document already uploaded");
    }

    // Utility function to handle array image uploads
    const uploadImages = async (images, folder) => {
        const multiPictures = await upload.uploadArrayImage(images, folder);
        return multiPictures
            .map(picture => picture?.cloudinaryResponse?.secure_url ? { image: picture?.cloudinaryResponse?.secure_url } : null)
            .filter(Boolean);
    };

    // Upload array images if present
    if (Array.isArray(data?.documentImages) && data.documentImages.length > 0) {
        data.documentImages = await uploadImages(data.documentImages, "documentImages");
        if (data.documentImages.length === 0) {
            throw new AppError(400, "Failed to upload array images for documentImages");
        }
    }

    const payload = {
        driverId: data.driverId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentImages: data.documentImages || [],
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
 * GET ALL DOCUMENTS (LOGGED-IN DRIVER)
 * =========================
 */
module.exports.getMyDocuments = async (loggedInDriver) => {
    logger.info("START: get logged-in driver documents");

    if (!loggedInDriver) {
        throw new AppError(401, "Unauthorized: driver not logged in");
    }

    const condition = { driverId: loggedInDriver._id };

    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        // { path: "verifiedBy", select: ["_id", "username", "accountType"] }
    ];

    const documents = await this.findAllRecord(
        condition,
        "-__v",
        populateQuery
    );

    logger.info("END: get logged-in driver documents");
    return documents;
};

/**
 * =========================
 * GET SINGLE DOCUMENT (LOGGED-IN DRIVER)
 * =========================
 */
module.exports.getMyDocumentById = async (documentId, loggedInDriver) => {
    logger.info("START: get single driver document");

    if (!loggedInDriver) {
        throw new AppError(401, "Unauthorized: driver not logged in");
    }

    if (!documentId) {
        throw new AppError(400, "documentId is required");
    }

    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        // { path: "verifiedBy", select: ["_id", "username", "accountType"] }
    ];

    const document = await this.findOneRecord(
        { _id: documentId, driverId: loggedInDriver._id },
        "-__v",
        populateQuery
    );

    if (!document) {
        throw new AppError(404, "Document not found or access denied");
    }

    logger.info("END: get single driver document");
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
