const requestContext = require('./requestContext');

/**
 * Automatically applies row-level scoping constraints based on the logged-in user's role.
 * Injects branch_id or team_id into the query array and returns the SQL condition.
 * 
 * @param {Array} paramsArray - The query values array (e.g., [tenantId])
 * @param {string} tableAlias - The alias of the table to scope (e.g., 'l' for leads)
 * @param {Object} options - Override column names for specific tables
 * @returns {string} - The SQL snippet to append (e.g., ' AND l.branch_id = $2')
 */
const getScopeCondition = (paramsArray, tableAlias = '', options = {}) => {
  const user = requestContext.getStore();
  const logger = require('../config/logger');
  
  if (!user || !user.scope) {
    logger.warn(`scopeHelper: Missing user or user.scope. user=${JSON.stringify(user)}`);
    return ` AND 1=0 `; // Deny access if context is missing
  }

  const {
    branchColumn = 'branch_id',
    teamColumn = 'team_id',
    developerColumn = null, // e.g. 'assigned_to_id'
  } = options;

  const prefix = tableAlias ? `${tableAlias}.` : '';
  const { role, scope } = user;

  if (role === 'SUPER_ADMIN') {
    return ''; // Unrestricted access
  } 
  
  if (role === 'ADMIN') {
    if (!scope.branchId) return ` AND 1=0 `; // Block unassigned branch managers
    
    if (branchColumn) {
      paramsArray.push(scope.branchId);
      return ` AND ${prefix}${branchColumn} = $${paramsArray.length}`;
    } else {
       return ` AND 1=0 `;
    }
  } 
  
  if (role === 'TEAM_LEADER') {
    if (!scope.teamId) return ` AND 1=0 `; // Block unassigned team leaders
    
    if (teamColumn) {
      paramsArray.push(scope.teamId);
      return ` AND ${prefix}${teamColumn} = $${paramsArray.length}`;
    } else {
       return ` AND 1=0 `;
    }
  }

  if (role === 'DEVELOPER') {
    // Developers only see assigned data unless they are querying something team-scoped where developerColumn is mapped to team_id manually
    if (developerColumn && user.userId) {
       paramsArray.push(user.userId);
       return ` AND ${prefix}${developerColumn} = $${paramsArray.length}`;
    } else if (teamColumn && scope.teamId && options.allowDeveloperTeamScope) {
       // Only if explicitly allowed to see team-wide data (like a list of team members)
       paramsArray.push(scope.teamId);
       return ` AND ${prefix}${teamColumn} = $${paramsArray.length}`;
    }
    return ` AND 1=0 `; 
  }

  logger.warn(`scopeHelper: Default deny hit! role=${role}, options=${JSON.stringify(options)}`);
  return ` AND 1=0 `; // Default deny
};

module.exports = {
  getScopeCondition
};
