const requestContext = require('../../utils/requestContext');
const db = require('../../database');

/**
 * Middleware that identifies the user's scope (branch_id, team_id) based on their role
 * and injects it into AsyncLocalStorage for downstream repository use.
 */
const scopeGuard = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // Skip if not authenticated
    }

    const { user_id, tenant_id, role } = req.user;
    let branchId = null;
    let teamId = null;

    if (role === 'ADMIN') {
      const { rows } = await db.query(
        'SELECT id FROM branches WHERE manager_id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
        [user_id, tenant_id]
      );
      if (rows.length > 0) {
        branchId = rows[0].id;
      }
    } else if (role === 'TEAM_LEADER') {
      const { rows } = await db.query(
        'SELECT t.id as team_id, t.branch_id FROM team_leaders tl JOIN teams t ON tl.team_id = t.id WHERE tl.user_id = $1 AND tl.tenant_id = $2 AND t.deleted_at IS NULL',
        [user_id, tenant_id]
      );
      if (rows.length > 0) {
        teamId = rows[0].team_id;
        branchId = rows[0].branch_id;
      }
    } else if (role === 'DEVELOPER') {
      const { rows } = await db.query(
        'SELECT t.id as team_id, t.branch_id FROM developers d JOIN teams t ON d.team_id = t.id WHERE d.user_id = $1 AND d.tenant_id = $2 AND t.deleted_at IS NULL',
        [user_id, tenant_id]
      );
      if (rows.length > 0) {
        teamId = rows[0].team_id;
        branchId = rows[0].branch_id;
      }
    }

    req.user.scope = {
      branchId,
      teamId
    };

    // Run the rest of the request within this context
    requestContext.run(req.user, () => {
      next();
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  scopeGuard
};
