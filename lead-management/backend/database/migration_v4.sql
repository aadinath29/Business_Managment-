-- Additive DDL changes for Phase 7E (Lead Assignment & Projects)
-- Project: CRM Lead Management SaaS

-- 1. Add missing assignment columns to lead_assignments
ALTER TABLE lead_assignments ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50) DEFAULT 'Developer';
ALTER TABLE lead_assignments ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- 2. Add missing project columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS remarks TEXT;
