const leadService = require('../services/leadService');
const {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  leadIdParamSchema,
  updateJourneySchema,
  createNoteSchema,
  updateNoteSchema,
  createCommunicationSchema,
  updateCommunicationSchema,
  createFollowupSchema,
  updateFollowupSchema,
  createRequirementSchema,
  updateRequirementSchema,
  createProposalSchema,
  updateProposalSchema,
  approveRejectProposalSchema,
  receiveAdvanceSchema
} = require('../validators/leadValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

// === Core Lead CRUD ===

const createLead = async (req, res, next) => {
  try {
    const validatedData = validate(createLeadSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const lead = await leadService.createLead(tenantId, userRole, userId, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const filters = validate(listLeadsQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const result = await leadService.getLeads(tenantId, userRole, userId, filters);
    const totalPages = Math.ceil(result.total / filters.limit) || 1;

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const lead = await leadService.getLeadById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateLeadSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const lead = await leadService.updateLead(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    await leadService.deleteLead(id, tenantId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// === Lead Journey & Timeline ===

const getLeadJourney = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const journey = await leadService.getLeadJourney(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: journey
    });
  } catch (error) {
    next(error);
  }
};

const updateLeadJourney = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateJourneySchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const journey = await leadService.updateLeadJourney(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Lead journey stage updated successfully',
      data: journey
    });
  } catch (error) {
    next(error);
  }
};

const getLeadTimeline = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const timeline = await leadService.getLeadTimeline(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

// === Phase 7C Notes ===

const createNote = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const { content } = validate(createNoteSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const note = await leadService.createNote(leadId, tenantId, userId, userRole, content);

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    next(error);
  }
};

const getNotes = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const notes = await leadService.getNotesByLeadId(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    next(error);
  }
};

const getNoteById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const note = await leadService.getNoteById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const { content } = validate(updateNoteSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const note = await leadService.updateNote(id, tenantId, userRole, userId, content);

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await leadService.deleteNote(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// === Phase 7C Communications ===

const createCommunication = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createCommunicationSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const comm = await leadService.createCommunication(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Communication logged successfully',
      data: comm
    });
  } catch (error) {
    next(error);
  }
};

const getCommunications = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const comms = await leadService.getCommunicationsByLeadId(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: comms
    });
  } catch (error) {
    next(error);
  }
};

const getCommunicationById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const comm = await leadService.getCommunicationById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: comm
    });
  } catch (error) {
    next(error);
  }
};

const updateCommunication = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateCommunicationSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const comm = await leadService.updateCommunication(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Communication updated successfully',
      data: comm
    });
  } catch (error) {
    next(error);
  }
};

const deleteCommunication = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await leadService.deleteCommunication(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// === Phase 7C Follow-ups ===

const createFollowup = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createFollowupSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const fu = await leadService.createFollowup(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Follow-up created successfully',
      data: fu
    });
  } catch (error) {
    next(error);
  }
};

const getFollowups = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const fus = await leadService.getFollowupsByLeadId(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: fus
    });
  } catch (error) {
    next(error);
  }
};

const getFollowupById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const fu = await leadService.getFollowupById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: fu
    });
  } catch (error) {
    next(error);
  }
};

const updateFollowup = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateFollowupSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const fu = await leadService.updateFollowup(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully',
      data: fu
    });
  } catch (error) {
    next(error);
  }
};

const deleteFollowup = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await leadService.deleteFollowup(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// === Phase 7D Requirements ===

const createRequirement = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createRequirementSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const reqItem = await leadService.createRequirement(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Requirement created successfully',
      data: reqItem
    });
  } catch (error) {
    next(error);
  }
};

const getRequirements = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const reqs = await leadService.getRequirementsByLeadId(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: reqs
    });
  } catch (error) {
    next(error);
  }
};

const getRequirementById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const reqItem = await leadService.getRequirementById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: reqItem
    });
  } catch (error) {
    next(error);
  }
};

const updateRequirement = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateRequirementSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const reqItem = await leadService.updateRequirement(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Requirement updated successfully',
      data: reqItem
    });
  } catch (error) {
    next(error);
  }
};

const deleteRequirement = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await leadService.deleteRequirement(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// === Phase 7D Proposals ===

const createProposal = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createProposalSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.createProposal(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

const getProposals = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposals = await leadService.getProposalsByLeadId(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: proposals
    });
  } catch (error) {
    next(error);
  }
};

const getProposalById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.getProposalById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

const updateProposal = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateProposalSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.updateProposal(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Proposal updated successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

const deleteProposal = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await leadService.deleteProposal(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const approveProposal = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const { remarks } = validate(approveRejectProposalSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.approveProposal(id, tenantId, userRole, userId, remarks);

    return res.status(200).json({
      success: true,
      message: 'Proposal approved successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

const rejectProposal = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const { remarks } = validate(approveRejectProposalSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.rejectProposal(id, tenantId, userRole, userId, remarks);

    return res.status(200).json({
      success: true,
      message: 'Proposal rejected successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

const signContract = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.signContract(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Contract signed successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

const receiveAdvance = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const { advance_amount } = validate(receiveAdvanceSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const proposal = await leadService.receiveAdvance(id, tenantId, userRole, userId, advance_amount);

    return res.status(200).json({
      success: true,
      message: 'Advance payment received successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getLeadJourney,
  updateLeadJourney,
  getLeadTimeline,
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  createCommunication,
  getCommunications,
  getCommunicationById,
  updateCommunication,
  deleteCommunication,
  createFollowup,
  getFollowups,
  getFollowupById,
  updateFollowup,
  deleteFollowup,
  createRequirement,
  getRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
  approveProposal,
  rejectProposal,
  signContract,
  receiveAdvance
};
