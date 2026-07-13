-- Rollback DDL for Phase 7D (Requirements & Proposals)

ALTER TABLE lead_requirements DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS approved;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS approved_by;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS approved_date;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS updated_by;
ALTER TABLE lead_requirements DROP COLUMN IF EXISTS remarks;

ALTER TABLE proposals DROP COLUMN IF EXISTS created_by;
ALTER TABLE proposals DROP COLUMN IF EXISTS updated_by;
