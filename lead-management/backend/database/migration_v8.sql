-- ==============================================================================
-- Enterprise Lead Management CRM - Accounting Module Database Schema
-- Migration File: Accounting Module (Dedicated Tables Approach)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. ENUMS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
        CREATE TYPE public.quotation_status AS ENUM ('Draft', 'Sent', 'In Negotiation', 'Accepted', 'Rejected', 'Expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proforma_status') THEN
        CREATE TYPE public.proforma_status AS ENUM ('Unpaid', 'Partially Paid', 'Paid', 'Expired', 'Cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        CREATE TYPE public.invoice_type AS ENUM ('GST Invoice', 'Export Invoice', 'SEZ Invoice');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_mode') THEN
        CREATE TYPE public.payment_mode AS ENUM ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card');
    END IF;
END$$;

-- ------------------------------------------------------------------------------
-- 3. TABLES
-- ------------------------------------------------------------------------------

-- 3.1 Quotations Table
CREATE TABLE public.accounting_quotations (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    parent_quotation_id uuid,
    is_latest_revision boolean DEFAULT true NOT NULL,
    quotation_number character varying(100) NOT NULL,
    quotation_date date NOT NULL,
    validity_days integer DEFAULT 30 NOT NULL CHECK (validity_days >= 0),
    subtotal numeric(15,2) DEFAULT 0 NOT NULL CHECK (subtotal >= 0),
    tax_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (tax_total >= 0),
    discount_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (discount_total >= 0),
    grand_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (grand_total >= 0),
    status public.quotation_status DEFAULT 'Draft' NOT NULL,
    notes text,
    document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_aq_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
    CONSTRAINT fk_aq_parent FOREIGN KEY (parent_quotation_id) REFERENCES public.accounting_quotations(id) ON DELETE CASCADE
);

-- 3.2 Quotation Items Table
CREATE TABLE public.quotation_items (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    quotation_id uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    hsn_sac character varying(50),
    quantity numeric(10,2) DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit character varying(20) DEFAULT 'Nos' NOT NULL,
    rate numeric(15,2) NOT NULL CHECK (rate >= 0),
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage numeric(5,2) DEFAULT 18 NOT NULL CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_qi_quotation FOREIGN KEY (quotation_id) REFERENCES public.accounting_quotations(id) ON DELETE CASCADE
);

-- 3.3 Proforma Invoices Table
CREATE TABLE public.accounting_proformas (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    quotation_id uuid,
    proforma_number character varying(100) NOT NULL,
    proforma_date date NOT NULL,
    due_date date,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL CHECK (subtotal >= 0),
    tax_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (tax_total >= 0),
    grand_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (grand_total >= 0),
    status public.proforma_status DEFAULT 'Unpaid' NOT NULL,
    notes text,
    document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_ap_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ap_quotation FOREIGN KEY (quotation_id) REFERENCES public.accounting_quotations(id) ON DELETE SET NULL,
    CONSTRAINT chk_ap_dates CHECK (due_date IS NULL OR due_date >= proforma_date)
);

-- 3.4 Proforma Items Table
CREATE TABLE public.proforma_items (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    proforma_id uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    hsn_sac character varying(50),
    quantity numeric(10,2) DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit character varying(20) DEFAULT 'Nos' NOT NULL,
    rate numeric(15,2) NOT NULL CHECK (rate >= 0),
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage numeric(5,2) DEFAULT 18 NOT NULL CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_pi_proforma FOREIGN KEY (proforma_id) REFERENCES public.accounting_proformas(id) ON DELETE CASCADE
);

-- 3.5 Tax Invoices Table
CREATE TABLE public.accounting_invoices (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    proforma_id uuid,
    invoice_number character varying(100) NOT NULL,
    invoice_date date NOT NULL,
    due_date date,
    invoice_type public.invoice_type DEFAULT 'GST Invoice' NOT NULL,
    place_of_supply character varying(100),
    currency character varying(10) DEFAULT 'INR' NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL CHECK (subtotal >= 0),
    tax_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (tax_total >= 0),
    grand_total numeric(15,2) DEFAULT 0 NOT NULL CHECK (grand_total >= 0),
    amount_paid numeric(15,2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
    balance_due numeric(15,2) DEFAULT 0 NOT NULL CHECK (balance_due >= 0),
    status public.invoice_status DEFAULT 'Pending' NOT NULL,
    document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_ai_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_proforma FOREIGN KEY (proforma_id) REFERENCES public.accounting_proformas(id) ON DELETE SET NULL,
    CONSTRAINT chk_ai_dates CHECK (due_date IS NULL OR due_date >= invoice_date),
    CONSTRAINT chk_ai_balance CHECK (balance_due <= grand_total)
);

-- 3.6 Invoice Items Table
CREATE TABLE public.invoice_items (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    invoice_id uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    hsn_sac character varying(50),
    quantity numeric(10,2) DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit character varying(20) DEFAULT 'Nos' NOT NULL,
    rate numeric(15,2) NOT NULL CHECK (rate >= 0),
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage numeric(5,2) DEFAULT 18 NOT NULL CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES public.accounting_invoices(id) ON DELETE CASCADE
);

-- 3.7 Payment Ledger Table
CREATE TABLE public.accounting_payments (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    payment_date date NOT NULL,
    payment_mode public.payment_mode NOT NULL,
    transaction_number character varying(100),
    amount_received numeric(15,2) NOT NULL CHECK (amount_received > 0),
    bank_name character varying(255),
    received_by character varying(255),
    document_url text,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_ap_invoice FOREIGN KEY (invoice_id) REFERENCES public.accounting_invoices(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 4. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_aq_tenant_lead ON public.accounting_quotations(tenant_id, lead_id);
CREATE INDEX idx_aq_parent ON public.accounting_quotations(parent_quotation_id);
CREATE INDEX idx_aq_number ON public.accounting_quotations(tenant_id, quotation_number);
CREATE INDEX idx_qi_quotation ON public.quotation_items(quotation_id);

CREATE INDEX idx_ap_tenant_lead ON public.accounting_proformas(tenant_id, lead_id);
CREATE INDEX idx_ap_quotation ON public.accounting_proformas(quotation_id);
CREATE INDEX idx_ap_number ON public.accounting_proformas(tenant_id, proforma_number);
CREATE INDEX idx_pi_proforma ON public.proforma_items(proforma_id);

CREATE INDEX idx_ai_tenant_lead ON public.accounting_invoices(tenant_id, lead_id);
CREATE INDEX idx_ai_proforma ON public.accounting_invoices(proforma_id);
CREATE INDEX idx_ai_number ON public.accounting_invoices(tenant_id, invoice_number);
CREATE INDEX idx_ii_invoice ON public.invoice_items(invoice_id);

CREATE INDEX idx_apymt_tenant_invoice ON public.accounting_payments(tenant_id, invoice_id);
CREATE INDEX idx_apymt_date ON public.accounting_payments(payment_date);

-- ------------------------------------------------------------------------------
-- 5. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- 5.1 Updated_At Trigger Function
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_aq_updated_at BEFORE UPDATE ON public.accounting_quotations
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trg_ap_updated_at BEFORE UPDATE ON public.accounting_proformas
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trg_ai_updated_at BEFORE UPDATE ON public.accounting_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trg_apymt_updated_at BEFORE UPDATE ON public.accounting_payments
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


-- 5.2 Enforce Single Latest Revision
CREATE OR REPLACE FUNCTION public.enforce_single_latest_revision()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_latest_revision = true THEN
        IF NEW.parent_quotation_id IS NOT NULL THEN
            UPDATE public.accounting_quotations 
            SET is_latest_revision = false 
            WHERE (id = NEW.parent_quotation_id OR parent_quotation_id = NEW.parent_quotation_id)
              AND id != NEW.id;
        ELSE
            UPDATE public.accounting_quotations 
            SET is_latest_revision = false 
            WHERE parent_quotation_id = NEW.id
              AND id != NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_latest_revision
AFTER INSERT OR UPDATE OF is_latest_revision ON public.accounting_quotations
FOR EACH ROW WHEN (NEW.is_latest_revision = true)
EXECUTE FUNCTION public.enforce_single_latest_revision();


-- 5.3 Recalculate Quotation Totals
CREATE OR REPLACE FUNCTION public.recalculate_quotation_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_quotation_id uuid;
    v_subtotal numeric(15,2);
    v_tax numeric(15,2);
    v_discount numeric(15,2);
    v_grand numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_quotation_id := OLD.quotation_id;
    ELSE
        v_quotation_id := NEW.quotation_id;
    END IF;

    SELECT 
        COALESCE(SUM(quantity * rate), 0),
        COALESCE(SUM((quantity * rate * (1 - discount_percentage / 100)) * (tax_percentage / 100)), 0),
        COALESCE(SUM(quantity * rate * (discount_percentage / 100)), 0),
        COALESCE(SUM((quantity * rate * (1 - discount_percentage / 100)) * (1 + tax_percentage / 100)), 0)
    INTO v_subtotal, v_tax, v_discount, v_grand
    FROM public.quotation_items
    WHERE quotation_id = v_quotation_id;

    UPDATE public.accounting_quotations
    SET subtotal = v_subtotal,
        tax_total = v_tax,
        discount_total = v_discount,
        grand_total = v_grand
    WHERE id = v_quotation_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_quotation
AFTER INSERT OR UPDATE OR DELETE ON public.quotation_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_quotation_totals();


-- 5.4 Recalculate Proforma Totals
CREATE OR REPLACE FUNCTION public.recalculate_proforma_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_proforma_id uuid;
    v_subtotal numeric(15,2);
    v_tax numeric(15,2);
    v_grand numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_proforma_id := OLD.proforma_id;
    ELSE
        v_proforma_id := NEW.proforma_id;
    END IF;

    SELECT 
        COALESCE(SUM(quantity * rate * (1 - discount_percentage / 100)), 0),
        COALESCE(SUM((quantity * rate * (1 - discount_percentage / 100)) * (tax_percentage / 100)), 0),
        COALESCE(SUM((quantity * rate * (1 - discount_percentage / 100)) * (1 + tax_percentage / 100)), 0)
    INTO v_subtotal, v_tax, v_grand
    FROM public.proforma_items
    WHERE proforma_id = v_proforma_id;

    UPDATE public.accounting_proformas
    SET subtotal = v_subtotal,
        tax_total = v_tax,
        grand_total = v_grand
    WHERE id = v_proforma_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_proforma
AFTER INSERT OR UPDATE OR DELETE ON public.proforma_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_proforma_totals();


-- 5.5 Recalculate Invoice Totals
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_subtotal numeric(15,2);
    v_tax numeric(15,2);
    v_grand numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT 
        COALESCE(SUM(quantity * rate * (1 - discount_percentage / 100)), 0),
        COALESCE(SUM((quantity * rate * (1 - discount_percentage / 100)) * (tax_percentage / 100)), 0),
        COALESCE(SUM((quantity * rate * (1 - discount_percentage / 100)) * (1 + tax_percentage / 100)), 0)
    INTO v_subtotal, v_tax, v_grand
    FROM public.invoice_items
    WHERE invoice_id = v_invoice_id;

    UPDATE public.accounting_invoices
    SET subtotal = v_subtotal,
        tax_total = v_tax,
        grand_total = v_grand,
        balance_due = GREATEST(0, v_grand - amount_paid)
    WHERE id = v_invoice_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_invoice
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();


-- 5.6 Sync Ledger & Invoice Status
CREATE OR REPLACE FUNCTION public.sync_invoice_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_total_paid numeric(15,2);
    v_grand_total numeric(15,2);
    v_new_status public.invoice_status;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT COALESCE(SUM(amount_received), 0) INTO v_total_paid
    FROM public.accounting_payments
    WHERE invoice_id = v_invoice_id;

    SELECT grand_total INTO v_grand_total
    FROM public.accounting_invoices
    WHERE id = v_invoice_id;
    
    IF v_total_paid >= v_grand_total AND v_grand_total > 0 THEN
        v_new_status := 'Paid';
    ELSIF v_total_paid > 0 THEN
        v_new_status := 'Partially Paid';
    ELSE
        v_new_status := 'Pending';
    END IF;

    UPDATE public.accounting_invoices
    SET amount_paid = LEAST(v_total_paid, v_grand_total),
        balance_due = GREATEST(0, v_grand_total - v_total_paid),
        status = v_new_status
    WHERE id = v_invoice_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_invoice_ledger
AFTER INSERT OR UPDATE OR DELETE ON public.accounting_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_ledger();


-- 5.7 Invoice Immutability Check
CREATE OR REPLACE FUNCTION public.prevent_invoice_item_modification()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_status public.invoice_status;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT status INTO v_invoice_status FROM public.accounting_invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT status INTO v_invoice_status FROM public.accounting_invoices WHERE id = NEW.invoice_id;
    END IF;

    IF v_invoice_status IN ('Paid', 'Partially Paid') THEN
        RAISE EXCEPTION 'Cannot modify invoice items after payments have been recorded. Status: %', v_invoice_status;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_invoice_item_mod
BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.prevent_invoice_item_modification();

-- ------------------------------------------------------------------------------
-- 7. COMMENTS
-- ------------------------------------------------------------------------------
COMMENT ON TABLE public.accounting_quotations IS 'Stores the parent quotations and revision chain tracking.';
COMMENT ON COLUMN public.accounting_quotations.is_latest_revision IS 'Identifies the currently active/approved revision in a chain.';
COMMENT ON TABLE public.accounting_invoices IS 'Tax Invoices that require strict financial integrity and ledger tracking.';
COMMENT ON COLUMN public.accounting_invoices.amount_paid IS 'Automatically synced from accounting_payments table.';
COMMENT ON COLUMN public.accounting_invoices.balance_due IS 'Automatically calculated (grand_total - amount_paid).';
COMMENT ON TABLE public.accounting_payments IS 'Payment Ledger mapping payments to a specific Tax Invoice.';

-- ==============================================================================
-- End of Accounting Module Migration
-- ==============================================================================
