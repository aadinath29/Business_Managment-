-- Rollback V6 -> V5

ALTER TABLE branches DROP COLUMN IF EXISTS working_days;
ALTER TABLE branches DROP COLUMN IF EXISTS timezone;
ALTER TABLE branches DROP COLUMN IF EXISTS gst_number;
ALTER TABLE branches DROP COLUMN IF EXISTS pan_number;
