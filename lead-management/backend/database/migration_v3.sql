-- Additive schema changes for Phase 7D (Requirements & Proposals)
-- Project: CRM Lead Management SaaS

-- 1. Add missing requirement columns
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE lead_requirements ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. Add missing proposal columns
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
