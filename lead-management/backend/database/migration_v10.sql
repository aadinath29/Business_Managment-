-- Migration v10
-- Add branch_quarterly_targets table

CREATE TABLE IF NOT EXISTS branch_quarterly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    q1_target NUMERIC DEFAULT 0,
    q2_target NUMERIC DEFAULT 0,
    q3_target NUMERIC DEFAULT 0,
    q4_target NUMERIC DEFAULT 0,
    q1_achieved NUMERIC DEFAULT NULL,
    q2_achieved NUMERIC DEFAULT NULL,
    q3_achieved NUMERIC DEFAULT NULL,
    q4_achieved NUMERIC DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, branch_id, financial_year)
);

CREATE INDEX idx_branch_quarterly_targets_tenant_branch ON branch_quarterly_targets(tenant_id, branch_id);
