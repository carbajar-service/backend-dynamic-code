const leadService = require("../services/lead.service");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

class LeadController {

    // ➕ Create Lead (User)
    createLead = async (req, res) => {
        const reqData = req.body;
        reqData.userId = req.userId;
        console.log(reqData);        
        const result = await leadService.createLead(reqData);
        logger.info(result);
        return responser.send(201, "Lead Created Successfully", req, res, result);
    };

    // 📌 Get My Leads (User)
    getMyLeads = async (req, res) => {
        const loggedInUser = req.user;
        const result = await leadService.getMyLeads(loggedInUser, req.query);
        logger.info(result);
        return responser.send(200, "My Leads Fetched", req, res, result);
    };

    // ✏️ Update My Lead
    updateMyLead = async (req, res, next) => {
        const result = await leadService.updateLead(req.params.id, req.body, req.user);
        return responser.send(200, "Lead Updated Successfully", req, res, result);
    };

    // ❌ Delete My Lead
    deleteMyLead = async (req, res, next) => {
        const result = await leadService.deleteLead(req.params.id, req.user);
        return responser.send(200, "Lead Deleted Successfully", req, res, result);
    };
}

module.exports = new LeadController();
