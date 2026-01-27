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

// 1. Create Lead
module.exports.createLead = async (body) => {
    logger.info("START: Creating Lead.....");
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
    const leadRecord = await this.findOneRecord({ _id: record._id }, "-rejectionHistory -cancellationHistory -__v -adminSeen", populateQuery);
    return leadRecord;
};

// 2. User - Get My Leads all & by status 
module.exports.getMyLeads = async (loggedInUser, query) => {
    logger.info("START: Fetch My Leads");
    const {
        page = 1,
        limit = 10,
        ridestatus // this is the filter
    } = query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const statusMapping = {
        latest: "NEW-LEAD",
        conformed: "CONFIRMED",
        processing: "PROCESSING",
        cancelled: "CANCELLED",
        completed: "COMPLETED",
        cron: "CRON"
    };

    let condition = {
        createdBy: loggedInUser._id,
        userId: loggedInUser._id
    };

    // Apply status filter if provided and valid
    if (ridestatus && statusMapping[ridestatus.toLowerCase()]) {
        condition.leadStatus = statusMapping[ridestatus.toLowerCase()];
    }

    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];

    const result = await LeadModel.find(condition)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate(populateQuery)
        .select("-__v -cancellationHistory")
        .lean();

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

// 3. user update laed
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

//4. user Delete Lead
module.exports.deleteLead = async (leadId) => {
    logger.info("START: Deleting Lead");
    const deleted = await LeadModel.findOneAndDelete({ _id: leadId });
    if (!deleted) throw new AppError(404, "Lead not found in collection");
    return true;
};

// 5. user can cancel the lead/ride
module.exports.cancelMyLead = async (leadId, loggedInUser, body) => {
    logger.info("START: Cancel My Lead");
    if (!body.reasonForCancellation) {
        throw new AppError(400, "Cancellation reason is required");
    }
    // Find the lead
    const condition = {
        $and: [{ _id: leadId }, { userId: loggedInUser?._id }]
    }
    const lead = await LeadModel.findOne(condition);
    if (!lead) {
        throw new AppError(404, "Lead not found or does not belong to you");
    }
    if (lead?.leadStatus === "CANCELLED") {
        throw new AppError(400, "This lead is already cancelled");
    }
    // Combine pickUpDate + pickUpTime into a single DateTime
    const pickupDateTime = new Date(`${lead.pickUpDate}T${lead.pickUpTime}`);
    const currentDateTime = new Date();
    if (pickupDateTime <= currentDateTime) {
        throw new AppError(400, "You cannot cancel a ride after pickup time");
    }
    // Track history entry
    const history = {
        reason: body.reasonForCancellation,
        cancelledBy: loggedInUser._id,
        cancelledAt: new Date()
    };
    // Update lead details
    lead.leadStatus = "CANCELLED";
    lead.updatedBy = loggedInUser._id;
    lead.cancellationReason = body.reasonForCancellation;
    lead.cancellationHistory.push(history);
    await lead.save();
    logger.info("Lead canceled successfully with reason");
    return {
        leadStatus: lead.leadStatus,
        uniqueLeadName: lead.uniqueLeadName,
        cancellationReason: lead.cancellationReason
    };
};

// 6. cancel history
module.exports.getCancellationHistory = async (loggedInUser) => {
    logger.info("START: Fetch All Cancellation History");

    // Find all leads of this user that have cancellation history
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "phoneNumber"] },
        { path: "cancellationHistory.cancelledBy", select: ["_id", "username", "accountType"] },
    ];
    const condition = {
        userId: loggedInUser._id,
        cancellationHistory: { $exists: true, $ne: [] }
    }
    const filter = { cancellationHistory: 1 }
    const leads = await LeadModel.find(condition, filter).populate(populateQuery).lean();

    if (!leads || leads.length === 0) {
        throw new AppError(404, "No cancellation history found for this user");
    }

    // Collect all cancellation events in one single array
    let history = [];
    leads.forEach(lead => {
        history = history.concat(lead.cancellationHistory);
    });

    // Sort by newest first
    history.sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt));
    logger.info("END: Fetch All Cancellation History");
    return history;
};

// admin / driver Update Lead Status
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

// get lead\ride by id 
module.exports.getSingleLead = async (leadId) => {
    logger.info("START: fetching lead by id");
    const condition = {
        _id: leadId
    }
    const populateQuery = [
        { path: "userId", select: ["_id", "username", "accountType", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const record = await this.findOneRecord(condition, "-rejectionHistory -cancellationHistory -__v -adminSeen", populateQuery);
    if (!record) throw new AppError(404, "Record not found in database");
    return record
}