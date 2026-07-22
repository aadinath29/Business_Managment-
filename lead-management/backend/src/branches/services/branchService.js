const branchRepository = require('../repositories/branchRepository');
const { BranchNotFoundError, DuplicateBranchCodeError } = require('../errors/branchErrors');
const { ForbiddenError, ValidationError } = require('../../auth/errors/authErrors');
const { ROLES } = require('../../auth/constants/authConstants');
const { withTransaction } = require('../../database/transactions');
const userRepository = require('../../auth/repositories/userRepository');
const passwordHelper = require('../../auth/utils/passwordHelper');
const logger = require('../../config/logger');

/**
 * Ensures user has management permissions (Super Admin or Admin).
 */
const enforceManagementRole = (userRole) => {
  if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('Only Administrators can modify branch resources');
  }
};

/**
 * Ensures user is a Super Admin. Branch lifecycle (create/delete) is
 * reserved for Super Admins — Branch Managers may only edit their own branch.
 */
const enforceSuperAdminRole = (userRole) => {
  if (userRole !== ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Only Super Administrators can create or delete branches');
  }
};

/**
 * Ensures user is not a Developer (Developers have no access to Branch Module).
 */
const enforceNotDeveloper = (userRole) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Access Denied: Developers do not have branch access');
  }
};

/**
 * Creates a new branch.
 */
const createBranch = async (tenantId, userRole, data) => {
  enforceSuperAdminRole(userRole);

  const hasManagerDetails = data.manager_email && data.manager_password;

  if (hasManagerDetails) {
    // 1. Pre-transaction validation checks
    // Email uniqueness check
    const emailExists = await userRepository.checkUserEmailExists(tenantId, data.manager_email);
    if (emailExists) {
      throw new ValidationError('A user with this email address already exists');
    }

    // Password strength check (min 6 characters matching backend auth rules)
    if (!data.manager_password || data.manager_password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Manager name check
    if (!data.manager_name || !data.manager_name.trim()) {
      throw new ValidationError('Manager name is required when provisioning a manager account');
    }

    // 2. Perform operations in an atomic transaction
    return withTransaction(async (transactionClient) => {
      // Resolve ADMIN role ID
      const adminRoleId = await userRepository.findRoleIdByName('ADMIN', transactionClient);
      if (!adminRoleId) {
        throw new ValidationError('Branch Manager role (ADMIN) not configured in the database');
      }

      // Check branch code conflict
      const exists = await branchRepository.checkBranchCodeExists(tenantId, data.branch_code, null, transactionClient);
      if (exists) {
        throw new DuplicateBranchCodeError();
      }

      // Hash manager password
      const passwordHash = await passwordHelper.hashPassword(data.manager_password);

      // Parse first/last name
      const nameParts = data.manager_name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Branch';
      const lastName = nameParts.slice(1).join(' ') || 'Manager';

      // Create manager user
      const managerUser = await userRepository.createManagerUser(tenantId, adminRoleId, {
        email: data.manager_email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone: data.phone
      }, transactionClient);

      // Create branch referencing new user as manager_id
      const branchPayload = {
        ...data,
        manager_id: managerUser.id
      };
      delete branchPayload.manager_name;
      delete branchPayload.manager_email;
      delete branchPayload.manager_password;

      const branch = await branchRepository.create(tenantId, branchPayload, transactionClient);
      logger.info(`Branch & Manager Created: ID=${branch.id} | Code=${branch.branch_code} | ManagerUser=${managerUser.id} | Tenant=${tenantId}`);
      return branch;
    }).then(async (branch) => {
      // Re-read outside the transaction so the response carries manager identity + computed counts
      const enriched = await branchRepository.findById(branch.id, tenantId);
      return enriched || branch;
    });
  } else {
    // Non-provisioning path: simple create
    const exists = await branchRepository.checkBranchCodeExists(tenantId, data.branch_code);
    if (exists) {
      throw new DuplicateBranchCodeError();
    }

    const branchPayload = { ...data };
    delete branchPayload.manager_name;
    delete branchPayload.manager_email;
    delete branchPayload.manager_password;

    const branch = await branchRepository.create(tenantId, branchPayload);
    logger.info(`Branch Created (No Provisioning): ID=${branch.id} | Code=${branch.branch_code} | Tenant=${tenantId}`);
    return branch;
  }
};

/**
 * List branches under a tenant with filtering and search constraints.
 */
const getBranches = async (tenantId, userRole, userId, filters) => {
  enforceNotDeveloper(userRole);

  // If Team Leader, they can ONLY view their own assigned branch
  if (userRole === ROLES.TEAM_LEADER) {
    const assignedBranchId = await branchRepository.findTeamLeaderAssignedBranchId(userId);
    if (!assignedBranchId) {
      return { rows: [], total: 0 };
    }

    const branch = await branchRepository.findById(assignedBranchId, tenantId);
    if (!branch) {
      return { rows: [], total: 0 };
    }

    // Apply filters locally for the Team Leader's single branch
    let matches = true;
    if (filters.status && branch.status !== filters.status) {
      matches = false;
    }
    if (filters.city && branch.city && branch.city.toLowerCase() !== filters.city.toLowerCase()) {
      matches = false;
    }
    if (filters.state && branch.state && branch.state.toLowerCase() !== filters.state.toLowerCase()) {
      matches = false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const nameMatch = branch.branch_name && branch.branch_name.toLowerCase().includes(s);
      const codeMatch = branch.branch_code && branch.branch_code.toLowerCase().includes(s);
      const companyMatch = branch.company_name && branch.company_name.toLowerCase().includes(s);
      const cityMatch = branch.city && branch.city.toLowerCase().includes(s);

      if (!nameMatch && !codeMatch && !companyMatch && !cityMatch) {
        matches = false;
      }
    }

    return {
      rows: matches ? [branch] : [],
      total: matches ? 1 : 0
    };
  }

  // If Admin (Branch Manager), they can ONLY view their own assigned branch
  if (userRole === ROLES.ADMIN) {
    const assignedBranchId = await branchRepository.findManagerAssignedBranchId(userId);
    if (!assignedBranchId) {
      return { rows: [], total: 0 };
    }

    const branch = await branchRepository.findById(assignedBranchId, tenantId);
    if (!branch) {
      return { rows: [], total: 0 };
    }

    // Apply filters locally for the Admin's single branch
    let matches = true;
    if (filters.status && branch.status !== filters.status) {
      matches = false;
    }
    if (filters.city && branch.city && branch.city.toLowerCase() !== filters.city.toLowerCase()) {
      matches = false;
    }
    if (filters.state && branch.state && branch.state.toLowerCase() !== filters.state.toLowerCase()) {
      matches = false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const nameMatch = branch.branch_name && branch.branch_name.toLowerCase().includes(s);
      const codeMatch = branch.branch_code && branch.branch_code.toLowerCase().includes(s);
      const companyMatch = branch.company_name && branch.company_name.toLowerCase().includes(s);
      const cityMatch = branch.city && branch.city.toLowerCase().includes(s);

      if (!nameMatch && !codeMatch && !companyMatch && !cityMatch) {
        matches = false;
      }
    }

    return {
      rows: matches ? [branch] : [],
      total: matches ? 1 : 0
    };
  }

  // Super Admin has full tenant listing access
  return branchRepository.findAll(tenantId, filters);
};

/**
 * Get a single branch details.
 */
const getBranchById = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);

  if (userRole === ROLES.TEAM_LEADER) {
    const assignedBranchId = await branchRepository.findTeamLeaderAssignedBranchId(userId);
    if (id !== assignedBranchId) {
      throw new ForbiddenError('You are only authorized to view your assigned branch');
    }
  }

  if (userRole === ROLES.ADMIN) {
    const assignedBranchId = await branchRepository.findManagerAssignedBranchId(userId);
    if (id !== assignedBranchId) {
      throw new ForbiddenError('You are only authorized to view your assigned branch');
    }
  }

  const branch = await branchRepository.findById(id, tenantId);
  if (!branch) {
    throw new BranchNotFoundError();
  }

  return branch;
};

/**
 * Update an existing branch profile.
 */
const updateBranch = async (id, tenantId, userRole, userId, data) => {
  enforceManagementRole(userRole);

  if (userRole === ROLES.ADMIN) {
    const assignedBranchId = await branchRepository.findManagerAssignedBranchId(userId);
    if (id !== assignedBranchId) {
      throw new ForbiddenError('You are only authorized to update your assigned branch');
    }
    // A Branch Manager can never reassign or detach the manager binding —
    // doing so would lock them out of their own branch.
    delete data.manager_id;
  }

  const existingBranch = await branchRepository.findById(id, tenantId);
  if (!existingBranch) {
    throw new BranchNotFoundError();
  }

  // If changing branch code, check for conflicts
  if (data.branch_code && data.branch_code !== existingBranch.branch_code) {
    const exists = await branchRepository.checkBranchCodeExists(tenantId, data.branch_code, id);
    if (exists) {
      throw new DuplicateBranchCodeError();
    }
  }

  await branchRepository.update(id, tenantId, data);
  logger.info(`Branch Updated: ID=${id} | Tenant=${tenantId}`);
  // Re-read so the response carries manager identity + computed counts
  return branchRepository.findById(id, tenantId);
};

/**
 * Soft deletes a branch record.
 */
const deleteBranch = async (id, tenantId, userRole, userId) => {
  enforceSuperAdminRole(userRole);

  const existingBranch = await branchRepository.findById(id, tenantId);
  if (!existingBranch) {
    throw new BranchNotFoundError();
  }

  await branchRepository.softDelete(id, tenantId);
  
  if (existingBranch.manager_id) {
    await userRepository.softDeleteUser(existingBranch.manager_id, tenantId);
  }

  logger.info(`Branch Deleted (Soft): ID=${id} | Tenant=${tenantId}`);
  return true;
};

/**
 * Get branch quarterly targets
 */
const getQuarterlyTargets = async (id, tenantId, userRole, userId, financialYear) => {
  enforceNotDeveloper(userRole);

  if (userRole === ROLES.TEAM_LEADER) {
    const assignedBranchId = await branchRepository.findTeamLeaderAssignedBranchId(userId);
    if (id !== assignedBranchId) {
      throw new ForbiddenError('You are only authorized to view your assigned branch');
    }
  }

  if (userRole === ROLES.ADMIN) {
    const assignedBranchId = await branchRepository.findManagerAssignedBranchId(userId);
    if (id !== assignedBranchId) {
      throw new ForbiddenError('You are only authorized to view your assigned branch');
    }
  }

  const existingBranch = await branchRepository.findById(id, tenantId);
  if (!existingBranch) {
    throw new BranchNotFoundError();
  }

  const targets = await branchRepository.getQuarterlyTargets(tenantId, id, financialYear);
  return targets || { q1_target: 0, q2_target: 0, q3_target: 0, q4_target: 0 };
};

/**
 * Update branch quarterly targets
 */
const updateQuarterlyTargets = async (id, tenantId, userRole, userId, data) => {
  enforceManagementRole(userRole);

  if (userRole === ROLES.ADMIN) {
    const assignedBranchId = await branchRepository.findManagerAssignedBranchId(userId);
    if (id !== assignedBranchId) {
      throw new ForbiddenError('You are only authorized to update your assigned branch targets');
    }
  }

  const existingBranch = await branchRepository.findById(id, tenantId);
  if (!existingBranch) {
    throw new BranchNotFoundError();
  }

  const { financial_year, ...targets } = data;
  const updated = await branchRepository.upsertQuarterlyTargets(tenantId, id, financial_year, targets);
  
  logger.info(`Branch Quarterly Targets Updated: BranchID=${id} | FY=${financial_year} | Tenant=${tenantId}`);
  return updated;
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getQuarterlyTargets,
  updateQuarterlyTargets
};
