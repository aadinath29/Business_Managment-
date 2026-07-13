const jwtHelper = require('../utils/jwtHelper');
const authRepository = require('../repositories/authRepository');
const db = require('../../database');
const requestContext = require('../../utils/requestContext');
const {
  TokenMissingError,
  UnauthorizedError,
  ForbiddenError,
  InactiveUserError,
  InvalidSessionError,
  TenantMismatchError,
  DeletedUserError
} = require('../errors/authErrors');

/**
 * Authentication Middleware: Validates access token and session state.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookies if present
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new TokenMissingError('No authentication token provided');
    }

    // 3. Verify signature and expiry (throws TokenExpired/TokenInvalid on failure)
    const decoded = jwtHelper.verifyAccessToken(token);
    const { user_id, tenant_id, role, session_id } = decoded;

    // 4. Verify session still exists in the database
    const session = await authRepository.findSession(session_id);
    if (!session) {
      throw new InvalidSessionError('Your login session has expired or has been revoked');
    }

    // 5. Look up the user to ensure status is active
    const user = await authRepository.findUserById(user_id);
    if (!user) {
      throw new DeletedUserError('Your account has been deleted');
    }
    if (user.status !== 'Active') {
      throw new InactiveUserError('Your account is currently inactive');
    }

    // 6. Verify tenant matches token claim
    if (user.tenant_id !== tenant_id) {
      throw new TenantMismatchError('Tenant context mismatch');
    }

    // 7. Attach session information to the request
    req.user = {
      user_id,
      tenant_id,
      role,
      session_id
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * RBAC Authorization Middleware: Limits route to specified roles.
 * @param {...string} allowedRoles 
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User context not found. Authenticate first.');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('You do not have access to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Tenant Isolation Guard: Ensures tenant request parameter matches user context.
 * Also resolves branch/team scope and initializes AsyncLocalStorage context.
 */
const tenantGuard = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User context not found. Authenticate first.');
    }

    // Bind authenticated tenant context to request for easy access
    req.tenantId = req.user.tenant_id;

    // Check request params/body/query for cross-tenant attempts
    const paramTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

    if (paramTenantId && paramTenantId !== req.user.tenant_id) {
      throw new TenantMismatchError('Cross-tenant data access is strictly forbidden');
    }

    // Resolve hierarchical scope
    const { user_id, tenant_id, role } = req.user;
    let branchId = null;
    let teamId = null;

    if (role === 'ADMIN') {
      const { rows } = await db.query(
        'SELECT id FROM branches WHERE manager_id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
        [user_id, tenant_id]
      );
      if (rows.length > 0) branchId = rows[0].id;
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

    req.user.scope = { branchId, teamId };

    // Run the rest of the request within this context
    requestContext.run(req.user, () => {
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  tenantGuard
};
