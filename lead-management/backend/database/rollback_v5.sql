-- Rollback V5 -> V4

DROP INDEX IF EXISTS idx_lead_requirements_assigned_dev;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS assigned_developer_id;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS assigned_team;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS website VARCHAR(255);
