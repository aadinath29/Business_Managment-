const teamRepository = require('../repositories/teamRepository');
const teamLeaderRepository = require('../repositories/teamLeaderRepository');
const userRepository = require('../../auth/repositories/userRepository');
const passwordHelper = require('../../auth/utils/passwordHelper');
const db = require('../../database');
const { withTransaction } = require('../../database/transactions');
const { ROLES } = require('../../auth/constants/authConstants');
const { ForbiddenError, ValidationError } = require('../../auth/errors/authErrors');
const {
  TeamNotFoundError,
  TeamLeaderNotFoundError,
  DuplicateTeamNameError,
  DuplicateEmployeeIdError,
  BranchMismatchError,
  DeveloperNotFoundError
} = require('../errors/teamErrors');
const logger = require('../../config/logger');

/**
 * Ensures user has management permissions (Super Admin or Admin).
 */
const enforceManagementRole = (userRole) => {
  if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('Only Administrators can modify team resources');
  }
};

/**
 * Ensures user is not a Developer (Developers have no access to Teams Module).
 */
const enforceNotDeveloper = (userRole) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Access Denied: Developers do not have access to team resources');
  }
};

/**
 * Creates a new team with an optional leader.
 */
const createTeamWithLeader = async (tenantId, userRole, data) => {
  enforceManagementRole(userRole);

  // Check if team name already exists under the tenant
  const teamNameExists = await teamRepository.checkTeamNameExists(tenantId, data.team_name);
  if (teamNameExists) {
    throw new DuplicateTeamNameError();
  }

  const hasLeaderDetails = data.leader_email && data.leader_password && data.leader_name;

  if (hasLeaderDetails) {
    // 1. Pre-validation checks
    const emailExists = await userRepository.checkUserEmailExists(tenantId, data.leader_email);
    if (emailExists) {
      throw new ValidationError('A user with this email address already exists');
    }

    if (data.employee_id) {
      const empIdExists = await teamLeaderRepository.checkEmployeeIdExists(tenantId, data.employee_id);
      if (empIdExists) {
        throw new DuplicateEmployeeIdError();
      }
    }

    // 2. Perform in atomic transaction
    return withTransaction(async (transactionClient) => {
      // Create team
      const team = await teamRepository.createTeam(tenantId, {
        branch_id: data.branch_id,
        team_name: data.team_name,
        department: data.department
      }, transactionClient);

      // Resolve role UUID for TEAM_LEADER
      const tlRoleId = await userRepository.findRoleIdByName(ROLES.TEAM_LEADER, transactionClient);
      if (!tlRoleId) {
        throw new ValidationError('TEAM_LEADER role not configured in the database');
      }

      // Hash password
      const passwordHash = await passwordHelper.hashPassword(data.leader_password);

      // Parse name
      const nameParts = data.leader_name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Team';
      const lastName = nameParts.slice(1).join(' ') || 'Leader';

      // Create User record
      const leaderUser = await userRepository.createManagerUser(tenantId, tlRoleId, {
        email: data.leader_email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName
      }, transactionClient);

      // Create Team Leader Profile
      const leaderProfile = await teamLeaderRepository.createLeader(tenantId, leaderUser.id, team.id, {
        employee_id: data.employee_id,
        designation: data.designation
      }, transactionClient);

      logger.info(`Team & Leader Created: TeamID=${team.id} | LeaderUserID=${leaderUser.id} | Tenant=${tenantId}`);
      return { ...team, leader: leaderProfile };
    });
  } else {
    // Non-provisioning simple path
    const team = await teamRepository.createTeam(tenantId, data);
    logger.info(`Team Created (No Leader): ID=${team.id} | Tenant=${tenantId}`);
    return team;
  }
};

/**
 * Lists teams under a tenant.
 */
const getTeams = async (tenantId, userRole, userId, filters) => {
  enforceNotDeveloper(userRole);

  if (userRole === ROLES.TEAM_LEADER) {
    // A Team Leader can only see their own assigned team
    const assignedTeamIdQuery = 'SELECT team_id FROM team_leaders WHERE user_id = $1 AND tenant_id = $2';
    const assignedRes = await db.query(assignedTeamIdQuery, [userId, tenantId]);
    if (assignedRes.rows.length === 0) {
      return { rows: [], total: 0 };
    }
    const teamId = assignedRes.rows[0].team_id;
    const team = await teamRepository.findTeamById(teamId, tenantId);
    return {
      rows: team ? [team] : [],
      total: team ? 1 : 0
    };
  }

  // Admin/Super Admin: full lists
  return teamRepository.findAllTeams(tenantId, filters);
};

/**
 * Gets a single team.
 */
const getTeamById = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);

  const team = await teamRepository.findTeamById(id, tenantId);
  if (!team) {
    throw new TeamNotFoundError();
  }

  if (userRole === ROLES.TEAM_LEADER) {
    if (team.team_leader_profile_id) {
      const leaderRes = await teamLeaderRepository.findLeaderById(team.team_leader_profile_id, tenantId);
      if (!leaderRes || leaderRes.user_id !== userId) {
        throw new ForbiddenError('You can only access details of your assigned team');
      }
    } else {
      throw new ForbiddenError('You can only access details of your assigned team');
    }
  }

  return team;
};

/**
 * Updates an existing team.
 */
const updateTeam = async (id, tenantId, userRole, data) => {
  enforceManagementRole(userRole);

  const team = await teamRepository.findTeamById(id, tenantId);
  if (!team) {
    throw new TeamNotFoundError();
  }

  if (data.team_name && data.team_name.toLowerCase() !== team.team_name.toLowerCase()) {
    const nameExists = await teamRepository.checkTeamNameExists(tenantId, data.team_name, id);
    if (nameExists) {
      throw new DuplicateTeamNameError();
    }
  }

  const updatedTeam = await teamRepository.updateTeam(id, tenantId, data);
  logger.info(`Team Updated: ID=${id} | Tenant=${tenantId}`);
  return updatedTeam;
};

/**
 * Soft deletes a team and its leader.
 */
const deleteTeam = async (id, tenantId, userRole) => {
  enforceManagementRole(userRole);

  const team = await teamRepository.findTeamById(id, tenantId);
  if (!team) {
    throw new TeamNotFoundError();
  }

  await withTransaction(async (transactionClient) => {
    // 1. Soft delete the team leader user account if the team has one
    if (team.team_leader_profile_id) {
      await teamLeaderRepository.softDeleteLeader(team.team_leader_profile_id, tenantId, transactionClient);
    }
    
    // 2. Soft delete the team
    await teamRepository.softDeleteTeam(id, tenantId, transactionClient);
  });

  logger.info(`Team and Leader deleted (Soft): TeamID=${id} | Tenant=${tenantId}`);
  return true;
};

/**
 * Creates a team leader profile and user for an existing team.
 */
const createTeamLeaderOnly = async (tenantId, userRole, data) => {
  enforceManagementRole(userRole);

  const team = await teamRepository.findTeamById(data.team_id, tenantId);
  if (!team) {
    throw new TeamNotFoundError();
  }

  // Check if team already has a leader
  if (team.team_leader_profile_id) {
    throw new ValidationError('This team already has an assigned Team Leader');
  }

  const emailExists = await userRepository.checkUserEmailExists(tenantId, data.email);
  if (emailExists) {
    throw new ValidationError('A user with this email address already exists');
  }

  if (data.employee_id) {
    const empIdExists = await teamLeaderRepository.checkEmployeeIdExists(tenantId, data.employee_id);
    if (empIdExists) {
      throw new DuplicateEmployeeIdError();
    }
  }

  return withTransaction(async (transactionClient) => {
    const tlRoleId = await userRepository.findRoleIdByName(ROLES.TEAM_LEADER, transactionClient);
    if (!tlRoleId) {
      throw new ValidationError('TEAM_LEADER role not configured in the database');
    }

    const passwordHash = await passwordHelper.hashPassword(data.password);
    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Team';
    const lastName = nameParts.slice(1).join(' ') || 'Leader';

    const leaderUser = await userRepository.createManagerUser(tenantId, tlRoleId, {
      email: data.email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName
    }, transactionClient);

    const leaderProfile = await teamLeaderRepository.createLeader(tenantId, leaderUser.id, data.team_id, {
      employee_id: data.employee_id,
      designation: data.designation,
      performance_score: data.performance_score
    }, transactionClient);

    logger.info(`Team Leader Provisioned: LeaderProfile=${leaderProfile.id} | Team=${data.team_id} | Tenant=${tenantId}`);
    return leaderProfile;
  });
};

/**
 * Lists team leaders.
 */
const getTeamLeaders = async (tenantId, userRole, userId, filters) => {
  enforceNotDeveloper(userRole);

  if (userRole === ROLES.TEAM_LEADER) {
    // Team Leader can only view their own profile
    const assignedLeaderQuery = 'SELECT id FROM team_leaders WHERE user_id = $1 AND tenant_id = $2';
    const res = await db.query(assignedLeaderQuery, [userId, tenantId]);
    if (res.rows.length === 0) {
      return { rows: [], total: 0 };
    }
    const leaderId = res.rows[0].id;
    const leader = await teamLeaderRepository.findLeaderById(leaderId, tenantId);
    return {
      rows: leader ? [leader] : [],
      total: leader ? 1 : 0
    };
  }

  return teamLeaderRepository.findAllLeaders(tenantId, filters);
};

/**
 * Gets a team leader profile by ID.
 */
const getTeamLeaderById = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);

  const leader = await teamLeaderRepository.findLeaderById(id, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  if (userRole === ROLES.TEAM_LEADER && leader.user_id !== userId) {
    throw new ForbiddenError('Access Denied: You cannot view this profile');
  }

  return leader;
};

/**
 * Updates team leader profile.
 */
const updateTeamLeader = async (id, tenantId, userRole, data) => {
  enforceManagementRole(userRole);

  const leader = await teamLeaderRepository.findLeaderById(id, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  if (data.employee_id && data.employee_id.toLowerCase() !== leader.employee_id?.toLowerCase()) {
    const empIdExists = await teamLeaderRepository.checkEmployeeIdExists(tenantId, data.employee_id, id);
    if (empIdExists) {
      throw new DuplicateEmployeeIdError();
    }
  }

  const updated = await teamLeaderRepository.updateLeader(id, tenantId, data);
  logger.info(`Team Leader Profile Updated: ID=${id} | Tenant=${tenantId}`);
  return updated;
};

/**
 * Soft deletes team leader.
 */
const deleteTeamLeader = async (id, tenantId, userRole) => {
  enforceManagementRole(userRole);

  const leader = await teamLeaderRepository.findLeaderById(id, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  await withTransaction(async (transactionClient) => {
    await teamLeaderRepository.softDeleteLeader(id, tenantId, transactionClient);
  });
  logger.info(`Team Leader soft deleted: ID=${id} | Tenant=${tenantId}`);
  return true;
};

/**
 * Assigns developers to a team leader's team.
 */
const assignDevelopers = async (teamLeaderId, developerIds, tenantId, userRole) => {
  enforceManagementRole(userRole);

  const leader = await teamLeaderRepository.findLeaderById(teamLeaderId, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  const team = await teamRepository.findTeamById(leader.team_id, tenantId);
  if (!team) {
    throw new TeamNotFoundError('Assigned team not found or deleted');
  }

  // Validate developers
  for (const devId of developerIds) {
    const developer = await teamLeaderRepository.getDeveloperById(devId, tenantId);
    if (!developer || developer.deleted_at !== null) {
      throw new DeveloperNotFoundError(`Developer with ID ${devId} not found`);
    }

    if (developer.tenant_id !== tenantId) {
      throw new ForbiddenError(`Developer ${devId} cross-tenant violation`);
    }

    // Branch isolation constraint: Developer's branch must match target team's branch
    if (developer.branch_id !== team.branch_id) {
      throw new BranchMismatchError(`Developer ${developer.employee_id || devId} branch does not match the target team branch`);
    }
  }

  // Perform updates
  const assigned = await teamLeaderRepository.assignDevelopersToTeam(leader.team_id, developerIds, tenantId);
  logger.info(`Developers assigned: Leader=${teamLeaderId} | Team=${leader.team_id} | DevelopersCount=${assigned.length}`);
  
  // Return the updated list of developers
  return teamLeaderRepository.getDevelopersByTeam(leader.team_id, tenantId);
};

/**
 * Gets developers assigned to a team leader.
 */
const getDevelopersForLeader = async (teamLeaderId, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);

  const leader = await teamLeaderRepository.findLeaderById(teamLeaderId, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  if (userRole === ROLES.TEAM_LEADER && leader.user_id !== userId) {
    throw new ForbiddenError('Access Denied: You cannot view this team');
  }

  return teamLeaderRepository.getDevelopersByTeam(leader.team_id, tenantId);
};

/**
 * Gets team performance stats.
 */
const getTeamPerformance = async (teamLeaderId, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);

  const leader = await teamLeaderRepository.findLeaderById(teamLeaderId, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  if (userRole === ROLES.TEAM_LEADER && leader.user_id !== userId) {
    throw new ForbiddenError('Access Denied: You cannot view this team');
  }

  const metrics = await teamLeaderRepository.getTeamTaskMetrics(leader.team_id, tenantId);
  const developersList = await teamLeaderRepository.getDevelopersByTeam(leader.team_id, tenantId);

  const developerCount = developersList.length;
  const completedTasks = parseInt(metrics.completed_tasks || 0, 10);
  const pendingTasks = parseInt(metrics.pending_tasks || 0, 10);
  const totalTasks = completedTasks + pendingTasks;

  // Calculate average performance
  const avgPerformance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : leader.performance_score;

  // Determine health string
  let teamHealth = 'Good';
  if (avgPerformance >= 90 && pendingTasks <= 5) {
    teamHealth = 'Excellent';
  } else if (avgPerformance < 75 || pendingTasks > 12) {
    teamHealth = 'Needs Improvement';
  } else if (avgPerformance < 85 || pendingTasks > 8) {
    teamHealth = 'Fair';
  }

  return {
    developer_count: developerCount,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    performance_score: leader.performance_score,
    average_performance: avgPerformance,
    team_health: teamHealth
  };
};

/**
 * Gets dashboard stats for a team leader.
 */
const getTeamDashboardStats = async (teamLeaderId, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);

  const leader = await teamLeaderRepository.findLeaderById(teamLeaderId, tenantId);
  if (!leader) {
    throw new TeamLeaderNotFoundError();
  }

  // findLeaderById uses scopeHelper which automatically filters by branch for Branch Managers
  // and by team for Team Leaders. So if we got this far, the user is authorized.

  return teamLeaderRepository.getTeamDashboardStats(leader.team_id, tenantId);
};

/**
 * Gets system-wide team statistics.
 */
const getTeamStats = async (tenantId, userRole) => {
  enforceManagementRole(userRole);

  const stats = await teamRepository.getTeamStatistics(tenantId);
  const branchCounts = await teamRepository.getBranchWiseCount(tenantId);
  const deptCounts = await teamRepository.getDepartmentWiseCount(tenantId);

  return {
    total_teams: parseInt(stats.total_teams || 0, 10),
    total_team_leaders: parseInt(stats.total_team_leaders || 0, 10),
    total_developers: parseInt(stats.total_developers || 0, 10),
    average_performance: parseFloat(stats.average_performance || 0).toFixed(1),
    branch_wise_teams: branchCounts,
    department_wise_teams: deptCounts
  };
};

module.exports = {
  createTeamWithLeader,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  createTeamLeaderOnly,
  getTeamLeaders,
  getTeamLeaderById,
  updateTeamLeader,
  deleteTeamLeader,
  assignDevelopers,
  getDevelopersForLeader,
  getTeamPerformance,
  getTeamStats,
  getTeamDashboardStats
};
