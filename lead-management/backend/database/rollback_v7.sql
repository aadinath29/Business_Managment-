-- Rollback V7 -> V6

ALTER TABLE projects DROP COLUMN IF EXISTS priority;
ALTER TABLE projects DROP COLUMN IF EXISTS risk_level;
ALTER TABLE projects DROP COLUMN IF EXISTS current_sprint;
ALTER TABLE projects DROP COLUMN IF EXISTS expected_hours;
