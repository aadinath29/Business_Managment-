-- Rollback DDL for Phase 7E (Lead Assignment & Projects)

ALTER TABLE lead_assignments DROP COLUMN IF EXISTS assignment_type;
ALTER TABLE lead_assignments DROP COLUMN IF EXISTS is_current;

ALTER TABLE projects DROP COLUMN IF EXISTS team_id;
ALTER TABLE projects DROP COLUMN IF EXISTS developer_id;
ALTER TABLE projects DROP COLUMN IF EXISTS remarks;
