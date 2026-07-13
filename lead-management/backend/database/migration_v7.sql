-- Migration Schema V6 -> V7 DDL
-- Project: CRM Lead Management SaaS
-- Project execution tracking fields (Phase 4 Configure Project form)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'Low';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_sprint VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_hours INTEGER;
