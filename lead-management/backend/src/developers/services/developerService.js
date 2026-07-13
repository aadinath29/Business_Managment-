const developerRepository = require('../repositories/developerRepository');
const teamRepository = require('../../teams/repositories/teamRepository');
const userRepository = require('../../auth/repositories/userRepository');
const passwordHelper = require('../../auth/utils/passwordHelper');
const db = require('../../database');
const { withTransaction } = require('../../database/transactions');
const { ROLES } = require('../../auth/constants/authConstants');
const { ForbiddenError, ValidationError } = require('../../auth/errors/authErrors');
const {
  DeveloperNotFoundError,
  DuplicateEmployeeIdError,
  TeamNotFoundError
} = require('../errors/developerErrors');
const logger = require('../../config/logger');

/**
 * Enforces management permission (Super Admin or Admin).
 */
const enforceManagementRole = (userRole) => {
  if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('Only Administrators can modify developer profiles');
  }
};

/**
 * Resolves a team leader's team ID.
 */
const getTeamLeaderAssignedTeamId = async (userId, tenantId) => {
  const queryText = 'SELECT team_id FROM team_leaders WHERE user_id = $1 AND tenant_id = $2';
  const { rows } = await db.query(queryText, [userId, tenantId]);
  return rows.length ? rows[0].team_id : null;
};

/**
 * Resolves a developer's profile ID from user ID.
 */
const getDeveloperProfileIdByUserId = async (userId, tenantId) => {
  const queryText = 'SELECT id FROM developers WHERE user_id = $1 AND tenant_id = $2';
  const { rows } = await db.query(queryText, [userId, tenantId]);
  return rows.length ? rows[0].id : null;
};

/**
 * Creates a developer atomically inside a transaction.
 */
const createDeveloper = async (tenantId, userRole, userId, data) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Developers cannot create other developers');
  }

  if (userRole === ROLES.TEAM_LEADER) {
    const leaderTeamId = await getTeamLeaderAssignedTeamId(userId, tenantId);
    if (!leaderTeamId || leaderTeamId !== data.teamId) {
      throw new ForbiddenError('You can only add developers to your assigned team');
    }
  }

  // Validate team exists and belongs to tenant
  const team = await teamRepository.findTeamById(data.teamId, tenantId);
  if (!team) {
    throw new TeamNotFoundError();
  }

  // Validate email uniqueness
  const emailExists = await userRepository.checkUserEmailExists(tenantId, data.email);
  if (emailExists) {
    throw new ValidationError('A user with this email address already exists');
  }

  // Validate employee ID uniqueness
  const empIdExists = await developerRepository.checkEmployeeIdExists(tenantId, data.employeeId);
  if (empIdExists) {
    throw new DuplicateEmployeeIdError();
  }

  return withTransaction(async (transactionClient) => {
    // 1. Resolve role ID for DEVELOPER
    const devRoleId = await userRepository.findRoleIdByName(ROLES.DEVELOPER, transactionClient);
    if (!devRoleId) {
      throw new ValidationError('DEVELOPER role not configured in the database');
    }

    // 2. Hash password
    const passwordHash = await passwordHelper.hashPassword(data.password);

    // 3. Insert user record (status = 'Active')
    const user = await userRepository.createManagerUser(tenantId, devRoleId, {
      email: data.email,
      password_hash: passwordHash,
      first_name: data.firstName,
      last_name: data.lastName
    }, transactionClient);

    // 4. Insert developer profile record
    const profile = await developerRepository.createDeveloperProfile(tenantId, user.id, data, transactionClient);

    logger.info(`Developer Provisioned: ProfileID=${profile.id} | UserID=${user.id} | Tenant=${tenantId}`);
    return { ...profile, user };
  });
};

/**
 * Lists developers under a tenant, with role-based filters.
 */
const getDevelopers = async (tenantId, userRole, userId, filters) => {
  if (userRole === ROLES.DEVELOPER) {
    // Developer can only view their own profile
    const devId = await getDeveloperProfileIdByUserId(userId, tenantId);
    if (!devId) {
      return { rows: [], total: 0 };
    }
    const dev = await developerRepository.findDeveloperProfile(devId, tenantId);
    return {
      rows: dev ? [dev] : [],
      total: dev ? 1 : 0
    };
  }

  if (userRole === ROLES.TEAM_LEADER) {
    // Team Leader can only view developers in their assigned team
    const teamId = await getTeamLeaderAssignedTeamId(userId, tenantId);
    if (!teamId) {
      return { rows: [], total: 0 };
    }
    return developerRepository.findAllDevelopers(tenantId, { ...filters, team_id: teamId });
  }

  // Admin/Super Admin
  return developerRepository.findAllDevelopers(tenantId, filters);
};

/**
 * Gets developer details by ID.
 */
const getDeveloperById = async (id, tenantId, userRole, userId) => {
  const developer = await developerRepository.findDeveloperById(id, tenantId);
  if (!developer || developer.deleted_at !== null) {
    throw new DeveloperNotFoundError();
  }

  // RBAC checks
  if (userRole === ROLES.DEVELOPER && developer.user_id !== userId) {
    throw new ForbiddenError('Access Denied: You can only view your own profile');
  }

  if (userRole === ROLES.TEAM_LEADER) {
    const leaderTeamId = await getTeamLeaderAssignedTeamId(userId, tenantId);
    if (developer.team_id !== leaderTeamId) {
      throw new ForbiddenError('Access Denied: Developer does not belong to your team');
    }
  }

  return developer;
};

/**
 * Gets full developer profile mapping.
 */
const getDeveloperProfile = async (id, tenantId, userRole, userId) => {
  const profile = await developerRepository.findDeveloperProfile(id, tenantId);
  if (!profile) {
    throw new DeveloperNotFoundError();
  }

  // RBAC checks
  if (userRole === ROLES.DEVELOPER && profile.user_id !== userId) {
    throw new ForbiddenError('Access Denied: You can only view your own profile');
  }

  if (userRole === ROLES.TEAM_LEADER) {
    const leaderTeamId = await getTeamLeaderAssignedTeamId(userId, tenantId);
    if (profile.team_id !== leaderTeamId) {
      throw new ForbiddenError('Access Denied: Developer does not belong to your team');
    }
  }

  return profile;
};

/**
 * Gets developer performance.
 */
const getDeveloperPerformance = async (id, tenantId, userRole, userId) => {
  // Access verification
  const developer = await developerRepository.findDeveloperById(id, tenantId);
  if (!developer || developer.deleted_at !== null) {
    throw new DeveloperNotFoundError();
  }

  if (userRole === ROLES.DEVELOPER && developer.user_id !== userId) {
    throw new ForbiddenError('Access Denied: You can only view your own performance');
  }

  if (userRole === ROLES.TEAM_LEADER) {
    const leaderTeamId = await getTeamLeaderAssignedTeamId(userId, tenantId);
    if (developer.team_id !== leaderTeamId) {
      throw new ForbiddenError('Access Denied: Developer does not belong to your team');
    }
  }

  return {
    score: null,
    status: 'Not Available'
  };
};

/**
 * Updates a developer.
 */
const updateDeveloper = async (id, tenantId, userRole, data) => {
  enforceManagementRole(userRole);

  const developer = await developerRepository.findDeveloperById(id, tenantId);
  if (!developer || developer.deleted_at !== null) {
    throw new DeveloperNotFoundError();
  }

  // Verify unique employee ID if changed
  if (data.employeeId && data.employeeId.toLowerCase() !== developer.employee_id?.toLowerCase()) {
    const empIdExists = await developerRepository.checkEmployeeIdExists(tenantId, data.employeeId, id);
    if (empIdExists) {
      throw new DuplicateEmployeeIdError();
    }
  }

  // Verify team exists if changed
  if (data.teamId && data.teamId !== developer.team_id) {
    const team = await teamRepository.findTeamById(data.teamId, tenantId);
    if (!team) {
      throw new TeamNotFoundError();
    }
  }

  return withTransaction(async (transactionClient) => {
    // 1. Update user fields (first_name, last_name) in users table if provided
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const updates = [];
      const params = [];
      if (data.firstName !== undefined) {
        params.push(data.firstName);
        updates.push(`first_name = $${params.length}`);
      }
      if (data.lastName !== undefined) {
        params.push(data.lastName);
        updates.push(`last_name = $${params.length}`);
      }
      params.push(developer.user_id);
      params.push(tenantId);
      
      const userUpdateQuery = `
        UPDATE users
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
      `;
      await transactionClient.query(userUpdateQuery, params);
    }

    // 2. Update developer fields in developers table
    const devFields = {
      team_id: data.teamId,
      employee_id: data.employeeId
    };
    
    const updated = await developerRepository.updateDeveloperProfile(id, tenantId, devFields, transactionClient);
    logger.info(`Developer profile updated: ID=${id} | Tenant=${tenantId}`);
    return updated;
  });
};

/**
 * Soft deletes a developer.
 */
const deleteDeveloper = async (id, tenantId, userRole) => {
  enforceManagementRole(userRole);

  const developer = await developerRepository.findDeveloperById(id, tenantId);
  if (!developer || developer.deleted_at !== null) {
    throw new DeveloperNotFoundError();
  }

  await developerRepository.softDeleteDeveloper(id, tenantId);
  logger.info(`Developer soft-deleted: ID=${id} | Tenant=${tenantId}`);
  return true;
};

module.exports = {
  createDeveloper,
  getDevelopers,
  getDeveloperById,
  getDeveloperProfile,
  getDeveloperPerformance,
  updateDeveloper,
  deleteDeveloper
};
