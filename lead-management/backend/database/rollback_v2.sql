-- Rollback Schema V2 -> Schema V1 DDL
-- Project: CRM Lead Management SaaS

-- ==========================================
-- 1. DROP TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS update_lead_journey_modtime ON lead_journey;
DROP TRIGGER IF EXISTS update_lead_followups_modtime ON lead_followups;
DROP TRIGGER IF EXISTS update_lead_requirements_modtime ON lead_requirements;
DROP TRIGGER IF EXISTS update_lead_deliveries_modtime ON lead_deliveries;
DROP TRIGGER IF EXISTS update_customer_success_modtime ON customer_success;
DROP TRIGGER IF EXISTS update_custom_fields_modtime ON custom_fields;
DROP TRIGGER IF EXISTS update_custom_field_values_modtime ON custom_field_values;
DROP TRIGGER IF EXISTS update_task_checklists_modtime ON task_checklists;

-- ==========================================
-- 2. DROP NEW ENTITIES (TABLES)
-- ==========================================
DROP TABLE IF EXISTS task_label_mapping CASCADE;
DROP TABLE IF EXISTS task_labels CASCADE;
DROP TABLE IF EXISTS task_checklists CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS custom_field_values CASCADE;
DROP TABLE IF EXISTS custom_fields CASCADE;
DROP TABLE IF EXISTS lead_tag_mapping CASCADE;
DROP TABLE IF EXISTS lead_tags CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS customer_success CASCADE;
DROP TABLE IF EXISTS lead_deliveries CASCADE;
DROP TABLE IF EXISTS lead_requirements CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS lead_followups CASCADE;
DROP TABLE IF EXISTS lead_assignments CASCADE;
DROP TABLE IF EXISTS lead_status_history CASCADE;
DROP TABLE IF EXISTS lead_journey CASCADE;

-- ==========================================
-- 3. REMOVE COLUMN EXTENSIONS ON EXISTING TABLES
-- ==========================================
ALTER TABLE leads DROP COLUMN IF EXISTS assigned_sales_user_id CASCADE;

ALTER TABLE notifications DROP COLUMN IF EXISTS entity_type CASCADE;
ALTER TABLE notifications DROP COLUMN IF EXISTS entity_id CASCADE;
ALTER TABLE notifications DROP COLUMN IF EXISTS action_type CASCADE;
ALTER TABLE notifications DROP COLUMN IF EXISTS redirect_url CASCADE;

ALTER TABLE audit_logs DROP COLUMN IF EXISTS old_value CASCADE;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS new_value CASCADE;

ALTER TABLE login_sessions DROP COLUMN IF EXISTS refresh_token_id CASCADE;
ALTER TABLE login_sessions DROP COLUMN IF EXISTS revoked_at CASCADE;
ALTER TABLE login_sessions DROP COLUMN IF EXISTS last_used_at CASCADE;
