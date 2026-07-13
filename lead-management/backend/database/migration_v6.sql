-- Migration Schema V5 -> V6 DDL
-- Project: CRM Lead Management SaaS
-- Branch Corporate Details (all optional, backward compatible)

ALTER TABLE branches ADD COLUMN IF NOT EXISTS working_days VARCHAR(20);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'IST (UTC+05:30)';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS gst_number VARCHAR(30);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);
