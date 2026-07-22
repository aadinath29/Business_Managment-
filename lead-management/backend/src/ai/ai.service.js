const db = require('../database');

/**
 * Searches the leads table based on provided filters.
 * @param {string} priority - The priority of the lead (e.g. 'high', 'medium', 'low')
 * @param {string} status - The status of the lead (e.g. 'new', 'contacted', 'qualified')
 * @param {string} keyword - A keyword to search across name and company
 * @returns {Promise<Array>} List of leads
 */
const searchLeads = async (priority, status, keyword) => {
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (priority) {
    query += ` AND LOWER(priority::text) = LOWER($${paramIndex})`;
    params.push(priority);
    paramIndex++;
  }

  if (status) {
    query += ` AND LOWER(status::text) = LOWER($${paramIndex})`;
    params.push(status);
    paramIndex++;
  }

  if (keyword) {
    query += ` AND (
      name ILIKE $${paramIndex} 
      OR company_name ILIKE $${paramIndex}
      OR email ILIKE $${paramIndex}
    )`;
    params.push(`%${keyword}%`);
    paramIndex++;
  }
  
  query += ' LIMIT 10'; // Keep it small for the AI context

  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in searchLeads function call:', error);
    throw new Error('Failed to fetch leads from database.');
  }
};

module.exports = {
  searchLeads
};
