const driverDocumentModel = require("../models/driverDocument.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");
const accountDriverService = require("./accountDriver.service");
const upload = require("../core/cloudImage");
const accountAgencyService = require("./accountAgency.service");

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
module.exports.createDocument = async (data, loggedInOwner) => {
    logger.info("START: creating document");

    /* =====================================================
       1️⃣ BASIC VALIDATION
    ===================================================== */
    const requiredFields = ["documentType","documentNumber"];
    for (const field of requiredFields) {
        if (!data[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }

    /* =====================================================
       2️⃣ DUPLICATE CHECK (SWITCH CASE)
    ===================================================== */
    switch (loggedInOwner.accountType) {

        case "individual": {
            // ❌ Individual can upload ONLY ONE document
            const existingDoc = await driverDocumentModel.findOne({
                ownerId: loggedInOwner._id
            });

            if (existingDoc) {
                throw new AppError(
                    409,
                    "Individual driver can upload only one document"
                );
            }
            break;
        }

        case "agency": {
            // ❌ Agency cannot upload same documentType twice
            const duplicateDoc = await driverDocumentModel.findOne({
                ownerId: loggedInOwner._id,
                // documentType: data.documentType
            });

            // if (duplicateDoc) {
            //     throw new AppError(
            //         409,
            //         `${data.documentType} document already uploaded`
            //     );
            // }
            break;
        }

        default:
            throw new AppError(400, "Invalid account type");
    }

    /* =====================================================
       3️⃣ IMAGE UPLOAD (ARRAY)
    ===================================================== */
    const uploadImages = async (images, folder) => {
        const uploaded = await upload.uploadArrayImage(images, folder);
        return uploaded
            .map(img =>
                img?.cloudinaryResponse?.secure_url
                    ? { image: img.cloudinaryResponse.secure_url }
                    : null
            )
            .filter(Boolean);
    };

    if (Array.isArray(data.documentImages) && data.documentImages.length > 0) {
        data.documentImages = await uploadImages(
            data.documentImages,
            "documentImages"
        );

        if (!data.documentImages.length) {
            throw new AppError(400, "Failed to upload document images");
        }
    }

    /* =====================================================
       4️⃣ CREATE DOCUMENT
    ===================================================== */
    const payload = {
        ownerId: loggedInOwner._id,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentImages: data.documentImages || [],
        createdBy: loggedInOwner._id,
        updatedBy: loggedInOwner._id
    };

    const document = await this.createRecord(payload);

    /* =====================================================
       5️⃣ LINK DOCUMENT TO PROFILE (SWITCH CASE)
    ===================================================== */
    switch (loggedInOwner.accountType) {

        case "individual": {
            await accountDriverService.updateRecord(
                { driverId: loggedInOwner._id },
                { $set: { documentIds: [document._id] } } // enforce single doc
            );
            break;
        }

        case "agency": {
            await accountAgencyService.updateRecord(
                { agencyId: loggedInOwner._id },
                { $addToSet: { documentIds: document._id } }
            );
            break;
        }
    }

    logger.info("END: document created successfully");
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

    const condition = { ownerId: loggedInDriver._id };

    const populateQuery = [
        { path: "ownerId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
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
        { path: "ownerId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] },
        // { path: "verifiedBy", select: ["_id", "username", "accountType"] }
    ];

    const document = await this.findOneRecord(
        { _id: documentId, ownerId: loggedInDriver._id },
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
