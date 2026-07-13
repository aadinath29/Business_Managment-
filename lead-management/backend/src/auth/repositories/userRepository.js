const db = require('../../database');

/**
 * Creates a new manager user inside the database.
 * @param {string} tenantId 
 * @param {string} roleId 
 * @param {object} data - { email, password_hash, first_name, last_name, phone }
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<object>} The newly created user record
 */
const createManagerUser = async (tenantId, roleId, data, client = db) => {
  const queryText = `
    INSERT INTO users (tenant_id, role_id, email, password_hash, first_name, last_name, phone, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
    RETURNING *
  `;
  const params = [
    tenantId,
    roleId,
    data.email,
    data.password_hash,
    data.first_name,
    data.last_name,
    data.phone || null
  ];
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Checks if a user email address is already active under the given tenant scope.
 * @param {string} tenantId 
 * @param {string} email 
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<boolean>} True if email exists, otherwise false
 */
const checkUserEmailExists = async (tenantId, email, client = db) => {
  const queryText = `
    SELECT id FROM users
    WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND deleted_at IS NULL
  `;
  const { rows } = await client.query(queryText, [tenantId, email]);
  return rows.length > 0;
};

/**
 * Retrieves the UUID role ID for a given role name.
 * @param {string} roleName - e.g., 'ADMIN'
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<string|null>} Role UUID or null if not found
 */
const findRoleIdByName = async (roleName, client = db) => {
  const queryText = `
    SELECT id FROM roles WHERE name = $1
  `;
  const { rows } = await client.query(queryText, [roleName]);
  return rows.length ? rows[0].id : null;
};

/**
 * Soft deletes a user by ID.
 * @param {string} id 
 * @param {string} tenantId 
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<boolean>}
 */
const softDeleteUser = async (id, tenantId, client = db) => {
  const queryText = `
    UPDATE users
    SET deleted_at = NOW(), updated_at = NOW(), status = 'Inactive'
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length > 0;
};

module.exports = {
  createManagerUser,
  checkUserEmailExists,
  findRoleIdByName,
  softDeleteUser
};
