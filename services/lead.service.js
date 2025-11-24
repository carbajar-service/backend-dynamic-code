const LeadModel = require("../models/lead.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");

// Create Record
module.exports.createRecord = async (object) => {
    const record = await LeadModel.create(object);
    return record;
};

// Find One Record
module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await LeadModel.findOne(conditions)
        .select(select)
        .populate(populateQuery);
    return record;
};

// Find All Records
module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await LeadModel.find(conditions)
        .select(select)
        .populate(populateQuery);
    return record;
};

// Update Record
module.exports.updateRecord = async (condition, body) => {
    const options = { new: true, runValidators: true };
    const record = await LeadModel.findOneAndUpdate(condition, body, options);
    return record;
};

module.exports.generateLeadId = () => {
    return "LEAD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Create Lead
module.exports.createLead = async (body) => {
    logger.info("START: Creating Lead");
    const requiredFields = [
        "tripType",
        "locations",
        "pickUpDate"
    ];
    for (const field of requiredFields) {
        if (!body[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }

    const payloadData = {
        tripType: body.tripType,
        locations: body.locations,
        pickUpDate: body.pickUpDate,
        pickUpTime: body.pickUpTime,
        totalKm: body.totalKm,
        totalAmount: body.totalAmount,
        vehicleType: body.vehicleType,
        userCity: body.userCity,
        adminSeen: false,
        leadStatus: "NEW-LEAD",
        createdBy: body.userId,
        updatedBy: body.userId,
        userId: body.userId,
        uniqueLeadName: this.generateLeadId(),
    };
    const record = await this.createRecord(payloadData);
    logger.info(`Lead Created: ${record._id}`);
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const leadRecord = await this.findOneRecord({ _id: record._id }, "", populateQuery);
    return leadRecord;
};

// User - Get My Leads
module.exports.getMyLeads = async (loggedInUser, query) => {
    logger.info("START: Fetch My Leads");
    const { page = 1, limit = 10 } = query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
    const condition = {
        $and: [{ createdBy: loggedInUser?._id }, { userId: loggedInUser?._id }],
        // TODO 
    };
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    // Fetch paginated results
    const result = await LeadModel
        .find(condition)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate(populateQuery)
        .select("-__v")
        .lean();

    // Count total matching documents
    const total = await LeadModel.countDocuments(condition);
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    const nextPage = hasNextPage ? pageNumber + 1 : null;
    const prevPage = hasPrevPage ? pageNumber - 1 : null;
    logger.info("END: Get All Lead");
    return {
        docs: result,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage
    };
};

module.exports.updateLead = async (leadId, body, loggedInUser) => {
    logger.info("START: Updating Lead");

    // Ensure lead belongs to user
    const existingLead = await LeadModel.findOne({
        _id: leadId,
        createdBy: loggedInUser?._id
    });

    if (!existingLead) {
        throw new AppError(403, "You are not authorized to update this lead");
    }

    // Prevent update if pickup time already passed
    const pickupDateTime = existingLead.pickUpTime
        ? new Date(existingLead.pickUpTime)
        : new Date(existingLead.pickUpDate);

    if (pickupDateTime <= new Date()) {
        throw new AppError(
            400,
            "You cannot update this lead because the pickup time has already passed"
        );
    }

    // Only allow selected fields to be updated
    const updatePayload = {
        updatedBy: loggedInUser._id,
        updatedAt: new Date()
    };

    const updatableFields = [
        "tripType",
        "locations",
        "pickUpDate",
        "pickUpTime",
        "totalKm",
        "totalAmount",
        "vehicleType",
        "userCity"
    ];

    updatableFields.forEach(field => {
        if (body[field] !== undefined) {
            updatePayload[field] = body[field];
        }
    });

    const updatedLead = await LeadModel.findOneAndUpdate(
        { _id: leadId },
        updatePayload,
        { new: true, runValidators: true }
    )
        .populate([
            {
                path: "createdBy",
                select: ["_id", "username", "accountType", "phoneNumber"]
            },
            {
                path: "updatedBy",
                select: ["_id", "username", "accountType"]
            }
        ]);

    logger.info(`Lead Updated: ${leadId}`);
    return updatedLead;
};

// Update Lead Status
module.exports.updateLeadStatus = async (leadId, status, user) => {
    logger.info("START: Update Lead Status");

    const allowed = ["NEW-LEAD", "FOLLOW-UP", "CONFIRMED", "CANCELLED"];
    if (!allowed.includes(status)) {
        throw new AppError(400, "Invalid Lead Status");
    }

    const updatePayload = {
        leadStatus: status,
        updatedBy: user?._id
    };

    const lead = await this.updateRecord({ _id: leadId }, updatePayload);
    if (!lead) throw new AppError(404, "Lead not found");

    return lead;
};


// Delete Lead
module.exports.deleteLead = async (leadId) => {
    logger.info("START: Deleting Lead");

    const deleted = await LeadModel.findOneAndDelete({ _id: leadId });
    if (!deleted) throw new AppError(404, "Lead not found in collection");

    return true;
};
