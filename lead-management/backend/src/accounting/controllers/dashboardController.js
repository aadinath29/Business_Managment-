const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

const getAccountingDashboard = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const params = [tenantId];
    
    // Get RBAC scope condition
    const scopeCondition = scopeHelper.getScopeCondition(params, 'l', { 
      branchColumn: 'branch_id', 
      teamColumn: 'team_id', 
      developerColumn: 'assigned_sales_user_id' 
    });

    const branchId = req.query.branchId;
    let branchCondition = '';
    if (branchId) {
      params.push(branchId);
      branchCondition = `AND l.branch_id = $${params.length}`;
    }

    const query = `
      SELECT
          l.id,
          l.name,
          b.branch_name AS "branchName",
          l.branch_id AS "branchId",
          COALESCE(p.total_amount, 0) AS "totalAmount",
          COALESCE(i.total_outstanding_balance, 0) AS "remainingAmount",
          p.latest_due_date AS "dueDate"
      FROM leads l
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN (
          SELECT
              lead_id,
              SUM(grand_total) AS total_amount,
              (ARRAY_AGG(due_date ORDER BY proforma_date DESC, created_at DESC))[1] AS latest_due_date
          FROM accounting_proformas
          WHERE tenant_id = $1
          GROUP BY lead_id
      ) p ON l.id = p.lead_id
      LEFT JOIN (
          SELECT
              lead_id,
              SUM(balance_due) AS total_outstanding_balance
          FROM accounting_invoices
          WHERE tenant_id = $1
          GROUP BY lead_id
      ) i ON l.id = i.lead_id
      WHERE l.tenant_id = $1 
      AND l.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)
      ${scopeCondition}
      ${branchCondition}
      ORDER BY l.created_at DESC
    `;

    const result = await db.query(query, params);

    // Map status directly from the query results for the API response.
    // Business Rule: If Total Outstanding Balance == 0 -> Status = Paid, Else -> Unpaid
    const formattedData = result.rows.map(row => {
      // Remaining amount is total_outstanding_balance from invoices. 
      // If the remaining amount is 0, status is Paid, else Unpaid.
      const remainingAmount = Number(row.remainingAmount) || 0;
      const status = remainingAmount === 0 ? 'Paid' : 'Unpaid';
      
      return {
        id: row.id,
        name: row.name,
        branchName: row.branchName,
        totalAmount: Number(row.totalAmount),
        remainingAmount: remainingAmount,
        dueDate: row.dueDate || '-',
        status: status,
        branchId: row.branchId
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccountingDashboard
};
