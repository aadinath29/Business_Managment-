-- Migration Schema V1 -> Schema V2 DDL
-- Project: CRM Lead Management SaaS
-- Additive & Backward Compatible Changes Only

-- ==========================================
-- 1. COLUMN EXTENSIONS ON EXISTING TABLES
-- ==========================================

-- Extend leads table
ALTER TABLE leads ADD COLUMN assigned_sales_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Extend notifications table
ALTER TABLE notifications ADD COLUMN entity_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN entity_id UUID;
ALTER TABLE notifications ADD COLUMN action_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN redirect_url TEXT;

-- Extend audit_logs table
ALTER TABLE audit_logs ADD COLUMN old_value JSONB;
ALTER TABLE audit_logs ADD COLUMN new_value JSONB;

-- Extend login_sessions table
ALTER TABLE login_sessions ADD COLUMN refresh_token_id UUID;
ALTER TABLE login_sessions ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE login_sessions ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- 2. NEW ENTITIES (TABLES)
-- ==========================================

-- Lead Journey table
CREATE TABLE lead_journey (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    entered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Status History table
CREATE TABLE lead_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    old_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

-- Lead Assignment History table
CREATE TABLE lead_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Follow Ups table
CREATE TABLE lead_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    communication_type VARCHAR(100),
    reminder_notes TEXT,
    outcome TEXT,
    followup_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Activities (Single Timeline Source) table
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Requirements table
CREATE TABLE lead_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    complexity VARCHAR(50) DEFAULT 'Medium',
    approval_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Deliveries table
CREATE TABLE lead_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    go_live_date DATE,
    uat_status VARCHAR(50) DEFAULT 'Pending',
    documentation_status VARCHAR(50) DEFAULT 'Pending',
    acceptance_status VARCHAR(50) DEFAULT 'Pending',
    handover_completed BOOLEAN DEFAULT FALSE,
    deployment_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Success table
CREATE TABLE customer_success (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    support_status VARCHAR(50) DEFAULT 'Pending',
    amc_details TEXT,
    renewal_date DATE,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    nps INTEGER,
    feedback TEXT,
    upsell_opportunity BOOLEAN DEFAULT FALSE,
    renewal_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attachments (One generic file table)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Tags table
CREATE TABLE lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, tag_name)
);

-- Lead Tag Mapping junction table
CREATE TABLE lead_tag_mapping (
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lead_id, tag_id)
);

-- Custom Fields table
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, entity_type, field_name)
);

-- Custom Field Values table
CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (custom_field_id, entity_id)
);

-- Task Dependencies table
CREATE TABLE task_dependencies (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish-to-start',
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- Task Checklists table
CREATE TABLE task_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    item_text VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Labels table
CREATE TABLE task_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    label_name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, label_name)
);

-- Task Label Mapping junction table
CREATE TABLE task_label_mapping (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- ==========================================
-- 3. REPORTING INDEXES
-- ==========================================

-- Index for status, priority, and created_at on leads
CREATE INDEX IF NOT EXISTS idx_leads_reporting_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_reporting_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_reporting_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_sales_user ON leads(assigned_sales_user_id);

-- Index for lead follow-ups
CREATE INDEX IF NOT EXISTS idx_lead_followups_date ON lead_followups(followup_date);

-- Index for lead activities
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at DESC);

-- Index for lead status history
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed ON lead_status_history(changed_at DESC);

-- ==========================================
-- 4. TRIGGERS (Auto Update 'updated_at')
-- ==========================================

CREATE TRIGGER update_lead_journey_modtime BEFORE UPDATE ON lead_journey FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_lead_followups_modtime BEFORE UPDATE ON lead_followups FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_lead_requirements_modtime BEFORE UPDATE ON lead_requirements FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_lead_deliveries_modtime BEFORE UPDATE ON lead_deliveries FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_customer_success_modtime BEFORE UPDATE ON customer_success FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_custom_fields_modtime BEFORE UPDATE ON custom_fields FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_custom_field_values_modtime BEFORE UPDATE ON custom_field_values FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_task_checklists_modtime BEFORE UPDATE ON task_checklists FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
