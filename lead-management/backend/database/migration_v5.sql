-- Migration Schema V4 -> V5 DDL
-- Project: CRM Lead Management SaaS
-- 1. Requirements can be assigned to a developer (FK is SET NULL on developer removal — no orphans)
-- 2. Website field removed from leads (dropped from UI + backend)

ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS assigned_developer_id UUID REFERENCES developers(id) ON DELETE SET NULL;
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS assigned_team VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_lead_requirements_assigned_dev ON lead_requirements(assigned_developer_id);

ALTER TABLE leads DROP COLUMN IF EXISTS website;
