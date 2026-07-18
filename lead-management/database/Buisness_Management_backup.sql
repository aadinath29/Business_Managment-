--
-- PostgreSQL database dump
--

\restrict SPZgYXtZlWzRtLnnRs99gNbHMcODacFyoNwvEP1c5uQ5fESYe1bcmRlWV1l9D0v

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-18 10:53:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 24588)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 5720 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 2 (class 3079 OID 24577)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5721 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 950 (class 1247 OID 24680)
-- Name: branch_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.branch_status AS ENUM (
    'Active',
    'Under Maintenance',
    'Temporarily Closed',
    'Archived'
);


ALTER TYPE public.branch_status OWNER TO postgres;

--
-- TOC entry 965 (class 1247 OID 24738)
-- Name: communication_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.communication_type AS ENUM (
    'Call',
    'Email',
    'Meeting',
    'Message'
);


ALTER TYPE public.communication_type OWNER TO postgres;

--
-- TOC entry 1088 (class 1247 OID 25828)
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoice_status AS ENUM (
    'Pending',
    'Partially Paid',
    'Paid',
    'Overdue',
    'Cancelled'
);


ALTER TYPE public.invoice_status OWNER TO postgres;

--
-- TOC entry 1091 (class 1247 OID 25840)
-- Name: invoice_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoice_type AS ENUM (
    'GST Invoice',
    'Export Invoice',
    'SEZ Invoice'
);


ALTER TYPE public.invoice_type OWNER TO postgres;

--
-- TOC entry 953 (class 1247 OID 24690)
-- Name: lead_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_status AS ENUM (
    'New',
    'Contacted',
    'Qualified',
    'Negotiation',
    'Closed Won',
    'Closed Lost'
);


ALTER TYPE public.lead_status OWNER TO postgres;

--
-- TOC entry 1094 (class 1247 OID 25848)
-- Name: payment_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_mode AS ENUM (
    'Cash',
    'UPI',
    'Bank Transfer',
    'Cheque',
    'Card'
);


ALTER TYPE public.payment_mode OWNER TO postgres;

--
-- TOC entry 956 (class 1247 OID 24704)
-- Name: priority_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.priority_level AS ENUM (
    'Low',
    'Medium',
    'High',
    'Critical'
);


ALTER TYPE public.priority_level OWNER TO postgres;

--
-- TOC entry 1085 (class 1247 OID 25816)
-- Name: proforma_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.proforma_status AS ENUM (
    'Unpaid',
    'Partially Paid',
    'Paid',
    'Expired',
    'Cancelled'
);


ALTER TYPE public.proforma_status OWNER TO postgres;

--
-- TOC entry 962 (class 1247 OID 24726)
-- Name: project_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.project_status AS ENUM (
    'Not Started',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled'
);


ALTER TYPE public.project_status OWNER TO postgres;

--
-- TOC entry 968 (class 1247 OID 24748)
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.proposal_status AS ENUM (
    'Draft',
    'Sent',
    'Negotiation',
    'Approved',
    'Rejected'
);


ALTER TYPE public.proposal_status OWNER TO postgres;

--
-- TOC entry 1082 (class 1247 OID 25803)
-- Name: quotation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.quotation_status AS ENUM (
    'Draft',
    'Sent',
    'In Negotiation',
    'Accepted',
    'Rejected',
    'Expired'
);


ALTER TYPE public.quotation_status OWNER TO postgres;

--
-- TOC entry 947 (class 1247 OID 24670)
-- Name: role_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_type AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'TEAM_LEADER',
    'DEVELOPER'
);


ALTER TYPE public.role_type OWNER TO postgres;

--
-- TOC entry 959 (class 1247 OID 24714)
-- Name: task_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_status AS ENUM (
    'Open',
    'Pending',
    'In Progress',
    'Done',
    'Cancelled'
);


ALTER TYPE public.task_status OWNER TO postgres;

--
-- TOC entry 307 (class 1255 OID 26129)
-- Name: enforce_single_latest_revision(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_single_latest_revision() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.enforce_single_latest_revision() OWNER TO postgres;

--
-- TOC entry 323 (class 1255 OID 26139)
-- Name: prevent_invoice_item_modification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_invoice_item_modification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.prevent_invoice_item_modification() OWNER TO postgres;

--
-- TOC entry 321 (class 1255 OID 26135)
-- Name: recalculate_invoice_totals(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_invoice_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.recalculate_invoice_totals() OWNER TO postgres;

--
-- TOC entry 320 (class 1255 OID 26133)
-- Name: recalculate_proforma_totals(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_proforma_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.recalculate_proforma_totals() OWNER TO postgres;

--
-- TOC entry 319 (class 1255 OID 26131)
-- Name: recalculate_quotation_totals(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_quotation_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.recalculate_quotation_totals() OWNER TO postgres;

--
-- TOC entry 322 (class 1255 OID 26137)
-- Name: sync_invoice_ledger(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_invoice_ledger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.sync_invoice_ledger() OWNER TO postgres;

--
-- TOC entry 306 (class 1255 OID 25298)
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 262 (class 1259 OID 26006)
-- Name: accounting_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    proforma_id uuid,
    invoice_number character varying(100) NOT NULL,
    invoice_date date NOT NULL,
    due_date date,
    invoice_type public.invoice_type DEFAULT 'GST Invoice'::public.invoice_type NOT NULL,
    place_of_supply character varying(100),
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    tax_total numeric(15,2) DEFAULT 0 NOT NULL,
    grand_total numeric(15,2) DEFAULT 0 NOT NULL,
    amount_paid numeric(15,2) DEFAULT 0 NOT NULL,
    balance_due numeric(15,2) DEFAULT 0 NOT NULL,
    status public.invoice_status DEFAULT 'Pending'::public.invoice_status NOT NULL,
    document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT accounting_invoices_amount_paid_check CHECK ((amount_paid >= (0)::numeric)),
    CONSTRAINT accounting_invoices_balance_due_check CHECK ((balance_due >= (0)::numeric)),
    CONSTRAINT accounting_invoices_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT accounting_invoices_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT accounting_invoices_tax_total_check CHECK ((tax_total >= (0)::numeric)),
    CONSTRAINT chk_ai_balance CHECK ((balance_due <= grand_total)),
    CONSTRAINT chk_ai_dates CHECK (((due_date IS NULL) OR (due_date >= invoice_date)))
);


ALTER TABLE public.accounting_invoices OWNER TO postgres;

--
-- TOC entry 5722 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE accounting_invoices; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.accounting_invoices IS 'Tax Invoices that require strict financial integrity and ledger tracking.';


--
-- TOC entry 5723 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN accounting_invoices.amount_paid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_invoices.amount_paid IS 'Automatically synced from accounting_payments table.';


--
-- TOC entry 5724 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN accounting_invoices.balance_due; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_invoices.balance_due IS 'Automatically calculated (grand_total - amount_paid).';


--
-- TOC entry 264 (class 1259 OID 26087)
-- Name: accounting_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    payment_date date NOT NULL,
    payment_mode public.payment_mode NOT NULL,
    transaction_number character varying(100),
    amount_received numeric(15,2) NOT NULL,
    bank_name character varying(255),
    received_by character varying(255),
    document_url text,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT accounting_payments_amount_received_check CHECK ((amount_received > (0)::numeric))
);


ALTER TABLE public.accounting_payments OWNER TO postgres;

--
-- TOC entry 5725 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE accounting_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.accounting_payments IS 'Payment Ledger mapping payments to a specific Tax Invoice.';


--
-- TOC entry 260 (class 1259 OID 25936)
-- Name: accounting_proformas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_proformas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    quotation_id uuid,
    proforma_number character varying(100) NOT NULL,
    proforma_date date NOT NULL,
    due_date date,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    tax_total numeric(15,2) DEFAULT 0 NOT NULL,
    grand_total numeric(15,2) DEFAULT 0 NOT NULL,
    status public.proforma_status DEFAULT 'Unpaid'::public.proforma_status NOT NULL,
    notes text,
    document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT accounting_proformas_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT accounting_proformas_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT accounting_proformas_tax_total_check CHECK ((tax_total >= (0)::numeric)),
    CONSTRAINT chk_ap_dates CHECK (((due_date IS NULL) OR (due_date >= proforma_date)))
);


ALTER TABLE public.accounting_proformas OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 25859)
-- Name: accounting_quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_quotations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    parent_quotation_id uuid,
    is_latest_revision boolean DEFAULT true NOT NULL,
    quotation_number character varying(100) NOT NULL,
    quotation_date date NOT NULL,
    validity_days integer DEFAULT 30 NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    tax_total numeric(15,2) DEFAULT 0 NOT NULL,
    discount_total numeric(15,2) DEFAULT 0 NOT NULL,
    grand_total numeric(15,2) DEFAULT 0 NOT NULL,
    status public.quotation_status DEFAULT 'Draft'::public.quotation_status NOT NULL,
    notes text,
    document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    customer_name character varying(255),
    bill_to text,
    ship_to text,
    payment_terms character varying(100) DEFAULT 'Due on Receipt'::character varying,
    priority character varying(50) DEFAULT 'Normal'::character varying,
    shipping_amount numeric(15,2) DEFAULT 0,
    terms text,
    CONSTRAINT accounting_quotations_discount_total_check CHECK ((discount_total >= (0)::numeric)),
    CONSTRAINT accounting_quotations_grand_total_check CHECK ((grand_total >= (0)::numeric)),
    CONSTRAINT accounting_quotations_shipping_amount_check CHECK ((shipping_amount >= (0)::numeric)),
    CONSTRAINT accounting_quotations_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT accounting_quotations_tax_total_check CHECK ((tax_total >= (0)::numeric)),
    CONSTRAINT accounting_quotations_validity_days_check CHECK ((validity_days >= 0))
);


ALTER TABLE public.accounting_quotations OWNER TO postgres;

--
-- TOC entry 5726 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE accounting_quotations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.accounting_quotations IS 'Stores the parent quotations and revision chain tracking.';


--
-- TOC entry 5727 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.is_latest_revision; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.is_latest_revision IS 'Identifies the currently active/approved revision in a chain.';


--
-- TOC entry 5728 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.customer_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.customer_name IS 'Customer name for the quotation';


--
-- TOC entry 5729 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.bill_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.bill_to IS 'Billing address';


--
-- TOC entry 5730 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.ship_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.ship_to IS 'Shipping address';


--
-- TOC entry 5731 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.payment_terms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.payment_terms IS 'Payment terms (e.g., Due on Receipt, Net 15)';


--
-- TOC entry 5732 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.priority; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.priority IS 'Priority of the quotation (Normal, High)';


--
-- TOC entry 5733 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.shipping_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.shipping_amount IS 'Shipping cost added to the quotation';


--
-- TOC entry 5734 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN accounting_quotations.terms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.accounting_quotations.terms IS 'Terms and conditions for the quotation';


--
-- TOC entry 249 (class 1259 OID 25560)
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    uploaded_by uuid,
    original_name character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    mime_type character varying(100),
    size_bytes bigint,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 25233)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    entity_name character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    details jsonb,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    old_value jsonb,
    new_value jsonb
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24862)
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    manager_id uuid,
    branch_name character varying(255) NOT NULL,
    branch_code character varying(50) NOT NULL,
    company_name character varying(255),
    company_location character varying(255),
    country character varying(100),
    state character varying(100),
    city character varying(100),
    address text,
    phone character varying(20),
    email character varying(255),
    assigned_target numeric(15,2) DEFAULT 0,
    achieved_target numeric(15,2) DEFAULT 0,
    health_score integer,
    status public.branch_status DEFAULT 'Active'::public.branch_status,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT branches_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100)))
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 25041)
-- Name: communications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    author_id uuid NOT NULL,
    type public.communication_type NOT NULL,
    comm_date date NOT NULL,
    comm_time time without time zone,
    subject character varying(255) NOT NULL,
    discussion_summary text,
    client_problem text,
    suggested_solution text,
    success_status boolean DEFAULT false,
    attachment_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.communications OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 25642)
-- Name: custom_field_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_field_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    custom_field_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    field_value text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_field_values OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 25621)
-- Name: custom_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_fields (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    entity_type character varying(100) NOT NULL,
    field_name character varying(100) NOT NULL,
    field_type character varying(50) NOT NULL,
    is_required boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_fields OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 25531)
-- Name: customer_success; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_success (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    support_status character varying(50) DEFAULT 'Pending'::character varying,
    amc_details text,
    renewal_date date,
    health_score integer,
    nps integer,
    feedback text,
    upsell_opportunity boolean DEFAULT false,
    renewal_status character varying(50) DEFAULT 'Pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_success_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100)))
);


ALTER TABLE public.customer_success OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24948)
-- Name: developers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.developers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid NOT NULL,
    employee_id character varying(50),
    skills text,
    experience_years numeric(4,1),
    joining_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.developers OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 26056)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    hsn_sac character varying(50),
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit character varying(20) DEFAULT 'Nos'::character varying NOT NULL,
    rate numeric(15,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 18 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT invoice_items_discount_percentage_check CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))),
    CONSTRAINT invoice_items_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_items_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT invoice_items_tax_percentage_check CHECK (((tax_percentage >= (0)::numeric) AND (tax_percentage <= (100)::numeric)))
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 25442)
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    activity_type character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    performed_by uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_activities OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 25371)
-- Name: lead_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    assigned_from_user_id uuid,
    assigned_to_user_id uuid,
    assigned_team_id uuid,
    assigned_by_id uuid,
    reason text,
    assigned_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assignment_type character varying(50) DEFAULT 'Developer'::character varying,
    is_current boolean DEFAULT true
);


ALTER TABLE public.lead_assignments OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 25504)
-- Name: lead_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_deliveries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    go_live_date date,
    uat_status character varying(50) DEFAULT 'Pending'::character varying,
    documentation_status character varying(50) DEFAULT 'Pending'::character varying,
    acceptance_status character varying(50) DEFAULT 'Pending'::character varying,
    handover_completed boolean DEFAULT false,
    deployment_date date,
    remarks text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_deliveries OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 25413)
-- Name: lead_followups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_followups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    communication_type character varying(100),
    reminder_notes text,
    outcome text,
    followup_date timestamp with time zone,
    completed_date timestamp with time zone,
    created_by uuid,
    status character varying(50) DEFAULT 'Pending'::character varying,
    remarks text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_followups OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 25313)
-- Name: lead_journey; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_journey (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    stage character varying(100) NOT NULL,
    status character varying(100) NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    entered_by uuid,
    remarks text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_journey OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 25012)
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_notes OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 25472)
-- Name: lead_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_requirements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    requirement text NOT NULL,
    priority character varying(50) DEFAULT 'Medium'::character varying,
    complexity character varying(50) DEFAULT 'Medium'::character varying,
    approval_status character varying(50) DEFAULT 'Pending'::character varying,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    estimated_hours integer,
    approved boolean DEFAULT false,
    approved_by uuid,
    approved_date timestamp with time zone,
    updated_by uuid,
    remarks text,
    assigned_developer_id uuid,
    assigned_team character varying(255)
);


ALTER TABLE public.lead_requirements OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 25343)
-- Name: lead_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_status_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    old_status character varying(100),
    new_status character varying(100) NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    remarks text
);


ALTER TABLE public.lead_status_history OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 25603)
-- Name: lead_tag_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_tag_mapping (
    lead_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_tag_mapping OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 25586)
-- Name: lead_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    tag_name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_tags OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24979)
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    team_id uuid,
    assigned_sales_id character varying(50),
    name character varying(255) NOT NULL,
    company_name character varying(255),
    contact_person character varying(255),
    mobile character varying(20),
    email character varying(255),
    website character varying(255),
    industry character varying(100),
    address text,
    country character varying(100),
    city character varying(100),
    lead_source character varying(100),
    campaign character varying(255),
    referral_name character varying(255),
    advertisement character varying(255),
    social_media character varying(100),
    website_inquiry boolean DEFAULT false,
    budget numeric(15,2),
    decision_maker character varying(255),
    expected_start_date date,
    business_need text,
    project_type character varying(100),
    lead_score integer,
    priority public.priority_level DEFAULT 'Medium'::public.priority_level,
    expected_revenue numeric(15,2),
    status public.lead_status DEFAULT 'New'::public.lead_status,
    next_follow_up_date date,
    reminder_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    assigned_sales_user_id uuid,
    CONSTRAINT leads_lead_score_check CHECK (((lead_score >= 0) AND (lead_score <= 100)))
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24844)
-- Name: login_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(512) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    refresh_token_id uuid,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone
);


ALTER TABLE public.login_sessions OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 25257)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    type character varying(100),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    entity_type character varying(100),
    entity_id uuid,
    action_type character varying(100),
    redirect_url text
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24783)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 25975)
-- Name: proforma_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proforma_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    proforma_id uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    hsn_sac character varying(50),
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit character varying(20) DEFAULT 'Nos'::character varying NOT NULL,
    rate numeric(15,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 18 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT proforma_items_discount_percentage_check CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))),
    CONSTRAINT proforma_items_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT proforma_items_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT proforma_items_tax_percentage_check CHECK (((tax_percentage >= (0)::numeric) AND (tax_percentage <= (100)::numeric)))
);


ALTER TABLE public.proforma_items OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 25104)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    project_name character varying(255) NOT NULL,
    start_date date,
    deadline date,
    technology text,
    status public.project_status DEFAULT 'Not Started'::public.project_status,
    progress_pct integer DEFAULT 0,
    total_cost numeric(15,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    team_id uuid,
    developer_id uuid,
    remarks text,
    CONSTRAINT projects_progress_pct_check CHECK (((progress_pct >= 0) AND (progress_pct <= 100)))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 25073)
-- Name: proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    proposal_number character varying(100),
    proposal_version character varying(50) DEFAULT 'v1.0'::character varying,
    business_analysis text,
    technical_analysis text,
    risk_analysis text,
    scope text,
    timeline character varying(100),
    est_hours integer,
    quotation_amount numeric(15,2),
    discount numeric(15,2) DEFAULT 0,
    final_cost numeric(15,2),
    currency character varying(10) DEFAULT 'USD'::character varying,
    status public.proposal_status DEFAULT 'Draft'::public.proposal_status,
    is_approved boolean DEFAULT false,
    contract_signed boolean DEFAULT false,
    advance_received boolean DEFAULT false,
    advance_amount numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.proposals OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 25905)
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quotation_id uuid NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    hsn_sac character varying(50),
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit character varying(20) DEFAULT 'Nos'::character varying NOT NULL,
    rate numeric(15,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 18 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT quotation_items_discount_percentage_check CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))),
    CONSTRAINT quotation_items_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT quotation_items_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT quotation_items_tax_percentage_check CHECK (((tax_percentage >= (0)::numeric) AND (tax_percentage <= (100)::numeric)))
);


ALTER TABLE public.quotation_items OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24796)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24770)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name public.role_type NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 25203)
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_attachments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    task_id uuid NOT NULL,
    uploaded_by_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    file_size_bytes bigint,
    mime_type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_attachments OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 25686)
-- Name: task_checklists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_checklists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    task_id uuid NOT NULL,
    item_text character varying(255) NOT NULL,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_checklists OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 25174)
-- Name: task_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_comments OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 25668)
-- Name: task_dependencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_dependencies (
    task_id uuid NOT NULL,
    depends_on_task_id uuid NOT NULL,
    dependency_type character varying(50) DEFAULT 'finish-to-start'::character varying
);


ALTER TABLE public.task_dependencies OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 25726)
-- Name: task_label_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_label_mapping (
    task_id uuid NOT NULL,
    label_id uuid NOT NULL
);


ALTER TABLE public.task_label_mapping OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 25709)
-- Name: task_labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_labels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    label_name character varying(100) NOT NULL,
    color_hex character varying(10),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_labels OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 25133)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    assigned_by_id uuid NOT NULL,
    assigned_to_id uuid,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    priority public.priority_level DEFAULT 'Medium'::public.priority_level,
    status public.task_status DEFAULT 'Open'::public.task_status,
    assigned_date date DEFAULT CURRENT_DATE,
    due_date date,
    est_hours numeric(6,2),
    hours_worked numeric(6,2) DEFAULT 0,
    progress_pct integer DEFAULT 0,
    blocker_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT tasks_progress_pct_check CHECK (((progress_pct >= 0) AND (progress_pct <= 100)))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24916)
-- Name: team_leaders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_leaders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid NOT NULL,
    employee_id character varying(50),
    designation character varying(100),
    performance_score integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_leaders_performance_score_check CHECK (((performance_score >= 0) AND (performance_score <= 100)))
);


ALTER TABLE public.team_leaders OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24892)
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    team_name character varying(255) NOT NULL,
    department character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24759)
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24814)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    role_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5712 (class 0 OID 26006)
-- Dependencies: 262
-- Data for Name: accounting_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_invoices (id, tenant_id, lead_id, proforma_id, invoice_number, invoice_date, due_date, invoice_type, place_of_supply, currency, subtotal, tax_total, grand_total, amount_paid, balance_due, status, document_url, created_at, updated_at) FROM stdin;
f4b40819-4a98-4b63-a93b-57a2f57283e3	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	77ec82e3-f85a-432c-be0e-23a912c47162	INV-2026-6998	2026-07-16	\N	GST Invoice	Local	INR (₹)	100.00	18.00	118.00	30.00	88.00	Partially Paid	\N	2026-07-16 16:43:35.2847+05:30	2026-07-16 16:43:35.350794+05:30
\.


--
-- TOC entry 5714 (class 0 OID 26087)
-- Dependencies: 264
-- Data for Name: accounting_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_payments (id, tenant_id, invoice_id, payment_date, payment_mode, transaction_number, amount_received, bank_name, received_by, document_url, notes, created_at, updated_at) FROM stdin;
c9693405-061b-4b05-8951-a9bcb10fa3eb	aaaa0000-0000-0000-0000-000000000000	f4b40819-4a98-4b63-a93b-57a2f57283e3	2026-07-16	Cash	\N	30.00	\N	\N	\N	Initial Payment / Advance	2026-07-16 16:43:35.350794+05:30	2026-07-16 16:43:35.350794+05:30
\.


--
-- TOC entry 5710 (class 0 OID 25936)
-- Dependencies: 260
-- Data for Name: accounting_proformas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_proformas (id, tenant_id, lead_id, quotation_id, proforma_number, proforma_date, due_date, subtotal, tax_total, grand_total, status, notes, document_url, created_at, updated_at) FROM stdin;
77ec82e3-f85a-432c-be0e-23a912c47162	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	9dd678ed-0932-4e2d-abdd-42438147db2c	PI-2026-07821	2026-07-16	\N	100.00	18.00	118.00	Unpaid	make the payment brfore the validity date ..	\N	2026-07-16 16:00:39.245707+05:30	2026-07-16 16:00:39.245707+05:30
\.


--
-- TOC entry 5708 (class 0 OID 25859)
-- Dependencies: 258
-- Data for Name: accounting_quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_quotations (id, tenant_id, lead_id, parent_quotation_id, is_latest_revision, quotation_number, quotation_date, validity_days, subtotal, tax_total, discount_total, grand_total, status, notes, document_url, created_at, updated_at, customer_name, bill_to, ship_to, payment_terms, priority, shipping_amount, terms) FROM stdin;
c3d06723-f666-4310-8c01-dbc8d05c879d	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	\N	t	QT-2026-7421	2026-07-16	30	0.00	0.00	0.00	0.00	Draft	\N	\N	2026-07-16 16:07:26.905939+05:30	2026-07-16 16:44:08.768025+05:30	test	\N	\N	Due on Receipt	Normal	0.00	\N
2aebc0c0-8312-4409-8628-beece6add414	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	\N	f	QT-2026-3683	2026-07-10	30	100.00	18.00	0.00	118.00	Rejected	\N	\N	2026-07-10 16:38:43.59571+05:30	2026-07-16 14:39:42.571069+05:30	\N	\N	\N	Due on Receipt	Normal	0.00	\N
2bea5b63-22a1-4a69-8f47-0e6a60045afd	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	2aebc0c0-8312-4409-8628-beece6add414	t	QT-2026-3683-R2	2026-07-08	30	100.00	18.00	0.00	118.00	Draft		\N	2026-07-16 14:39:42.571069+05:30	2026-07-16 14:39:42.571069+05:30	aadinath magar	someone	test company	Due on Receipt	Normal	90.00	make the payment brfore the validity date ..
9dd678ed-0932-4e2d-abdd-42438147db2c	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	2aebc0c0-8312-4409-8628-beece6add414	f	QT-2026-3683-R1	2026-07-09	30	100.00	18.00	0.00	118.00	Accepted		\N	2026-07-16 11:40:44.946939+05:30	2026-07-16 15:50:22.02732+05:30	aadinath magar	someone	test company	Due on Receipt	Normal	0.00	make the payment brfore the validity date ..
\.


--
-- TOC entry 5699 (class 0 OID 25560)
-- Dependencies: 249
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, tenant_id, entity_type, entity_id, uploaded_by, original_name, stored_name, mime_type, size_bytes, url, created_at) FROM stdin;
\.


--
-- TOC entry 5689 (class 0 OID 25233)
-- Dependencies: 239
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, tenant_id, user_id, entity_name, entity_id, action, details, ip_address, created_at, old_value, new_value) FROM stdin;
\.


--
-- TOC entry 5677 (class 0 OID 24862)
-- Dependencies: 227
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, tenant_id, manager_id, branch_name, branch_code, company_name, company_location, country, state, city, address, phone, email, assigned_target, achieved_target, health_score, status, description, created_at, updated_at, deleted_at) FROM stdin;
49bb802c-89b2-44c6-8cda-d97939989f9e	aaaa0000-0000-0000-0000-000000000000	\N	Pune Innovation Center Updated	BR-1782909823685	Kosqu Software Pvt Ltd	\N	\N	\N	Pune	\N	\N	pune.ic@kosqu.com	350000.00	0.00	95	Active	\N	2026-07-01 18:13:43.705222+05:30	2026-07-01 18:13:43.909035+05:30	2026-07-01 18:13:43.909035+05:30
ecb191c4-4ea0-41b1-af65-f65bc9eea4ee	aaaa0000-0000-0000-0000-000000000000	\N	Test Branch Timeout	TBT-1782929294040	\N	Pune	\N	\N	Pune	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-01 23:38:14.245299+05:30	2026-07-01 23:53:54.777557+05:30	2026-07-01 23:53:54.777557+05:30
a3e49e76-620b-4add-9bea-7532ab48c0f4	aaaa0000-0000-0000-0000-000000000000	\N	mumbai accenture	fsgs	Kosqu Software	fsfS	India	SFDSDf	zvdfDsdf	sdfasdfSE	1234567890	test2@gmail.com	32454.00	0.00	0	Active	\N	2026-07-02 00:20:44.350849+05:30	2026-07-02 00:29:34.544089+05:30	2026-07-02 00:29:34.544089+05:30
13c038c2-04eb-46bf-8b82-cf27a717ab62	aaaa0000-0000-0000-0000-000000000000	\N	Test	Testasf	Kosqu Software	Others	India	test	test	Test	1234567890	test@gmail.com	1234.00	0.00	10	Active	\N	2026-07-02 00:00:17.616961+05:30	2026-07-02 00:29:40.16656+05:30	2026-07-02 00:29:40.16656+05:30
b23ddc61-0a8e-4c7d-b29d-5309ef3c47d5	aaaa0000-0000-0000-0000-000000000000	\N	test five	asdf23	Kosqu Software	airoli	India	SFDSDf	zvdfDsdf	sdfasdfSE	01234567890	test5@gmail.com	2345.00	0.00	1	Active	\N	2026-07-02 10:10:25.534499+05:30	2026-07-02 10:34:50.226201+05:30	2026-07-02 10:34:50.226201+05:30
866c8979-1931-429f-98ce-6f9d234309fa	aaaa0000-0000-0000-0000-000000000000	\N	tcs	asdfasdf	Kosqu Software	asfasdvadv	India	SDvSDv	sdvasdvXV	sdZV DSVZVS	01234567890	test4@gmail.com	3252.00	0.00	1	Active	\N	2026-07-02 00:54:54.758915+05:30	2026-07-02 10:34:55.194157+05:30	2026-07-02 10:34:55.194157+05:30
a77ce849-ae68-4e8b-9348-c4e1edc62b3b	aaaa0000-0000-0000-0000-000000000000	\N	Test Branch	TEST_67OTE	Test Company	\N	\N	\N	Mumbai	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-02 00:45:49.853256+05:30	2026-07-02 10:35:00.659355+05:30	2026-07-02 10:35:00.659355+05:30
423f43cf-7038-4945-a33b-7760eba13666	aaaa0000-0000-0000-0000-000000000000	ad7dad47-4ee9-4426-8f2f-480ea872b979	Test6	34qfw	Kosqu Software	Test6 location	India	test	Test	afasfdfsdbdg	9209017621	test@gmail.com	324.00	0.00	10	Active	\N	2026-07-02 10:36:45.135581+05:30	2026-07-02 12:23:13.14697+05:30	2026-07-02 12:23:13.14697+05:30
e301df42-6c61-41fa-8858-4d93b4956e3b	aaaa0000-0000-0000-0000-000000000000	14c14e8d-7609-465e-adae-12a4eff9e3c4	test	asefew	Kosqu Software	Test6 location	India	test	Test	afasfdfsdbdg	09209017621	test@gmail.com	345.00	567.00	0	Active	\N	2026-07-03 18:31:38.206343+05:30	2026-07-04 09:57:24.160735+05:30	2026-07-04 09:57:24.160735+05:30
cccc0000-0000-0000-0000-000000000002	aaaa0000-0000-0000-0000-000000000000	\N	Kosqu Corporate Office	KQ001	Kosqu Software	\N	\N	\N	Pune	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-01 16:48:41.545275+05:30	2026-07-04 04:09:28.238099+05:30	2026-07-04 04:09:28.238099+05:30
cccc0000-0000-0000-0000-000000000001	aaaa0000-0000-0000-0000-000000000000	bbbb0000-0000-0000-0000-000000000002	Kosque Advertisement	KA004	Kosque Media	\N	\N	\N	Mumbai	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-01 16:48:41.545275+05:30	2026-07-04 04:09:34.857232+05:30	2026-07-04 04:09:34.857232+05:30
246692df-6a9c-4029-830b-388d3ab9e919	aaaa0000-0000-0000-0000-000000000000	\N	test three	asdffsadf	Kosqu Software	asdfasdf	India	asdf	asfd	asdfasdfad	01234567890	test3@gmail.com	0.00	0.00	0	Active	\N	2026-07-02 00:31:06.228651+05:30	2026-07-04 04:09:41.257724+05:30	2026-07-04 04:09:41.257724+05:30
f7330ad2-308b-482e-999d-587b405a875b	aaaa0000-0000-0000-0000-000000000000	b6be28ec-f9e1-47cf-ace9-79439c73eb1f	kosqu nerul	wrf3	Kosqu Software	nerul	India	Maharashtra	Navi Mumbai	Kharghar , Navi mumbai ,Maharashtra	09209017621	ashish@gmail.com	39000.00	0.00	\N	Active	\N	2026-07-04 04:14:32.526504+05:30	2026-07-04 09:57:12.766115+05:30	2026-07-04 09:57:12.766115+05:30
f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	aaaa0000-0000-0000-0000-000000000000	40f2f484-0476-4ab1-a564-c69b67af7a67	kosqu airoli	123sxcs	Kosqu Software	airoli	India	Maharashtra	mumbai	mumbai	9209017621	alise@gmail.com	1293434.00	766.00	0	Active	\N	2026-07-03 12:19:41.232122+05:30	2026-07-04 09:57:27.819916+05:30	2026-07-04 09:57:27.819916+05:30
d3a62b2d-c688-4f9e-b04d-51c93873af57	aaaa0000-0000-0000-0000-000000000000	61c91173-e1d3-41da-a894-86311b3fbd9d	Araham IT Solutions LLP	ARAIT78	Kosqu technolab	Nagar	India	Maharashtra	Ahilya Nagar	araham it solution , nagar	09209017626	harsh@gmail.com	10000000.00	0.00	\N	Active	\N	2026-07-04 16:05:21.65686+05:30	2026-07-11 11:15:55.588552+05:30	\N
ef268a1f-f791-4c59-90b6-b36f8e1aa230	aaaa0000-0000-0000-0000-000000000000	4bdeab3d-bcbd-4d39-9c88-555cfda88116	Kosqu Technolab	mum001	Kosqu Software	Juinagar	India	Maharashtra	mumbai	mumbai	09209017621	arjun@gmail.com	2000000.00	100000.00	\N	Active	\N	2026-07-04 10:01:21.20814+05:30	2026-07-11 11:16:29.359154+05:30	\N
7baae045-e9c0-4947-84cb-cacc035128e3	aaaa0000-0000-0000-0000-000000000000	b3f4d63a-dbbc-4fe8-8f42-a24722826c14	qwerty	qwertyu	werty	qwqert	India	wqeretr	werty	asdfg	1234567890	qwerty@g.com	2345678.00	9876543.00	\N	Active	\N	2026-07-11 11:42:22.266002+05:30	2026-07-11 11:43:33.883148+05:30	2026-07-11 11:43:33.883148+05:30
8c06d1d0-5db8-4b5b-9713-227f9dab0ecd	aaaa0000-0000-0000-0000-000000000000	5c1f34c2-3de9-4416-a782-00a5135c665e	Apponext LLP	app001	Apponext LLP	Navi Mumbai	India	Maharashtra	Navi Mumbai	Juinagar , Navi mumbai ,Maharashtra	09209017621	imran@aits.com	5000000.00	0.00	\N	Active	\N	2026-07-11 15:14:34.84871+05:30	2026-07-11 15:14:34.84871+05:30	\N
\.


--
-- TOC entry 5683 (class 0 OID 25041)
-- Dependencies: 233
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communications (id, tenant_id, lead_id, author_id, type, comm_date, comm_time, subject, discussion_summary, client_problem, suggested_solution, success_status, attachment_url, created_at) FROM stdin;
736a4a4b-e208-4476-87f1-c251a49e2658	aaaa0000-0000-0000-0000-000000000000	847317b8-1e43-48e9-b94a-a232f23a9adb	bbbb0000-0000-0000-0000-000000000001	Call	2026-07-02	\N	Introductory Discovery Call	Reviewed budget plans and primary goals.	\N	\N	t	\N	2026-07-02 16:12:29.641211+05:30
a49abc46-7708-4207-aa0b-1eeba02d599d	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	bbbb0000-0000-0000-0000-000000000001	Call	2026-07-02	\N	Initial outreach call	Discussed requirements	\N	\N	f	\N	2026-07-02 17:27:46.97631+05:30
58dcee6b-5e8b-4902-805b-b5a26b683514	aaaa0000-0000-0000-0000-000000000000	cee38a8a-5c7a-4443-9a01-aa345f0a7611	bbbb0000-0000-0000-0000-000000000001	Call	2026-07-04	12:00:00	kuch nahi	yesehii	\N	\N	f	\N	2026-07-04 00:02:57.091485+05:30
ab7a3368-bf14-4fca-a3c8-0306e119bd51	aaaa0000-0000-0000-0000-000000000000	53f1ea61-a503-4204-a0f3-b430a6896f0f	b6be28ec-f9e1-47cf-ace9-79439c73eb1f	Call	2026-07-03	12:00:00	kuch nahi	sdfdfvsd	\N	\N	f	\N	2026-07-04 04:19:51.063888+05:30
4a7556fa-64a5-491e-8684-a77c6e73c0a4	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	4bdeab3d-bcbd-4d39-9c88-555cfda88116	Email	2026-07-17	12:00:00	kuch nahi	asdfasdf	\N	\N	f	\N	2026-07-04 10:26:46.907306+05:30
110af323-0282-4f25-9f9b-1ec5c9c42cdd	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	09fdb157-d457-4d8d-94b4-4970fb339349	Meeting	2026-07-04	12:00:00	kuch nahi	cSDAc	\N	\N	f	\N	2026-07-04 12:12:09.41434+05:30
c4c11407-fc45-4b5f-8809-1630373302b1	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	09fdb157-d457-4d8d-94b4-4970fb339349	Meeting	2026-07-10	12:00:00	dsfgfhjkvhgf	asfdsgfgdf	\N	\N	f	\N	2026-07-04 12:12:36.101841+05:30
fda1de2b-51bb-4ebf-8481-557df26e23ce	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	bbbb0000-0000-0000-0000-000000000001	Call	2026-07-06	12:00:00	asdf	asdf	\N	\N	f	\N	2026-07-06 11:10:07.342925+05:30
\.


--
-- TOC entry 5703 (class 0 OID 25642)
-- Dependencies: 253
-- Data for Name: custom_field_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_field_values (id, tenant_id, custom_field_id, entity_id, field_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5702 (class 0 OID 25621)
-- Dependencies: 252
-- Data for Name: custom_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_fields (id, tenant_id, entity_type, field_name, field_type, is_required, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5698 (class 0 OID 25531)
-- Dependencies: 248
-- Data for Name: customer_success; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_success (id, tenant_id, lead_id, support_status, amc_details, renewal_date, health_score, nps, feedback, upsell_opportunity, renewal_status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5680 (class 0 OID 24948)
-- Dependencies: 230
-- Data for Name: developers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.developers (id, tenant_id, user_id, team_id, employee_id, skills, experience_years, joining_date, created_at, updated_at) FROM stdin;
6161ba44-afd5-43f9-936e-4950e9a54d70	aaaa0000-0000-0000-0000-000000000000	bbbb0000-0000-0000-0000-000000000004	dddd0000-0000-0000-0000-000000000001	DEV1001	React, Node.js, PostgreSQL	\N	\N	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30
10d4d3ad-03dd-4bbc-9886-413b7d645744	aaaa0000-0000-0000-0000-000000000000	056be996-6131-43ce-9b59-b81eaa04884b	cf7bf8e3-e9ab-46a4-95d6-b031c2c30a77	43f	\N	\N	\N	2026-07-03 19:47:10.69817+05:30	2026-07-03 19:47:10.69817+05:30
333bd4bb-231f-409a-945d-dd8984353b7b	aaaa0000-0000-0000-0000-000000000000	fb3abd83-d17d-4f41-a851-1663610192b9	cf7bf8e3-e9ab-46a4-95d6-b031c2c30a77	234123	\N	\N	\N	2026-07-03 19:47:23.174173+05:30	2026-07-03 19:47:23.174173+05:30
3f0a32b3-2c75-48bf-a8f4-4755db56a609	aaaa0000-0000-0000-0000-000000000000	b10d27bc-a481-4028-9385-000756ab80de	cf7bf8e3-e9ab-46a4-95d6-b031c2c30a77	qwerr	\N	\N	\N	2026-07-03 19:47:41.030596+05:30	2026-07-03 19:47:41.030596+05:30
1b07498b-9dc8-42f6-95f4-57d0b27656ed	aaaa0000-0000-0000-0000-000000000000	a8ffefa4-0aca-47a4-9a8c-6df82d6580cf	7ab717ca-adc7-4211-9826-fb1f36c3c52f	sdf	\N	\N	\N	2026-07-04 10:34:45.285943+05:30	2026-07-04 10:34:45.285943+05:30
895d5355-1dbe-4aa5-8422-431ea2ec2e55	aaaa0000-0000-0000-0000-000000000000	aa1d5937-3f0e-435e-9ff3-a2e1d15bf1d4	a3bdf770-7e66-407b-b7f3-be348e708b51	Karan	\N	\N	\N	2026-07-04 11:20:50.175462+05:30	2026-07-04 11:20:50.175462+05:30
3e1f95d6-3fa1-4829-9863-f87776e64db4	aaaa0000-0000-0000-0000-000000000000	7d19ca76-c798-4aa9-9120-e69fc700082a	a3bdf770-7e66-407b-b7f3-be348e708b51	adf32	\N	\N	\N	2026-07-04 11:44:32.064544+05:30	2026-07-04 11:44:32.064544+05:30
ba9008f2-0418-4f10-a1aa-3afd227c9b95	aaaa0000-0000-0000-0000-000000000000	907fe096-fcc8-4c4b-90cb-be0dbdb81cd1	a3bdf770-7e66-407b-b7f3-be348e708b51	43f4556	\N	\N	\N	2026-07-04 11:46:28.864063+05:30	2026-07-04 11:46:28.864063+05:30
1d47ce32-f1e5-4e97-a715-77374187ee0a	aaaa0000-0000-0000-0000-000000000000	bcb4beab-7b5a-48df-99b4-491aedeeb92d	f91138a6-7c58-4b6e-911c-7a7a3bc50832	test354	\N	\N	\N	2026-07-17 12:28:09.721598+05:30	2026-07-17 12:28:09.721598+05:30
\.


--
-- TOC entry 5713 (class 0 OID 26056)
-- Dependencies: 263
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage, created_at) FROM stdin;
69a0951b-17ad-445c-8d0c-055a86360ef3	f4b40819-4a98-4b63-a93b-57a2f57283e3	Service/Product	\N	\N	1.00	Nos	100.00	0.00	18.00	2026-07-16 16:43:35.2847+05:30
aef58145-3753-42a1-bb65-b2bced0e6534	f4b40819-4a98-4b63-a93b-57a2f57283e3	Service/Product	\N	\N	1.00	Nos	0.00	0.00	18.00	2026-07-16 16:43:35.2847+05:30
\.


--
-- TOC entry 5695 (class 0 OID 25442)
-- Dependencies: 245
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_activities (id, tenant_id, lead_id, activity_type, entity_type, entity_id, performed_by, metadata, created_at) FROM stdin;
2872281e-d017-4d02-814a-02566d03b48b	aaaa0000-0000-0000-0000-000000000000	47e2c8ba-9de9-4349-a39a-8d68f5c94f01	Lead Created	leads	47e2c8ba-9de9-4349-a39a-8d68f5c94f01	bbbb0000-0000-0000-0000-000000000001	{"name": "test", "status": "Contacted"}	2026-07-03 10:46:16.937175+05:30
b2ce060e-9b16-498e-b850-992880a56c20	aaaa0000-0000-0000-0000-000000000000	34d70b72-1347-430a-b6b0-8d789d5a6707	Lead Created	leads	34d70b72-1347-430a-b6b0-8d789d5a6707	bbbb0000-0000-0000-0000-000000000001	{"name": "Dashboard Test Lead 1783056366270", "status": "New"}	2026-07-03 10:56:06.28207+05:30
715ef2d1-f55b-44bc-9f45-4502e8b10c9f	aaaa0000-0000-0000-0000-000000000000	47e2c8ba-9de9-4349-a39a-8d68f5c94f01	Status Changed	lead_status_history	2e69db35-749f-4d36-877a-a7bebc718f68	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Closed Won", "old_status": "Contacted"}	2026-07-03 11:47:03.568706+05:30
30386adb-ad79-4e0f-8088-b38d93d6d78a	aaaa0000-0000-0000-0000-000000000000	b10fad76-7d88-474d-bd93-68001570fa4e	Lead Created	leads	b10fad76-7d88-474d-bd93-68001570fa4e	bbbb0000-0000-0000-0000-000000000001	{"name": "naya", "status": "Contacted"}	2026-07-03 12:05:54.82073+05:30
c8375dec-7cf8-40e7-a091-f0cf528af6e9	aaaa0000-0000-0000-0000-000000000000	0cd6567c-a6f4-4aac-8eda-531a167d4956	Lead Created	leads	0cd6567c-a6f4-4aac-8eda-531a167d4956	bbbb0000-0000-0000-0000-000000000001	{"name": "bob", "status": "Negotiation"}	2026-07-03 13:25:01.244862+05:30
ede68e35-f864-489d-9e24-09cd9c10ecee	aaaa0000-0000-0000-0000-000000000000	cee38a8a-5c7a-4443-9a01-aa345f0a7611	Lead Created	leads	cee38a8a-5c7a-4443-9a01-aa345f0a7611	40f2f484-0476-4ab1-a564-c69b67af7a67	{"name": "test", "status": "Contacted"}	2026-07-03 19:04:19.439131+05:30
a8fc7131-50dc-45d1-9a5a-186d1fd1b5e6	aaaa0000-0000-0000-0000-000000000000	cee38a8a-5c7a-4443-9a01-aa345f0a7611	Communication Created	communications	58dcee6b-5e8b-4902-805b-b5a26b683514	bbbb0000-0000-0000-0000-000000000001	{"type": "Call", "subject": "kuch nahi"}	2026-07-04 00:02:57.091485+05:30
76800bd5-57ed-4744-895d-8378cd78cf54	aaaa0000-0000-0000-0000-000000000000	cee38a8a-5c7a-4443-9a01-aa345f0a7611	Requirement Created	lead_requirements	8870d032-d7ee-48fe-b926-f9de68a1bb39	bbbb0000-0000-0000-0000-000000000001	{"priority": "Low", "requirement": "brach"}	2026-07-04 00:07:39.60335+05:30
ab2b8ece-95fc-41c5-a6f4-cc194a60e2b2	aaaa0000-0000-0000-0000-000000000000	53f1ea61-a503-4204-a0f3-b430a6896f0f	Lead Created	leads	53f1ea61-a503-4204-a0f3-b430a6896f0f	bbbb0000-0000-0000-0000-000000000001	{"name": "gupta sandwich", "status": "Contacted"}	2026-07-04 04:17:10.221458+05:30
8f6c4e6f-58a5-4243-9c85-5ec16889cef7	aaaa0000-0000-0000-0000-000000000000	53f1ea61-a503-4204-a0f3-b430a6896f0f	Communication Created	communications	ab7a3368-bf14-4fca-a3c8-0306e119bd51	b6be28ec-f9e1-47cf-ace9-79439c73eb1f	{"type": "Call", "subject": "kuch nahi"}	2026-07-04 04:19:51.063888+05:30
12fd8008-af0c-490a-93e7-b07d8b5f8d15	aaaa0000-0000-0000-0000-000000000000	53f1ea61-a503-4204-a0f3-b430a6896f0f	Status Changed	lead_status_history	ac610e6b-5f58-44a7-aee7-9e7c8667abe7	bbbb0000-0000-0000-0000-000000000001	{"new_status": "New", "old_status": "Contacted"}	2026-07-04 09:56:16.343894+05:30
d198fbee-d64b-44ec-8fab-d3159c875c79	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	Lead Created	leads	67b662cd-bafa-43a9-a890-e8d9393a53ee	bbbb0000-0000-0000-0000-000000000001	{"name": "HR portal", "status": "New"}	2026-07-04 10:16:46.862186+05:30
5ed12288-a092-4fc3-b065-8b9aece85dea	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	Status Changed	lead_status_history	03b5052e-ae99-4fb1-bed5-0b67e4f41c18	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Contacted", "old_status": "New"}	2026-07-04 10:23:01.016564+05:30
8f5a3832-1491-4536-acfc-ba39feda736f	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	Communication Created	communications	4a7556fa-64a5-491e-8684-a77c6e73c0a4	4bdeab3d-bcbd-4d39-9c88-555cfda88116	{"type": "Email", "subject": "kuch nahi"}	2026-07-04 10:26:46.907306+05:30
b245b1fd-64a0-44a8-8270-d2123bd4e675	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	Proposal Created	proposals	96019d02-83b6-499e-9a85-ad0c6f44b6a6	bbbb0000-0000-0000-0000-000000000001	{"final_cost": "68067.00", "proposal_number": "PROP-67B662CD-152507-7271", "proposal_version": "v11"}	2026-07-04 10:29:12.508351+05:30
2781c195-8880-4216-8139-3a6e4d5d28ee	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	Lead Created	leads	c6a18598-e92d-4d4e-8ef2-9cd321a40495	bbbb0000-0000-0000-0000-000000000001	{"name": "Greentech solution", "status": "New"}	2026-07-04 11:17:00.124376+05:30
7b5606af-23da-4465-954c-776d9679bc02	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	Communication Created	communications	110af323-0282-4f25-9f9b-1ec5c9c42cdd	09fdb157-d457-4d8d-94b4-4970fb339349	{"type": "Meeting", "subject": "kuch nahi"}	2026-07-04 12:12:09.41434+05:30
2f40c179-b4de-4d28-a6f5-e7ddf8ae11e5	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	Communication Created	communications	c4c11407-fc45-4b5f-8809-1630373302b1	09fdb157-d457-4d8d-94b4-4970fb339349	{"type": "Meeting", "subject": "dsfgfhjkvhgf"}	2026-07-04 12:12:36.101841+05:30
df0b7863-c8f5-422f-a5c3-e79c65235956	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	Status Changed	lead_status_history	43f8bd88-fd36-40c1-abd2-f904414b54d7	09fdb157-d457-4d8d-94b4-4970fb339349	{"new_status": "Closed Won", "old_status": "New"}	2026-07-04 12:18:39.288764+05:30
a5fe30ad-bb2a-41f9-bc53-7c7c80f27144	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Lead Created	leads	127ba296-3bd4-475e-a870-edb5e4616e79	4bdeab3d-bcbd-4d39-9c88-555cfda88116	{"name": "Greentech solution", "status": "Contacted"}	2026-07-04 15:18:22.574881+05:30
48b4f1c2-0a30-48e8-932a-80de27b56a19	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Status Changed	lead_status_history	293b7400-d5c4-4ac2-81c2-40ad09f21bd5	4bdeab3d-bcbd-4d39-9c88-555cfda88116	{"new_status": "Negotiation", "old_status": "Contacted"}	2026-07-04 15:18:29.844165+05:30
dfd02a40-58e5-4080-a5c8-dcaaf5602cfb	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Status Changed	lead_status_history	241eebdc-80e7-4d2c-8154-2b0b1fafc01d	4bdeab3d-bcbd-4d39-9c88-555cfda88116	{"new_status": "Closed Lost", "old_status": "Negotiation"}	2026-07-04 15:24:00.687448+05:30
c9e8fc53-95d3-4d11-89f8-0c190efd6787	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Status Changed	lead_status_history	6c3f5801-cbb9-4dcd-bd7e-0d42f9357e5e	4bdeab3d-bcbd-4d39-9c88-555cfda88116	{"new_status": "Closed Won", "old_status": "Closed Lost"}	2026-07-04 15:24:57.332376+05:30
3f1ed444-a6fd-439e-a73d-952b1882d86a	aaaa0000-0000-0000-0000-000000000000	455e5977-41cf-4d81-81c8-32e8ddb1bb76	Lead Created	leads	455e5977-41cf-4d81-81c8-32e8ddb1bb76	bbbb0000-0000-0000-0000-000000000001	{"name": "acme", "status": "Contacted"}	2026-07-04 15:43:54.840691+05:30
fc6f48e9-bc60-416e-9e0f-1cfb65bbcebf	aaaa0000-0000-0000-0000-000000000000	9b9beb38-1db7-4a43-a592-9c21ba4032b3	Lead Created	leads	9b9beb38-1db7-4a43-a592-9c21ba4032b3	4bdeab3d-bcbd-4d39-9c88-555cfda88116	{"name": "acme", "status": "Contacted"}	2026-07-04 15:45:28.504104+05:30
d24e7621-acf0-4d78-870d-0fec0fb96b4d	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Lead Created	leads	c92e6920-01dd-4068-b453-0ae18c74ad56	bbbb0000-0000-0000-0000-000000000001	{"name": "gupta sandwich", "status": "New"}	2026-07-04 16:09:08.253321+05:30
ed96170e-9834-47ae-8e68-ee7b7b29ee3d	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Communication Created	communications	fda1de2b-51bb-4ebf-8481-557df26e23ce	bbbb0000-0000-0000-0000-000000000001	{"type": "Call", "subject": "asdf"}	2026-07-06 11:10:07.342925+05:30
177b9a1e-3144-4a93-b628-9f885bd979b2	aaaa0000-0000-0000-0000-000000000000	777ff4fa-98b7-4843-b8db-fb55c65da24e	Lead Created	leads	777ff4fa-98b7-4843-b8db-fb55c65da24e	bbbb0000-0000-0000-0000-000000000001	{"name": "Test Lead Fix", "status": "New"}	2026-07-02 17:19:40.767578+05:30
46f8652f-b5c6-4565-9d24-445a829abab8	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Lead Created	leads	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	bbbb0000-0000-0000-0000-000000000001	{"name": "Audit Test Lead", "status": "New"}	2026-07-02 17:27:46.878683+05:30
fc69d287-0aa1-4cc7-bc83-7abdb1006d24	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Status Changed	lead_status_history	fcad8eaf-1dd2-4c89-a06c-289b0319f745	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Contacted", "old_status": "New"}	2026-07-02 17:27:46.942467+05:30
b1d2eae4-61bc-4898-b15a-98dd9a3c9ee6	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Communication Created	communications	a49abc46-7708-4207-aa0b-1eeba02d599d	bbbb0000-0000-0000-0000-000000000001	{"type": "Call", "subject": "Initial outreach call"}	2026-07-02 17:27:46.97631+05:30
4db5e8d3-13d0-45eb-b100-0a2539bed3a8	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Requirement Created	lead_requirements	407fa020-d840-4dfe-ac05-c04a8103879b	bbbb0000-0000-0000-0000-000000000001	{"priority": "High", "requirement": "Build REST API integration"}	2026-07-02 17:27:46.999458+05:30
c97e6c90-e0ae-4fa2-ad6d-b808cf3479e7	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Proposal Created	proposals	2efa9818-dfdb-45c6-bcf9-92a672ca224f	bbbb0000-0000-0000-0000-000000000001	{"final_cost": "300000.00", "proposal_number": "PROP-E1B1C075-467022-3684", "proposal_version": "v1.0"}	2026-07-02 17:27:47.023846+05:30
ce244fca-b8ae-4bff-9929-b8264a04e5c4	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Status Changed	lead_status_history	c9c439ca-9e73-441c-a175-2f838f0232b3	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Closed Won", "old_status": "Contacted"}	2026-07-02 17:27:47.124519+05:30
40208628-d887-48db-ba52-274cfc27a8f9	aaaa0000-0000-0000-0000-000000000000	fb0ade2b-9606-43af-8dc2-d778f261d06b	Lead Created	leads	fb0ade2b-9606-43af-8dc2-d778f261d06b	bbbb0000-0000-0000-0000-000000000001	{"name": "Modal Simulation Test", "status": "New"}	2026-07-02 17:34:00.768565+05:30
95b9eaef-250d-41c2-b0ca-ea295d55bb77	aaaa0000-0000-0000-0000-000000000000	b70e7b8d-51c4-494d-a148-118e4155b22f	Lead Created	leads	b70e7b8d-51c4-494d-a148-118e4155b22f	bbbb0000-0000-0000-0000-000000000001	{"name": "test", "status": "Contacted"}	2026-07-02 17:45:04.90614+05:30
7bf56b28-0dcf-4db8-bf6b-c3d4a9ab6150	aaaa0000-0000-0000-0000-000000000000	515f8fc9-68b8-4f38-a205-66a68fa506a7	Lead Created	leads	515f8fc9-68b8-4f38-a205-66a68fa506a7	bbbb0000-0000-0000-0000-000000000001	{"name": "Dashboard Test Lead 1783055642091", "status": "New"}	2026-07-03 10:44:02.109831+05:30
abc45c53-a0ff-432e-bab3-089550de6864	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Requirement Created	lead_requirements	28c1e36a-c064-4da2-a00d-f55f33bf2752	bbbb0000-0000-0000-0000-000000000001	{"priority": "High", "requirement": "new module accounting need to create"}	2026-07-06 11:24:12.759485+05:30
4d44b8be-29bf-4b0f-a7d5-598d25bec6c1	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Status Changed	lead_status_history	6bfb05f7-8080-41c0-ac2a-3b476638e5c7	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Closed Won", "old_status": "New"}	2026-07-06 12:06:01.318149+05:30
000b56a5-3b15-40a0-adbe-11ef74c29026	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Status Changed	lead_status_history	274c6e51-0350-47e8-8f43-e82fcbbcc1d8	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Negotiation", "old_status": "Closed Won"}	2026-07-06 12:06:33.593916+05:30
ad644403-8d86-4ced-b701-d4c15251d90c	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Status Changed	lead_status_history	2369d6b3-9c0d-4adb-93fb-79f82f6ceba8	bbbb0000-0000-0000-0000-000000000001	{"new_status": "Closed Lost", "old_status": "Negotiation"}	2026-07-06 12:06:47.233164+05:30
\.


--
-- TOC entry 5693 (class 0 OID 25371)
-- Dependencies: 243
-- Data for Name: lead_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_assignments (id, tenant_id, lead_id, assigned_from_user_id, assigned_to_user_id, assigned_team_id, assigned_by_id, reason, assigned_date, assignment_type, is_current) FROM stdin;
2f32e08d-5a05-446f-974f-66b91d733940	aaaa0000-0000-0000-0000-000000000000	847317b8-1e43-48e9-b94a-a232f23a9adb	\N	\N	dddd0000-0000-0000-0000-000000000001	bbbb0000-0000-0000-0000-000000000001	CRM development expertise required	2026-07-02 16:12:29.843156+05:30	Team	f
71354579-3a58-4e41-9b0f-db1ea47f719f	aaaa0000-0000-0000-0000-000000000000	847317b8-1e43-48e9-b94a-a232f23a9adb	\N	bbbb0000-0000-0000-0000-000000000004	dddd0000-0000-0000-0000-000000000001	bbbb0000-0000-0000-0000-000000000003	Assigning Aarav as primary developer	2026-07-02 16:12:29.885397+05:30	Developer	t
\.


--
-- TOC entry 5697 (class 0 OID 25504)
-- Dependencies: 247
-- Data for Name: lead_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_deliveries (id, tenant_id, lead_id, go_live_date, uat_status, documentation_status, acceptance_status, handover_completed, deployment_date, remarks, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5694 (class 0 OID 25413)
-- Dependencies: 244
-- Data for Name: lead_followups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_followups (id, tenant_id, lead_id, communication_type, reminder_notes, outcome, followup_date, completed_date, created_by, status, remarks, created_at, updated_at) FROM stdin;
9e720ea8-c256-4372-9390-756d55fbf41c	aaaa0000-0000-0000-0000-000000000000	847317b8-1e43-48e9-b94a-a232f23a9adb	\N	Send technical architecture proposal	\N	2026-07-15 15:30:00+05:30	\N	bbbb0000-0000-0000-0000-000000000001	Pending	\N	2026-07-02 16:12:29.663902+05:30	2026-07-02 16:12:29.663902+05:30
\.


--
-- TOC entry 5691 (class 0 OID 25313)
-- Dependencies: 241
-- Data for Name: lead_journey; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_journey (id, tenant_id, lead_id, stage, status, started_at, completed_at, entered_by, remarks, created_at, updated_at) FROM stdin;
7b9467b3-a7c7-4164-b570-5e29b69e42d3	aaaa0000-0000-0000-0000-000000000000	847317b8-1e43-48e9-b94a-a232f23a9adb	Discovery	In Progress	2026-07-02 16:12:29.49+05:30	\N	bbbb0000-0000-0000-0000-000000000001	\N	2026-07-02 16:12:29.487973+05:30	2026-07-02 16:12:29.487973+05:30
\.


--
-- TOC entry 5682 (class 0 OID 25012)
-- Dependencies: 232
-- Data for Name: lead_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_notes (id, tenant_id, lead_id, author_id, content, created_at) FROM stdin;
\.


--
-- TOC entry 5696 (class 0 OID 25472)
-- Dependencies: 246
-- Data for Name: lead_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_requirements (id, tenant_id, lead_id, requirement, priority, complexity, approval_status, notes, created_by, created_at, updated_at, estimated_hours, approved, approved_by, approved_date, updated_by, remarks, assigned_developer_id, assigned_team) FROM stdin;
2bcbb6e3-0c40-48df-a86b-c8faddc0d250	aaaa0000-0000-0000-0000-000000000000	847317b8-1e43-48e9-b94a-a232f23a9adb	Complete UI modernization using React & Tailwind	High	Medium	Pending	\N	bbbb0000-0000-0000-0000-000000000001	2026-07-02 16:12:29.694474+05:30	2026-07-02 16:12:29.721011+05:30	130	t	bbbb0000-0000-0000-0000-000000000001	2026-07-02 16:12:29.72+05:30	bbbb0000-0000-0000-0000-000000000001	Client prefers Outfit typography	\N	\N
407fa020-d840-4dfe-ac05-c04a8103879b	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Build REST API integration	High	Medium	Pending	\N	bbbb0000-0000-0000-0000-000000000001	2026-07-02 17:27:46.999458+05:30	2026-07-02 17:27:46.999458+05:30	\N	f	\N	\N	\N	\N	\N	\N
8870d032-d7ee-48fe-b926-f9de68a1bb39	aaaa0000-0000-0000-0000-000000000000	cee38a8a-5c7a-4443-9a01-aa345f0a7611	brach	Low	Medium	Pending	brach	bbbb0000-0000-0000-0000-000000000001	2026-07-04 00:07:39.60335+05:30	2026-07-04 00:07:39.60335+05:30	23	f	\N	\N	\N	\N	\N	\N
28c1e36a-c064-4da2-a00d-f55f33bf2752	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	new module accounting need to create	High	Medium	Pending	new module accounting need to create	bbbb0000-0000-0000-0000-000000000001	2026-07-06 11:24:12.759485+05:30	2026-07-06 11:24:12.759485+05:30	30	f	\N	\N	\N	\N	37cae0a0-86b9-482a-83d3-19c7a4efd6b8	CRM Development
\.


--
-- TOC entry 5692 (class 0 OID 25343)
-- Dependencies: 242
-- Data for Name: lead_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_status_history (id, tenant_id, lead_id, old_status, new_status, changed_by, changed_at, remarks) FROM stdin;
fcad8eaf-1dd2-4c89-a06c-289b0319f745	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	New	Contacted	bbbb0000-0000-0000-0000-000000000001	2026-07-02 17:27:46.942467+05:30	Status updated
c9c439ca-9e73-441c-a175-2f838f0232b3	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	Contacted	Closed Won	bbbb0000-0000-0000-0000-000000000001	2026-07-02 17:27:47.124519+05:30	Status updated
2e69db35-749f-4d36-877a-a7bebc718f68	aaaa0000-0000-0000-0000-000000000000	47e2c8ba-9de9-4349-a39a-8d68f5c94f01	Contacted	Closed Won	bbbb0000-0000-0000-0000-000000000001	2026-07-03 11:47:03.568706+05:30	Status updated
ac610e6b-5f58-44a7-aee7-9e7c8667abe7	aaaa0000-0000-0000-0000-000000000000	53f1ea61-a503-4204-a0f3-b430a6896f0f	Contacted	New	bbbb0000-0000-0000-0000-000000000001	2026-07-04 09:56:16.343894+05:30	Status updated
03b5052e-ae99-4fb1-bed5-0b67e4f41c18	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	New	Contacted	bbbb0000-0000-0000-0000-000000000001	2026-07-04 10:23:01.016564+05:30	Status updated
43f8bd88-fd36-40c1-abd2-f904414b54d7	aaaa0000-0000-0000-0000-000000000000	c6a18598-e92d-4d4e-8ef2-9cd321a40495	New	Closed Won	09fdb157-d457-4d8d-94b4-4970fb339349	2026-07-04 12:18:39.288764+05:30	Status updated
293b7400-d5c4-4ac2-81c2-40ad09f21bd5	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Contacted	Negotiation	4bdeab3d-bcbd-4d39-9c88-555cfda88116	2026-07-04 15:18:29.844165+05:30	Status updated
241eebdc-80e7-4d2c-8154-2b0b1fafc01d	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Negotiation	Closed Lost	4bdeab3d-bcbd-4d39-9c88-555cfda88116	2026-07-04 15:24:00.687448+05:30	Status updated
6c3f5801-cbb9-4dcd-bd7e-0d42f9357e5e	aaaa0000-0000-0000-0000-000000000000	127ba296-3bd4-475e-a870-edb5e4616e79	Closed Lost	Closed Won	4bdeab3d-bcbd-4d39-9c88-555cfda88116	2026-07-04 15:24:57.332376+05:30	Status updated
6bfb05f7-8080-41c0-ac2a-3b476638e5c7	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	New	Closed Won	bbbb0000-0000-0000-0000-000000000001	2026-07-06 12:06:01.318149+05:30	Status updated
274c6e51-0350-47e8-8f43-e82fcbbcc1d8	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Closed Won	Negotiation	bbbb0000-0000-0000-0000-000000000001	2026-07-06 12:06:33.593916+05:30	Status updated
2369d6b3-9c0d-4adb-93fb-79f82f6ceba8	aaaa0000-0000-0000-0000-000000000000	c92e6920-01dd-4068-b453-0ae18c74ad56	Negotiation	Closed Lost	bbbb0000-0000-0000-0000-000000000001	2026-07-06 12:06:47.233164+05:30	Status updated
\.


--
-- TOC entry 5701 (class 0 OID 25603)
-- Dependencies: 251
-- Data for Name: lead_tag_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_tag_mapping (lead_id, tag_id, created_at) FROM stdin;
\.


--
-- TOC entry 5700 (class 0 OID 25586)
-- Dependencies: 250
-- Data for Name: lead_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_tags (id, tenant_id, tag_name, created_at) FROM stdin;
\.


--
-- TOC entry 5681 (class 0 OID 24979)
-- Dependencies: 231
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, tenant_id, branch_id, team_id, assigned_sales_id, name, company_name, contact_person, mobile, email, website, industry, address, country, city, lead_source, campaign, referral_name, advertisement, social_media, website_inquiry, budget, decision_maker, expected_start_date, business_need, project_type, lead_score, priority, expected_revenue, status, next_follow_up_date, reminder_notes, created_at, updated_at, deleted_at, assigned_sales_user_id) FROM stdin;
847317b8-1e43-48e9-b94a-a232f23a9adb	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000001	dddd0000-0000-0000-0000-000000000001	\N	Stabilization Rebuild Lead	StabCorp Ltd	Amit Stab	+919999988888	amit@stabcorp.com	stabcorp.com	Services	101 Stab Street	India	Mumbai	Website Inquiry	\N	\N	\N	\N	t	7000000.00	\N	2026-08-01	Complete platform migration	Custom Software	\N	High	6000000.00	New	2026-07-15	\N	2026-07-02 16:12:29.403368+05:30	2026-07-02 16:15:41.603846+05:30	2026-07-02 16:15:41.603846+05:30	bbbb0000-0000-0000-0000-000000000004
515f8fc9-68b8-4f38-a205-66a68fa506a7	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	\N	\N	Dashboard Test Lead 1783055642091	Antigravity Testing	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	High	150000.00	New	\N	\N	2026-07-03 10:44:02.109831+05:30	2026-07-03 10:44:02.182978+05:30	2026-07-03 10:44:02.182978+05:30	\N
127ba296-3bd4-475e-a870-edb5e4616e79	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	\N	\N	Greentech solution	\N	priya	1234567890	aditya@gmail.com	\N	\N	\N	\N	\N	Website Inquiry	green buisiness growth 2026	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	145000.00	Closed Won	\N	\N	2026-07-04 15:18:22.574881+05:30	2026-07-04 15:28:04.221499+05:30	2026-07-04 15:28:04.221499+05:30	\N
fb0ade2b-9606-43af-8dc2-d778f261d06b	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	249c05cc-3ab1-42e9-a85b-cf96733e63fb	\N	Modal Simulation Test	Test Corp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	\N	New	\N	\N	2026-07-02 17:34:00.768565+05:30	2026-07-03 10:45:32.919429+05:30	2026-07-03 10:45:32.919429+05:30	\N
e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	\N	\N	Audit Test Lead	AuditCorp	\N	9999999999	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	50000.00	\N	\N	\N	\N	\N	Medium	\N	Closed Won	\N	\N	2026-07-02 17:27:46.878683+05:30	2026-07-03 10:45:34.948759+05:30	2026-07-03 10:45:34.948759+05:30	\N
777ff4fa-98b7-4843-b8db-fb55c65da24e	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	\N	\N	Test Lead Fix	Test Corp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	\N	New	\N	\N	2026-07-02 17:19:40.767578+05:30	2026-07-03 10:45:37.003655+05:30	2026-07-03 10:45:37.003655+05:30	\N
34d70b72-1347-430a-b6b0-8d789d5a6707	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	\N	\N	Dashboard Test Lead 1783056366270	Antigravity Testing	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	High	150000.00	New	\N	\N	2026-07-03 10:56:06.28207+05:30	2026-07-03 10:56:06.348982+05:30	2026-07-03 10:56:06.348982+05:30	\N
47e2c8ba-9de9-4349-a39a-8d68f5c94f01	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	249c05cc-3ab1-42e9-a85b-cf96733e63fb	\N	test	Kosqu Software	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	548.00	Closed Won	\N	\N	2026-07-03 10:46:16.937175+05:30	2026-07-03 11:47:03.568706+05:30	\N	\N
b10fad76-7d88-474d-bd93-68001570fa4e	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	caa96296-6682-422e-8d6e-bf2f99eb2a73	\N	naya	apple	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	70000000.00	Contacted	\N	\N	2026-07-03 12:05:54.82073+05:30	2026-07-03 12:05:54.82073+05:30	\N	\N
b70e7b8d-51c4-494d-a148-118e4155b22f	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	2174be67-7333-448d-8a70-738571bdefbf	\N	test	Kosqu Software	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	23452.00	Contacted	\N	\N	2026-07-02 17:45:04.90614+05:30	2026-07-03 13:13:36.106317+05:30	2026-07-03 13:13:36.106317+05:30	\N
0cd6567c-a6f4-4aac-8eda-531a167d4956	aaaa0000-0000-0000-0000-000000000000	f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	9999ca29-d341-4d27-8fe1-dcd34ac6c785	\N	bob	Kosqu Software	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	2342.00	Negotiation	\N	\N	2026-07-03 13:25:01.244862+05:30	2026-07-03 13:25:01.244862+05:30	\N	\N
cee38a8a-5c7a-4443-9a01-aa345f0a7611	aaaa0000-0000-0000-0000-000000000000	f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	cf7bf8e3-e9ab-46a4-95d6-b031c2c30a77	\N	test	Kosqu Software	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	253.00	Contacted	\N	\N	2026-07-03 19:04:19.439131+05:30	2026-07-03 19:04:19.439131+05:30	\N	\N
53f1ea61-a503-4204-a0f3-b430a6896f0f	aaaa0000-0000-0000-0000-000000000000	f7330ad2-308b-482e-999d-587b405a875b	328f447e-c59d-4b34-9768-5f75a16cc9d0	\N	gupta sandwich	\N	robin	\N	robin@gmal.com	\N	\N	\N	\N	\N	Social Media	fair	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	253.00	New	\N	\N	2026-07-04 04:17:10.221458+05:30	2026-07-04 09:56:32.369517+05:30	\N	\N
455e5977-41cf-4d81-81c8-32e8ddb1bb76	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	a3bdf770-7e66-407b-b7f3-be348e708b51	\N	acme	\N	amit	+919209017621	amit@gmail.com	\N	\N	\N	\N	\N	Referral	fair	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	253.00	Contacted	\N	\N	2026-07-04 15:43:54.840691+05:30	2026-07-04 15:43:54.840691+05:30	\N	\N
9b9beb38-1db7-4a43-a592-9c21ba4032b3	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	a3bdf770-7e66-407b-b7f3-be348e708b51	\N	acme	\N	raj	+919209017621	raj@gmail.com	\N	\N	\N	\N	\N	Website Inquiry	adverticement	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	2500000.00	Contacted	\N	\N	2026-07-04 15:45:28.504104+05:30	2026-07-04 15:45:28.504104+05:30	\N	\N
c6a18598-e92d-4d4e-8ef2-9cd321a40495	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	a3bdf770-7e66-407b-b7f3-be348e708b51	\N	Greentech solution	\N	aarav  mehta	+919209017667	aarav.mehta@greentech.com	\N	\N	\N	\N	\N	Social Media	green buisiness growth 2026	\N	\N	\N	f	200000.00	priya	2026-07-19	asdfgh		\N	High	14500000.00	Closed Won	\N	\N	2026-07-04 11:17:00.124376+05:30	2026-07-06 10:21:19.057064+05:30	2026-07-06 10:21:19.057064+05:30	\N
c92e6920-01dd-4068-b453-0ae18c74ad56	aaaa0000-0000-0000-0000-000000000000	d3a62b2d-c688-4f9e-b04d-51c93873af57	f91138a6-7c58-4b6e-911c-7a7a3bc50832	\N	gupta sandwich	\N	robin	+911234567894	robin@gmail.com	\N	\N	\N	\N	\N	Referral	none	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	Medium	10000000.00	Closed Lost	\N	\N	2026-07-04 16:09:08.253321+05:30	2026-07-06 12:06:52.961074+05:30	\N	\N
67b662cd-bafa-43a9-a890-e8d9393a53ee	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	7ab717ca-adc7-4211-9826-fb1f36c3c52f	\N	HR portal	\N	Priya singh	\N	priya.singh@infosys.com	\N	\N	\N	\N	\N	Social Media	Q3  digital outreach	\N	\N	\N	f	200000.00	priya	2026-07-10	crm deployment	Website Development	\N	High	2500000.00	Contacted	\N	\N	2026-07-04 10:16:46.862186+05:30	2026-07-04 14:53:45.945965+05:30	2026-07-04 14:53:45.945965+05:30	\N
\.


--
-- TOC entry 5676 (class 0 OID 24844)
-- Dependencies: 226
-- Data for Name: login_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at, refresh_token_id, revoked_at, last_used_at) FROM stdin;
8fb6770b-3a29-4eed-b43b-2d3f3dc2ae36	bbbb0000-0000-0000-0000-000000000004	$2b$10$GT853DonJyasvzu.gK6eKOGaSDw6S/bceoObJa7Rjoz2KLdEWAFwi	::1	node	2026-07-08 16:50:26.041+05:30	2026-07-01 16:50:26.153832+05:30	\N	\N	\N
b368425f-c626-41c8-b9ce-d16a6f0cdaab	bbbb0000-0000-0000-0000-000000000001	$2b$10$NwrMXDmFVMXRv8uxWyt3X.tw.etnOGuFYxB6BpetLdMtjO/Xq7oRq	::1	PostmanRuntime/7.51.1	2026-07-08 17:10:37.533+05:30	2026-07-01 17:10:37.646767+05:30	\N	\N	\N
726dd114-a07d-4850-8004-b09d152a8470	bbbb0000-0000-0000-0000-000000000004	$2b$10$NqRz1/hC9P7wztwJnsxPwOSLCQOEJseohroqhcUS1d6eEKVFDNMKS	::1	PostmanRuntime/7.51.1	2026-07-08 17:10:44.375+05:30	2026-07-01 17:10:44.476992+05:30	\N	\N	\N
a1d25851-dae7-4195-92c0-0ee8f5b307ed	bbbb0000-0000-0000-0000-000000000001	$2b$10$0RiueCY3ghTNsxutazk9L.BxFa61pe9DXw2I3SZM7PDXqHDMg4ZEC	::1	node	2026-07-08 18:13:43.064+05:30	2026-07-01 18:13:43.161357+05:30	\N	\N	\N
ebc71c54-10ce-45e5-93fe-3530588386d5	bbbb0000-0000-0000-0000-000000000004	$2b$10$.aM/vBCDLVoHPR9Kui4Dmu1ClQp57Z7LdluKqHWfiih0sMGpveRqa	::1	node	2026-07-08 18:13:43.3+05:30	2026-07-01 18:13:43.398184+05:30	\N	\N	\N
9932237d-f82f-43a2-8819-79e93ee36678	bbbb0000-0000-0000-0000-000000000003	$2b$10$V6BpBklwPo9R515qaOrZKeICMneXI79SfuiHGRhINrnzosDr4lyu.	::1	node	2026-07-08 18:13:43.524+05:30	2026-07-01 18:13:43.634879+05:30	\N	\N	\N
ca959f85-c7e9-406f-8458-cecfacc43516	bbbb0000-0000-0000-0000-000000000001	$2b$10$6045qYT1CnTLbD57Ra9R9.iqSoLLk44d14hu4JEmieA/AQ/htLOYu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-08 21:02:53.509+05:30	2026-07-01 21:02:53.611035+05:30	\N	\N	\N
1e049972-cfd0-41a5-9108-3fbf27d6ac23	bbbb0000-0000-0000-0000-000000000001	$2b$10$OO4tdO8oCPD47Ibz0z8lweojoc4ABZoLILsC3aTFM/zQi.R3voHbO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-08 23:00:33.596+05:30	2026-07-01 23:00:33.998158+05:30	\N	\N	\N
5a44f785-e8b0-447b-a741-79bfc944b096	bbbb0000-0000-0000-0000-000000000001	$2b$10$g55sq2zdqb3PEFyaRWMySOJbpYO4X9Nb8kIwPFWySKghhJWakhb3m	::1	node	2026-07-08 23:37:48.296+05:30	2026-07-01 23:37:48.995009+05:30	\N	\N	\N
0e9e16d9-7f8b-4931-b753-6d78118053f7	bbbb0000-0000-0000-0000-000000000001	$2b$10$Be1z8HENy.2o1E8UyRIZ0eoQoZTM9OAbwyFaaQMgR2PDgvZMbFH5u	::1	node	2026-07-08 23:38:13.435+05:30	2026-07-01 23:38:13.924337+05:30	\N	\N	\N
ed5d14f5-f35b-44eb-bca4-7c3b659cd184	bbbb0000-0000-0000-0000-000000000001	$2b$10$ofAblJxsez0GmtiCk2nF/uiwZsQHKrRwJd.fp7.U72RdLrocOD3wu	::1	node	2026-07-08 23:43:41.674+05:30	2026-07-01 23:43:42.127112+05:30	\N	\N	\N
3bb75140-e6da-429c-bc27-502994365fe0	bbbb0000-0000-0000-0000-000000000001	$2b$10$OsVSc38pI4JzDQMb.VlioeOlOITbRO3rRM06DsV08OTvE.5bsnkuS	::1	node	2026-07-09 00:13:38.424+05:30	2026-07-02 00:13:38.860821+05:30	\N	\N	\N
922c2f2c-aca5-409f-bcff-9a32245509a9	bbbb0000-0000-0000-0000-000000000001	$2b$10$cq2BHWuf6Pe/lQSgX0YCJ.7JDNCNi2FcYhcEykXcT/Zjf4ieY7Tnm	::1	node	2026-07-09 00:13:39.608+05:30	2026-07-02 00:13:40.013349+05:30	\N	\N	\N
a81fc0a9-2c94-40a8-87f8-ebbcd2855aa2	bbbb0000-0000-0000-0000-000000000002	$2b$10$QIJGjnUNkHV.2FoXbxIAY.ireAlCcETf9ac7cEvY8g.q4qGtVDzDu	::1	node	2026-07-09 00:13:40.509+05:30	2026-07-02 00:13:41.119212+05:30	\N	\N	\N
e8719930-67ba-4252-bd74-9e87e2f941d2	bbbb0000-0000-0000-0000-000000000003	$2b$10$Z98NumZz6O41X3QeLjhaD.xWzBqAljYen5Bsv9v2NdWqqCv5xizeO	::1	node	2026-07-09 00:13:41.967+05:30	2026-07-02 00:13:42.425839+05:30	\N	\N	\N
87b86d73-3618-4c6c-a91a-ceaf7bfa9548	bbbb0000-0000-0000-0000-000000000004	$2b$10$6fY9ymXlYcJ9sYxiLzVn1uiIV8Rtmhdzt9M74HithRF7VGSXyqek6	::1	node	2026-07-09 00:13:42.848+05:30	2026-07-02 00:13:43.223143+05:30	\N	\N	\N
0c07be70-6f34-40b8-b639-974a708cca80	ad7dad47-4ee9-4426-8f2f-480ea872b979	$2b$10$dhHzTiqzvaMbp6KmUcsBUeEIhR9lwMFxZ6UJcUNm.EflxKGjDT91W	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 10:37:01.836+05:30	2026-07-02 10:37:01.930913+05:30	\N	\N	\N
e18bc2d7-5ea1-4209-9b4a-8c4682cd11e8	bbbb0000-0000-0000-0000-000000000001	$2b$10$4yQ9.POs1oQDAaviOT5UreHYAmTtiIKLrCpKR9JZsliGCfl37Onoi	::1	PostmanRuntime/7.51.1	2026-07-09 11:46:57.634+05:30	2026-07-02 11:46:57.739314+05:30	\N	\N	\N
fe1626c8-2ba2-40c9-9bf4-c3fd26f99d05	bbbb0000-0000-0000-0000-000000000001	$2b$10$yePIr9nxLt2/lQnxqHtZouhfedUSP1TVX7cLtpX8IEssGJ9xyZkGa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 12:05:55.077+05:30	2026-07-02 12:05:55.24228+05:30	\N	\N	\N
05bcd7c4-3ee0-42df-b9aa-b6efbc21372e	bbbb0000-0000-0000-0000-000000000001	$2b$10$OAZNNQDa6gjdEPpy4Cbqru4ef2zjBuaSp.sa2NteXzN7168GWW6CK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 12:22:58.502+05:30	2026-07-02 12:22:58.598282+05:30	\N	\N	\N
37ad290f-f193-4a5f-92e1-1d968b5ec30b	bbbb0000-0000-0000-0000-000000000001	$2b$10$klyZ7HGHwsIc2xpoiVkq3eFd5ZDJa1SGra0R7dWeyF1h5LLwyAuNm	::1	node	2026-07-09 15:00:03.52+05:30	2026-07-02 15:00:03.711341+05:30	\N	\N	\N
72b549f5-012e-4e6f-87e5-969aeff63be1	bbbb0000-0000-0000-0000-000000000002	$2b$10$QEHOcnTi5MuANyq0qiozve/TrsNxqwOq49yv7htHmJQY3UPF6uy.e	::1	node	2026-07-09 15:00:03.935+05:30	2026-07-02 15:00:04.090875+05:30	\N	\N	\N
54c62ed3-de5b-4c41-a5db-66e400c5a80f	bbbb0000-0000-0000-0000-000000000001	$2b$10$zvu9.EONK17FV4Zg4Z83du7WkzzE8pw8qeDkg5LUJFQeS68EwX4XS	::1	node	2026-07-09 15:00:40.989+05:30	2026-07-02 15:00:41.095802+05:30	\N	\N	\N
61a14a1d-f583-49ef-b3db-b6bcefae51d2	bbbb0000-0000-0000-0000-000000000002	$2b$10$NTYPDSUM0jJjaGjVQfVA4usTjJZw/vBI2slUQ4XNzUdDbY6dS1uaq	::1	node	2026-07-09 15:00:41.223+05:30	2026-07-02 15:00:41.327534+05:30	\N	\N	\N
633cde4e-85ca-4d77-8715-975adeeaaf7c	bbbb0000-0000-0000-0000-000000000003	$2b$10$YamQItJkkhDZyJK4XzqbrO.Jmd9HFKQnICSl/TQML5pNHJSm568U.	::1	node	2026-07-09 15:00:41.425+05:30	2026-07-02 15:00:41.520922+05:30	\N	\N	\N
9b79f333-70c5-4bb7-9f9f-7b91a2ea645f	bbbb0000-0000-0000-0000-000000000004	$2b$10$2J51D7F4qmoOiLN4m0/Ewe7.V7kui0Mq7bjFXTUZxuImMQOXv0Oge	::1	node	2026-07-09 15:00:41.626+05:30	2026-07-02 15:00:41.718103+05:30	\N	\N	\N
895c4d03-79dd-4aa7-8aae-955228d55784	bbbb0000-0000-0000-0000-000000000001	$2b$10$0h83QDitFPY7gWqL8JazGua/anoCgud1Lcyqy42ybU6pt6fA1KdLS	::1	node	2026-07-09 15:01:11.438+05:30	2026-07-02 15:01:11.53849+05:30	\N	\N	\N
74f2970e-5003-4dc2-9cb5-abced7b19a32	bbbb0000-0000-0000-0000-000000000002	$2b$10$8ROzzRPBFQRK.aGfwVOWB.HfK1kUrpk.wGI3ewU25OamBUv6TF.3O	::1	node	2026-07-09 15:01:11.669+05:30	2026-07-02 15:01:11.772118+05:30	\N	\N	\N
50f8d2b3-334d-4f44-821c-ad1d5166ad7e	bbbb0000-0000-0000-0000-000000000003	$2b$10$J8hycykPyCxTNGykn9N.7u.FOnaRlEq.ri5bO4Zp155JCOfEpdKEO	::1	node	2026-07-09 15:01:11.882+05:30	2026-07-02 15:01:11.981097+05:30	\N	\N	\N
e43ca18d-36b7-43f4-80d8-037ead3ecb71	bbbb0000-0000-0000-0000-000000000004	$2b$10$RkJcdKZdnFatJ3yLIRm7p.yrRI7cIns0EOk862qZhxEFVDQmC5IO2	::1	node	2026-07-09 15:01:12.079+05:30	2026-07-02 15:01:12.171534+05:30	\N	\N	\N
33ddef3d-36bd-4fb7-a924-7a8c8b630dfc	bbbb0000-0000-0000-0000-000000000001	$2b$10$Agi0G68bQKnuQelzM41bJurfVNW6.KhgVZYHWlhZaWv0TruxzSkY.	::1	node	2026-07-09 15:01:33.94+05:30	2026-07-02 15:01:34.040374+05:30	\N	\N	\N
6e38c617-a1c5-44fa-9401-f19fe6cd91c1	bbbb0000-0000-0000-0000-000000000002	$2b$10$ru46bMdDTDkFHxy/P1Iuy.Ls/tVIms4xAwvMMgfAQHgcRPGCLRM0m	::1	node	2026-07-09 15:01:34.175+05:30	2026-07-02 15:01:34.278932+05:30	\N	\N	\N
82f057a7-5d6b-406d-9b3d-4fcee4512dab	bbbb0000-0000-0000-0000-000000000003	$2b$10$4djiqc47eYfgNDlZgLk07uT8EWiHOsiMjPYRBLqBb2Z35zHN78aQi	::1	node	2026-07-09 15:01:34.384+05:30	2026-07-02 15:01:34.481666+05:30	\N	\N	\N
90ab1b94-09c4-467d-ba5f-7b0662822aa7	bbbb0000-0000-0000-0000-000000000004	$2b$10$GtDKqTGwt5ZoV/HPIepO2u2hifLQ3EkyDwyvCrBeuTeHJuiHvD5iG	::1	node	2026-07-09 15:01:34.581+05:30	2026-07-02 15:01:34.672219+05:30	\N	\N	\N
7105c505-ce41-4de8-b678-9bafc5b51a1e	bbbb0000-0000-0000-0000-000000000001	$2b$10$edP.p1oxDsxRkYo8F3.DY.RGPGSfZ4UaV2QTgtx9GBeVHzpCae3g2	::1	node	2026-07-09 15:02:07.824+05:30	2026-07-02 15:02:07.927724+05:30	\N	\N	\N
7c1345f5-eef6-4e74-a9bf-c812e714f764	bbbb0000-0000-0000-0000-000000000002	$2b$10$t9nuuK5UKTLXOF/0WiSm1OctzyuQV/dm5xhxr/MA0.armDoNd8coy	::1	node	2026-07-09 15:02:08.058+05:30	2026-07-02 15:02:08.163814+05:30	\N	\N	\N
9d61d266-08e5-4756-a09f-98f5c47b8510	bbbb0000-0000-0000-0000-000000000003	$2b$10$4eb7ymCjM3ckZHnbfmyPHuEZAXuEu6dPqCBE4rRe.kYDAaoTzybDe	::1	node	2026-07-09 15:02:08.268+05:30	2026-07-02 15:02:08.369956+05:30	\N	\N	\N
c06df869-3460-46a5-8fb5-cfed71affb46	bbbb0000-0000-0000-0000-000000000004	$2b$10$6WnfQ6E7iGCWdvssOLxkceYXou9hJnjrCh98jTSILe5ZHFoAIdLiS	::1	node	2026-07-09 15:02:08.468+05:30	2026-07-02 15:02:08.563961+05:30	\N	\N	\N
1ef6db31-8ce3-4ef3-bd09-8728901a15bb	bbbb0000-0000-0000-0000-000000000001	$2b$10$YudFBv0ntO5iSAR/pqOOq.6FiUAYs0c2bLbVdEd0EmKoTE5nG6fXu	::1	node	2026-07-09 15:03:30.411+05:30	2026-07-02 15:03:30.519515+05:30	\N	\N	\N
9c9c44cd-8295-4102-91a6-75c3b537ba92	bbbb0000-0000-0000-0000-000000000002	$2b$10$Q0Gc6fMdvQfS.oekgThOEukmsAkki3ByH/eyq2VJKGb4x1QlJxuR.	::1	node	2026-07-09 15:03:30.653+05:30	2026-07-02 15:03:30.75503+05:30	\N	\N	\N
4eb182fe-8999-425d-ba03-a4c90134815a	bbbb0000-0000-0000-0000-000000000003	$2b$10$g35AEMZEFAmvQAUtSjocze/1UTRYFK2.eBXNHEid1qn7SZbGXl3g6	::1	node	2026-07-09 15:03:30.859+05:30	2026-07-02 15:03:30.961016+05:30	\N	\N	\N
53b6ed34-39be-40f4-a29b-8feeba43d06a	bbbb0000-0000-0000-0000-000000000004	$2b$10$PszGoGNE7rg9LZihU7Q4Guz7QVBTPMuNyy1WeM5gt5nZYumo0zxz.	::1	node	2026-07-09 15:03:31.062+05:30	2026-07-02 15:03:31.160539+05:30	\N	\N	\N
a80b0ec0-e5a3-4601-9608-b8d2655435b5	bbbb0000-0000-0000-0000-000000000001	$2b$10$ys1Eg91sAhbR9Q4pZuocIuhmXojeRXogq41anMoqFFbbmBwhT5fr.	::1	node	2026-07-09 15:03:53.675+05:30	2026-07-02 15:03:53.78005+05:30	\N	\N	\N
eb551fd1-72a5-4589-8783-320dc782eafe	bbbb0000-0000-0000-0000-000000000002	$2b$10$0fOd4VtKj8uI8TYlJMuoXOlAMcu8VSsWGbqbRpY6b8yztH32/DaFK	::1	node	2026-07-09 15:03:53.921+05:30	2026-07-02 15:03:54.022766+05:30	\N	\N	\N
3ffa5a91-dd7b-4c27-82ca-efeceb7a3d43	bbbb0000-0000-0000-0000-000000000003	$2b$10$953Zzbx5W7qDK/DKpwVgOuImnhTTeFho2r084cXkm34x3k5Zf2gEi	::1	node	2026-07-09 15:03:54.127+05:30	2026-07-02 15:03:54.224408+05:30	\N	\N	\N
ff6dce7d-026f-40aa-acfb-aa5276607ac2	bbbb0000-0000-0000-0000-000000000004	$2b$10$R654BnJ05DLn.JQFhkh8gefN4R7B9VNhW.MBwXAre6bGxIPTM/q0C	::1	node	2026-07-09 15:03:54.33+05:30	2026-07-02 15:03:54.422608+05:30	\N	\N	\N
a9de04a2-449a-4330-ba72-e568e7027724	bbbb0000-0000-0000-0000-000000000001	$2b$10$bfqh36adgKLsbN2bGkpnKuLGYxEKU0vLD7VojcWp6oLA7ajGZTX8m	::1	node	2026-07-09 15:13:03.571+05:30	2026-07-02 15:13:03.745472+05:30	\N	\N	\N
2cceb092-d3b4-4e8a-9d5e-1100c300af7c	bbbb0000-0000-0000-0000-000000000003	$2b$10$Dm8mSCCJapzN8AtBmBynreqUYlqo8XiHiDgorB6fhymMFHuidNgHG	::1	node	2026-07-09 15:13:03.935+05:30	2026-07-02 15:13:04.058958+05:30	\N	\N	\N
7b8659d3-79cf-42ec-9b86-85c8dca58f29	bbbb0000-0000-0000-0000-000000000004	$2b$10$XGg7sLuVQy99CKR/LTF3G.FMowLkvJhKFblOBMD9jr2frEq9wJ.2u	::1	node	2026-07-09 15:13:04.187+05:30	2026-07-02 15:13:04.288576+05:30	\N	\N	\N
9985020b-eb44-4b17-9bee-6aded1885664	bbbb0000-0000-0000-0000-000000000001	$2b$10$.IEQx4LM4vgBUw9zQzeltOLYFjVc6fISEZT7ywSJgSOfYIVin2RLO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:04:14.818+05:30	2026-07-04 03:04:15.469151+05:30	\N	\N	\N
97cd91bc-c2ec-403e-bbec-de4dc3bc9bca	bbbb0000-0000-0000-0000-000000000001	$2b$10$SJ1zv9fPKRSb63SaO6VsduGizBALm1JFEZzmbSeGK9zwGTJKtZtSe	::1	node	2026-07-09 15:13:18.546+05:30	2026-07-02 15:13:18.657584+05:30	\N	\N	\N
bc340fd2-59d3-4bc9-8327-9104229e3a63	bbbb0000-0000-0000-0000-000000000002	$2b$10$hJqz9mDRvTdtZf4lPrO/AeZpTPpFNOY2495iicDoujsGqk1Pwvkwy	::1	node	2026-07-09 15:13:18.871+05:30	2026-07-02 15:13:19.008361+05:30	\N	\N	\N
1f817920-c4a6-42be-9a1a-42f7c58813c4	bbbb0000-0000-0000-0000-000000000003	$2b$10$DuvLDaGX67.tXGln1ZvmnexPum7OCRTGlm0gSqOW9zz8rQsV9j5Q.	::1	node	2026-07-09 15:13:19.138+05:30	2026-07-02 15:13:19.26634+05:30	\N	\N	\N
05319322-70fc-4ca6-b087-5c0b8c706417	bbbb0000-0000-0000-0000-000000000004	$2b$10$O4shFDFKxdvloO3tLglA7.izlpZGUtC.B/pmZ29NmRcXiH9jk9WN6	::1	node	2026-07-09 15:13:19.4+05:30	2026-07-02 15:13:19.513736+05:30	\N	\N	\N
efd6b6bb-7ecb-4dac-abd3-27358b17cc3b	bbbb0000-0000-0000-0000-000000000001	$2b$10$qiOjLDSLbwWrUmfh1p9fcux4nwCQvTzjIKXzIJJyxh3RTCIAvHCgq	::1	node	2026-07-09 15:20:04.498+05:30	2026-07-02 15:20:04.614087+05:30	\N	\N	\N
af676fdc-c7b5-4f58-952c-56845efcc888	bbbb0000-0000-0000-0000-000000000003	$2b$10$ksHb9xI/7npMriHgnbl6aeuhz0AwI9xSdkT9rk4Ywta/ABU4TIu.W	::1	node	2026-07-09 15:20:04.772+05:30	2026-07-02 15:20:04.880103+05:30	\N	\N	\N
970a0917-f000-4b47-a1e8-0d2daa619e55	bbbb0000-0000-0000-0000-000000000004	$2b$10$fUhgeNfOyogRDdET.eWHLu8oS6TTSR2YqsGm17uyCdR1pXSrBStJy	::1	node	2026-07-09 15:20:05.005+05:30	2026-07-02 15:20:05.117953+05:30	\N	\N	\N
3d055199-a9d0-47ca-a496-cd5514ace811	bbbb0000-0000-0000-0000-000000000001	$2b$10$GBVDAUOhIFm5L.aUAixDX.7/qk0iWhnqjSLuguGoiDAB90tCYe39u	::1	node	2026-07-09 15:20:46.272+05:30	2026-07-02 15:20:46.382322+05:30	\N	\N	\N
8a206b97-f6dd-4adb-afbf-9fe741d7ddd2	bbbb0000-0000-0000-0000-000000000003	$2b$10$95/bFvzSXgRg7StNRcXA2uTH3X41voAZYzGFL4icBPzNNNyj1Cjty	::1	node	2026-07-09 15:20:46.531+05:30	2026-07-02 15:20:46.642976+05:30	\N	\N	\N
6384a9d6-cf17-443a-a2fa-3d7a282213a6	bbbb0000-0000-0000-0000-000000000004	$2b$10$28vVyXVkhI/RMV5Nrd5JcOkiAB5fXDsGHw888dZzO0H6n6N.mgjTq	::1	node	2026-07-09 15:20:46.763+05:30	2026-07-02 15:20:46.868257+05:30	\N	\N	\N
63b6b7c9-774a-4356-8b3d-6aa4eade9da4	bbbb0000-0000-0000-0000-000000000001	$2b$10$rWldTqv9ggesj5v0hOMmo.DXbbnfMUGGNv8O7qqMrkRMGFmVUsnvi	::1	node	2026-07-09 15:20:59.665+05:30	2026-07-02 15:20:59.778917+05:30	\N	\N	\N
e80e18ab-41da-4e58-befc-54b0f654e5c4	bbbb0000-0000-0000-0000-000000000002	$2b$10$cSauz5Nw853FHSnzImSMYOCXasdJR1ViR.G.dt67/5c7Vgx58ALQO	::1	node	2026-07-09 15:20:59.933+05:30	2026-07-02 15:21:00.05221+05:30	\N	\N	\N
b61a30c9-1d84-426b-aff9-108f068a7a69	bbbb0000-0000-0000-0000-000000000003	$2b$10$AKksqhxJtN66zOBovn.oPuNbu00fEyy2bDBpnQr86SwrIPighjJba	::1	node	2026-07-09 15:21:00.174+05:30	2026-07-02 15:21:00.276716+05:30	\N	\N	\N
4992b6ec-f211-4fb6-9237-083e141f72fa	bbbb0000-0000-0000-0000-000000000004	$2b$10$PlMDMPYbnr6SIcfMKNX20uw301UfP2uaTJv5030oGl.COfr1KMEmq	::1	node	2026-07-09 15:21:00.395+05:30	2026-07-02 15:21:00.499314+05:30	\N	\N	\N
b0f7e031-835e-491d-ad8f-262b76535f10	bbbb0000-0000-0000-0000-000000000001	$2b$10$l1HIVKI.JTz9TgnZkjA4VO/YhNQy4vTOo.mDCE0FEiIbGmdioMlZ.	::1	node	2026-07-09 15:28:21.858+05:30	2026-07-02 15:28:21.962578+05:30	\N	\N	\N
fdf6df29-bf67-4e9a-b539-6adf9088c100	bbbb0000-0000-0000-0000-000000000003	$2b$10$DTP02vPmwVbIU5sny78ofeRt59CCxw0KGOvlrFGEdwE5YNghfuR86	::1	node	2026-07-09 15:28:22.14+05:30	2026-07-02 15:28:22.238371+05:30	\N	\N	\N
26eba2d9-44ef-4494-aeb9-d61e9639d1a8	bbbb0000-0000-0000-0000-000000000004	$2b$10$CY883GhJIrs0e0WVyLeak.65TzzaCS4H8NjT0dSzQTzPbWrJb/5Wy	::1	node	2026-07-09 15:28:22.348+05:30	2026-07-02 15:28:22.439846+05:30	\N	\N	\N
32920281-19f8-41d7-9c6c-10401423b5f6	bbbb0000-0000-0000-0000-000000000001	$2b$10$0O2SS.WBmytThqXkMXa9ROqKfQCfIabwmCoURJuipuaxbNhmFEgHW	::1	node	2026-07-09 15:28:35.961+05:30	2026-07-02 15:28:36.063126+05:30	\N	\N	\N
5c926895-facf-40e5-af13-197a55f9e9c9	bbbb0000-0000-0000-0000-000000000003	$2b$10$P8XiGt6/53FyPorkWtnIuu6b88Ms0IgjJGTMGVSvQXofQ1965pgle	::1	node	2026-07-09 15:28:36.215+05:30	2026-07-02 15:28:36.312228+05:30	\N	\N	\N
4326bd15-09b8-4ef9-88d0-8d1e857a7a77	bbbb0000-0000-0000-0000-000000000004	$2b$10$3pZactEuw1Zf/caOa0oznu3Fw5gnYYheAraWz/8q.4GQInAH3GGqW	::1	node	2026-07-09 15:28:36.431+05:30	2026-07-02 15:28:36.527527+05:30	\N	\N	\N
d9d5a580-e2b8-4a93-8170-6e93b60cf45f	bbbb0000-0000-0000-0000-000000000001	$2b$10$9NtwxXFqOZtA.6MB56SkQupQ1UE.9aePkPtfy9MPZVSN5jLZmFgXu	::1	node	2026-07-09 15:28:46.345+05:30	2026-07-02 15:28:46.447502+05:30	\N	\N	\N
d66cec8f-a7d4-4a19-9786-97e62141dbf8	bbbb0000-0000-0000-0000-000000000003	$2b$10$58vcM1wry/w/NWR6b4Z5NeWf0nN0Lj5mvIjFTfbmDKSLVC00aMpNe	::1	node	2026-07-09 15:28:46.586+05:30	2026-07-02 15:28:46.682433+05:30	\N	\N	\N
617521e5-4839-4236-a8ac-bf6ebb7b316c	bbbb0000-0000-0000-0000-000000000004	$2b$10$ph0RmGkJaybafzhVM5cQ8.UVPHpmD62knXKOEmF7csCyOHFaI47k.	::1	node	2026-07-09 15:28:46.793+05:30	2026-07-02 15:28:46.888495+05:30	\N	\N	\N
96410297-a10e-4a29-9eee-1921ea9625b0	bbbb0000-0000-0000-0000-000000000001	$2b$10$cscnpx/N.xuvAQFYzKYEJeq08LRCSNyQSG7oD3YIz02CAr2xLu/Xa	::1	node	2026-07-09 15:29:05.818+05:30	2026-07-02 15:29:05.930092+05:30	\N	\N	\N
786f3cf5-5183-4d48-90b4-1dc8762ce468	bbbb0000-0000-0000-0000-000000000003	$2b$10$vwy4wqcu2myxKQyrWPsfJeIX2l.YRHfLCPrQSXI8MmnhCwQclSp2i	::1	node	2026-07-09 15:29:06.077+05:30	2026-07-02 15:29:06.178754+05:30	\N	\N	\N
b120f274-e3df-4690-bd78-f278fa8b9a2c	bbbb0000-0000-0000-0000-000000000004	$2b$10$Vv98L/lWsyMJ2dD/CPtRI.4A./bnmqpsCwS5si7YbGbaRMi2QKTI2	::1	node	2026-07-09 15:29:06.301+05:30	2026-07-02 15:29:06.405212+05:30	\N	\N	\N
75ad292e-3db6-47e6-a7b5-9dc5ed558f9e	bbbb0000-0000-0000-0000-000000000001	$2b$10$c28D3FLJuKl2iGCMfxaJ/ubleFBKgwEeOBm96TLVoWKvh8.axPzgW	::1	node	2026-07-09 15:29:18.425+05:30	2026-07-02 15:29:18.529916+05:30	\N	\N	\N
44c417cb-259d-4962-bd85-ebae178501e7	bbbb0000-0000-0000-0000-000000000002	$2b$10$sqWj1V2aPkjVTj/u8qdQTuRrJE8/U9l8dtPKFCk8tQPOQJKEq.jme	::1	node	2026-07-09 15:29:18.666+05:30	2026-07-02 15:29:18.763246+05:30	\N	\N	\N
5253f845-3f39-499a-ae2f-4bc2e965180d	bbbb0000-0000-0000-0000-000000000003	$2b$10$7lEwGzj/nt0WLtlk84/QTO411j7Nxgplaw.CFX9qkIu8TylNSIvX2	::1	node	2026-07-09 15:29:18.874+05:30	2026-07-02 15:29:18.969343+05:30	\N	\N	\N
90659c2a-f782-4c36-be40-ee9484987176	bbbb0000-0000-0000-0000-000000000004	$2b$10$C/V/XnXbIF.allPxphGrOOLq76CQp0bpr1dZUD.OzLggYBxrBCe.2	::1	node	2026-07-09 15:29:19.088+05:30	2026-07-02 15:29:19.183107+05:30	\N	\N	\N
38452d5b-e194-4d70-b3dc-dd69b0386092	bbbb0000-0000-0000-0000-000000000001	$2b$10$MKMTSWBgeTjYfkDNemo0yuqGRvm5CsyWkjiuAvjdpLThVhj9/h8HG	::1	node	2026-07-09 15:42:18.934+05:30	2026-07-02 15:42:19.043561+05:30	\N	\N	\N
14ab15bf-4abf-45c8-8545-8dc8abada778	bbbb0000-0000-0000-0000-000000000003	$2b$10$zg7JUoNRoNjGw3acZm/iF.WXgA/QZRQ66MH8nbkpEKCMPoytsqfSq	::1	node	2026-07-09 15:42:19.177+05:30	2026-07-02 15:42:19.278122+05:30	\N	\N	\N
78d87dd9-8893-410e-b2cb-69fb9ea30440	bbbb0000-0000-0000-0000-000000000004	$2b$10$ZWz/4ZxoXldPAlwI14iieO7g6nmKwOYwAUf8H9pIQfK0sPnU1Q1Xy	::1	node	2026-07-09 15:42:19.383+05:30	2026-07-02 15:42:19.481877+05:30	\N	\N	\N
4b23eb0e-2d81-4bb0-aed0-6d2efbe73a34	bbbb0000-0000-0000-0000-000000000001	$2b$10$u6vKJUmas3RbnKmfQFfbKOte1.vRW6JjtGUsf3AJGvvU6R7XYBO1G	::1	node	2026-07-09 15:42:37.969+05:30	2026-07-02 15:42:38.063979+05:30	\N	\N	\N
58e7eca8-5661-40d0-8e78-a29c02685af0	bbbb0000-0000-0000-0000-000000000003	$2b$10$3DRBTL1mDytRzHQUn.V2yeFqH6PRC9FZf.n8C3/yD6ZrYx/38LyhO	::1	node	2026-07-09 15:42:38.19+05:30	2026-07-02 15:42:38.287407+05:30	\N	\N	\N
bfc818e7-ff30-4ff5-aecc-5cbf3e7a2db6	bbbb0000-0000-0000-0000-000000000004	$2b$10$proP6GEDzFSLBbe/OimewOihJT/fqX5ruR7UnMS69skrk2PviKh.S	::1	node	2026-07-09 15:42:38.391+05:30	2026-07-02 15:42:38.486777+05:30	\N	\N	\N
025f69c1-6cbb-42a5-a66d-4b93b9cfa3fe	bbbb0000-0000-0000-0000-000000000001	$2b$10$.texE7osjujuD0lUy68wz.Lym8lGWhw10.CPCYAajw.ROHG2k6nWu	::1	node	2026-07-09 15:43:31.72+05:30	2026-07-02 15:43:31.818667+05:30	\N	\N	\N
b6346500-5587-4352-b691-9444f9374639	bbbb0000-0000-0000-0000-000000000003	$2b$10$tOBRBfcjzwS7AGpZrok/veuF36iUu2I4hx75LLV/ypNdql/FVBueO	::1	node	2026-07-09 15:43:31.951+05:30	2026-07-02 15:43:32.047223+05:30	\N	\N	\N
0199ca5e-70c2-438b-80e0-36071cc13a61	bbbb0000-0000-0000-0000-000000000004	$2b$10$DsWeHNY2/wYVHAEPHqi3deze374vmcWhLsRaoPEMBlnJwr0sZGlL.	::1	node	2026-07-09 15:43:32.149+05:30	2026-07-02 15:43:32.243284+05:30	\N	\N	\N
5ff22dc7-5042-4df9-a638-26abe68a7bd6	bbbb0000-0000-0000-0000-000000000001	$2b$10$tEeDWJ3lr3gzEtKiibx89uVMlYJByMAT5SzcW82TLft9P0GqZ3eou	::1	node	2026-07-09 15:45:24.777+05:30	2026-07-02 15:45:24.877547+05:30	\N	\N	\N
f1737bb3-bce3-48ff-b035-871a616cb854	bbbb0000-0000-0000-0000-000000000003	$2b$10$fCl0Qx4F74TUVIXRRxWZyOWYCgP03bnyvNju2BywsIUbfXtlx.78q	::1	node	2026-07-09 15:45:25.011+05:30	2026-07-02 15:45:25.106715+05:30	\N	\N	\N
0dccebce-2a89-4381-9bc3-d9cc75bb59fe	bbbb0000-0000-0000-0000-000000000004	$2b$10$FxqWn2hh582GEUYIfRs4Oe1MLAfPNl27U03UtlBysxkt6NyOmi64u	::1	node	2026-07-09 15:45:25.215+05:30	2026-07-02 15:45:25.306105+05:30	\N	\N	\N
253c6e38-b936-421a-a8b6-507b7a6dd9c8	bbbb0000-0000-0000-0000-000000000001	$2b$10$4jDw8FfMGoemZDBkci1DUuqSAXMxkjXGyBEQXbMRgYDyNL8TR.e8m	::1	node	2026-07-09 15:45:54.161+05:30	2026-07-02 15:45:54.264691+05:30	\N	\N	\N
eca8b880-1277-4c3a-b9b3-1a4201fe6ee2	bbbb0000-0000-0000-0000-000000000003	$2b$10$yt5y0ngvghq78Q2BHkcaR.T7Zhp1bnuKQnvYDkLPU98Vb/FFiY8yy	::1	node	2026-07-09 15:45:54.394+05:30	2026-07-02 15:45:54.487449+05:30	\N	\N	\N
9bcfa47a-c0b9-486b-844a-4841089e930c	bbbb0000-0000-0000-0000-000000000004	$2b$10$gprJM.tTmSDyLLL4f49.KO057lxghBUqbecS80uhCBeAKEcPdM7bK	::1	node	2026-07-09 15:45:54.593+05:30	2026-07-02 15:45:54.686324+05:30	\N	\N	\N
3c36d6b0-db9c-4d49-bb55-77220e7d04d9	bbbb0000-0000-0000-0000-000000000001	$2b$10$K91U9DkiXkZFYeGL1ktZSuzKd0Pjeu9xk03xrpgTJU.k4a7KS4SCS	::1	node	2026-07-09 15:46:03.756+05:30	2026-07-02 15:46:03.859317+05:30	\N	\N	\N
77dd867f-b129-4f2d-8a21-7dbf7d494b4f	bbbb0000-0000-0000-0000-000000000003	$2b$10$eWBF4KRA6L9HbjtisKsawOAzXkI0xEnX/YFXHwbtQRjEbGFZqCs06	::1	node	2026-07-09 15:46:04.009+05:30	2026-07-02 15:46:04.1228+05:30	\N	\N	\N
120cc928-c76b-4a89-9fe0-b2156273d575	bbbb0000-0000-0000-0000-000000000004	$2b$10$uYgrWGWGtsbLEBg46z.pKOVaJgXaC4O3NC0uBsaKBqleGAtsJd4Wm	::1	node	2026-07-09 15:46:04.226+05:30	2026-07-02 15:46:04.324268+05:30	\N	\N	\N
4e0e800c-7bfb-4275-a6dd-ae8653d5181d	bbbb0000-0000-0000-0000-000000000001	$2b$10$PbKOVMmc4i50hmzvPIYE2ukfzyEzMym6nnAKnUdRzJQH1MEsYLtnK	::1	node	2026-07-09 15:46:55.514+05:30	2026-07-02 15:46:55.61509+05:30	\N	\N	\N
cb3f4dbd-3048-468a-b2b8-1159c95710d7	bbbb0000-0000-0000-0000-000000000003	$2b$10$IMYF8XRFT87gYEQgQWLsHulxtmkoXmI2WuKpAFxEA8jUxvdmCqGI.	::1	node	2026-07-09 15:46:55.749+05:30	2026-07-02 15:46:55.91091+05:30	\N	\N	\N
0a600749-adf6-4a16-bca2-5ba9ae548ed6	bbbb0000-0000-0000-0000-000000000004	$2b$10$C.SehmR092iVwCemKEn/y.CtDa/I0bw4kLEXtBtTL6bPq3rhlm7V6	::1	node	2026-07-09 15:46:56.036+05:30	2026-07-02 15:46:56.135843+05:30	\N	\N	\N
f972f6eb-42a7-4ef2-a4c4-6b2ffc45fb61	bbbb0000-0000-0000-0000-000000000001	$2b$10$4lgVQTvu7NC2ToK2AdcUuOWdEBZHiO7FaKaVHB4gGfrLCeTfaIA/e	::1	node	2026-07-09 15:47:09.156+05:30	2026-07-02 15:47:09.25979+05:30	\N	\N	\N
6e35c620-1b7f-40f2-aa80-27e23eda83d8	bbbb0000-0000-0000-0000-000000000003	$2b$10$Cv/g79A9O0rasdeinByvae7ErITmeZQLGQNbIYjstw1bxzEjjmGZe	::1	node	2026-07-09 15:47:09.389+05:30	2026-07-02 15:47:09.486764+05:30	\N	\N	\N
708f6210-e0ae-4491-9144-dfcde9479e96	bbbb0000-0000-0000-0000-000000000004	$2b$10$f0ygf7QUZpgPJdaKVLKz5.gyNyjqGsE3k4wmS2f7ZS.I65ppmsdT2	::1	node	2026-07-09 15:47:09.588+05:30	2026-07-02 15:47:09.681411+05:30	\N	\N	\N
3e0d8b21-c52e-47d7-abf2-9f8d3c354305	bbbb0000-0000-0000-0000-000000000001	$2b$10$38EfkXdYgdJylE8sPhWKaO90Wu/FYaRZLtvcz/guS5m3sKHhpZh3W	::1	node	2026-07-09 15:49:06.885+05:30	2026-07-02 15:49:06.988311+05:30	\N	\N	\N
f9a4fd79-2992-474b-8345-372a87a0e222	bbbb0000-0000-0000-0000-000000000003	$2b$10$hUkq3naLDjLo0n0pa7chX.hur1/k9P187tKlrmQf6qlahJKdzEkGK	::1	node	2026-07-09 15:49:07.136+05:30	2026-07-02 15:49:07.23366+05:30	\N	\N	\N
aeb6f164-1c8e-4e28-9077-5ce3d238d81e	bbbb0000-0000-0000-0000-000000000004	$2b$10$MDfAnz4HmvFkuuRQPLjLCeMKVXhcabYk.aveq8b4Cua8pkG0PiBnO	::1	node	2026-07-09 15:49:07.339+05:30	2026-07-02 15:49:07.433781+05:30	\N	\N	\N
f4c1245f-f7fc-452f-80a9-f1ec4ead92ed	bbbb0000-0000-0000-0000-000000000001	$2b$10$D5N40RFFQR/rCemmt6Vvhuw6rQNoyxerc.cFqu/Ay5KeWmDBSe1um	::1	node	2026-07-09 15:58:12.103+05:30	2026-07-02 15:58:12.20529+05:30	\N	\N	\N
b8aed98d-15d1-47e9-9f3b-0d164ebec203	bbbb0000-0000-0000-0000-000000000003	$2b$10$nwvMSdwkLwwgFGeht1dGR.K5OJvU5Qv2Jcy46ukXAWOfumfn4CJvG	::1	node	2026-07-09 15:58:12.344+05:30	2026-07-02 15:58:12.441804+05:30	\N	\N	\N
b8e0bf9c-2884-4958-b6c5-7973fbce7014	bbbb0000-0000-0000-0000-000000000004	$2b$10$LF1OgRJULWzZeE5ZtvcTxuBTAPONCwZASz5rHd3FCs7CBT5Gi0B.K	::1	node	2026-07-09 15:58:12.553+05:30	2026-07-02 15:58:12.646585+05:30	\N	\N	\N
57a9fabd-0e00-4f5d-8234-0c780f73de97	bbbb0000-0000-0000-0000-000000000001	$2b$10$.AQSp0H8RNn8ydZ9G1lg9.v7utJfVLhosUheEZzVTdOjn6AZTZCR2	::1	node	2026-07-09 16:00:23.613+05:30	2026-07-02 16:00:23.707617+05:30	\N	\N	\N
36927163-aa17-46e9-8c3e-c3e4c56d0795	bbbb0000-0000-0000-0000-000000000003	$2b$10$O1VS220xH2TD/VAb.dxiiOlXVpL8nu.qVsXPlZqiia8sWGMMuXY0m	::1	node	2026-07-09 16:00:23.838+05:30	2026-07-02 16:00:23.931915+05:30	\N	\N	\N
d2dae9a1-1304-4749-a3f4-18d9a22c19e9	bbbb0000-0000-0000-0000-000000000004	$2b$10$GwIanKkmLwk/bJG8DhrL4.8p03TAs1hklDezqrVpbaE.IlQM9hxwC	::1	node	2026-07-09 16:00:24.034+05:30	2026-07-02 16:00:24.124604+05:30	\N	\N	\N
d9cd5cc1-1482-414e-a46b-403de099032a	bbbb0000-0000-0000-0000-000000000001	$2b$10$SODfQMAmH2CrZ4YnwnS8qeyAK0.umyNrAKfJcstVZuwPAmL1lx/K2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 16:03:26.837+05:30	2026-07-02 16:03:26.93007+05:30	\N	\N	\N
50294d82-67d9-440e-9956-235b26553534	bbbb0000-0000-0000-0000-000000000001	$2b$10$tB1/uUp1vYFGmP88tkIbxunruDud3GGybiUHzL/o0kmdOKwLjqcgS	::1	node	2026-07-09 16:04:52.415+05:30	2026-07-02 16:04:52.555749+05:30	\N	\N	\N
066f71db-4f62-4dfb-8d9b-b73a0e6382f5	bbbb0000-0000-0000-0000-000000000003	$2b$10$HXHfL5iIYXbYw9UstHCKVuxUrvxxuTf.iLjJ/5R91KR3f8xmUEWwC	::1	node	2026-07-09 16:04:52.694+05:30	2026-07-02 16:04:52.798348+05:30	\N	\N	\N
188d2636-95ed-4962-844d-4e05886a1abf	bbbb0000-0000-0000-0000-000000000004	$2b$10$deFKqj/8iQfaoHH9hkQjaeIfkslnEDc4PkBnDwm34epioKZNVgYqi	::1	node	2026-07-09 16:04:52.902+05:30	2026-07-02 16:04:52.999282+05:30	\N	\N	\N
a2d559bc-6710-424d-9bdb-b86e802e386a	bbbb0000-0000-0000-0000-000000000001	$2b$10$zoGiuTvEsHHk2do.nITgD.WTRqaUz5oLfDS.j5yz5z3iqPdM14Izm	::1	node	2026-07-09 16:11:55.737+05:30	2026-07-02 16:11:55.838049+05:30	\N	\N	\N
bab13882-2011-4cd0-9358-f80ec755ad9d	bbbb0000-0000-0000-0000-000000000001	$2b$10$nOzYKm/SGr30l0OZsUytoOKkJxIryKusXUyA2V.7LRIz9H7m3E2cO	::1	node	2026-07-09 16:12:05.366+05:30	2026-07-02 16:12:05.481171+05:30	\N	\N	\N
16590888-d19a-45e1-9b3a-46d6c584ab72	bbbb0000-0000-0000-0000-000000000003	$2b$10$eFOqIkaRncJbI5WUTpDun./BboeEhRt6SlcnTM2L0qUq7AeFqj1p6	::1	node	2026-07-09 16:12:05.633+05:30	2026-07-02 16:12:05.766431+05:30	\N	\N	\N
8a47d728-cd62-4388-82e9-a321c9822555	bbbb0000-0000-0000-0000-000000000004	$2b$10$zlhSaYBbiMncqToEJKAe2OKTtH1Z93izm9h2Tu1cxx8nXIrWvpmy6	::1	node	2026-07-09 16:12:05.88+05:30	2026-07-02 16:12:05.979473+05:30	\N	\N	\N
d6ab4726-6deb-411f-9783-d9fb27fb2ad4	bbbb0000-0000-0000-0000-000000000001	$2b$10$wvIc4YL3nskdytfBuvgJEepsa1WayvHqgP6rXaK1a22wLx0CkjYRm	::1	node	2026-07-09 16:12:28.758+05:30	2026-07-02 16:12:28.862074+05:30	\N	\N	\N
2d238e4f-4f74-41ce-b8bd-c38a4202c4bf	bbbb0000-0000-0000-0000-000000000003	$2b$10$GAM9HRL3fjq5QE6mDm32U.Bu/zVdo4SAizqZkj1ui7m9quodwqZSy	::1	node	2026-07-09 16:12:29.006+05:30	2026-07-02 16:12:29.107285+05:30	\N	\N	\N
dbe9a900-c58d-46c5-bfb3-1e70f4dbf7cd	bbbb0000-0000-0000-0000-000000000004	$2b$10$nAoJYNBQStj.5ePpnycqAOPMWb823bZmGj61nlvooGFObAepi9XUW	::1	node	2026-07-09 16:12:29.212+05:30	2026-07-02 16:12:29.308161+05:30	\N	\N	\N
ca45444f-2dc8-462b-9037-ac5f19c40695	bbbb0000-0000-0000-0000-000000000001	$2b$10$CJA11FOSVbqIJzw1oBks4OQOBWRV8rMLGX5MxEQu8iAdpT97XcJHK	::1	node	2026-07-09 16:12:57.622+05:30	2026-07-02 16:12:57.716545+05:30	\N	\N	\N
e7f350fc-1cad-4376-ac6c-f450f9bbf184	bbbb0000-0000-0000-0000-000000000003	$2b$10$Hb5MH9VgiUDqliW.GOWOPuPAoJUnkVRIG2932Ng1/qDJ./PEwoZCC	::1	node	2026-07-09 16:12:57.939+05:30	2026-07-02 16:12:58.133033+05:30	\N	\N	\N
1e9365b2-2494-474b-9a23-c70444670125	bbbb0000-0000-0000-0000-000000000004	$2b$10$Zv00aIK3j.edX3ejMGhPcevx64w2OzvwA1VuYaTN79CdcAGJsVeC.	::1	node	2026-07-09 16:12:58.239+05:30	2026-07-02 16:12:58.331293+05:30	\N	\N	\N
e98cc427-9df4-477d-a752-2624d748fe50	bbbb0000-0000-0000-0000-000000000001	$2b$10$CQIQnk49lzwowIkNE90jhOJZBRR2QTM0KNc/M9Um7Q3YpeHwiN0O2	::1	node	2026-07-09 16:13:06.689+05:30	2026-07-02 16:13:06.789379+05:30	\N	\N	\N
898de846-abe4-48a4-b291-61af377425ba	bbbb0000-0000-0000-0000-000000000003	$2b$10$zcFzgyQCB8z0fFyqG3RO3OhWioN7cWlz6hXl2eZNr6iC0Mu8/m1xe	::1	node	2026-07-09 16:13:06.921+05:30	2026-07-02 16:13:07.035178+05:30	\N	\N	\N
dd7cf485-0143-4df7-be9e-7fe2845d644b	bbbb0000-0000-0000-0000-000000000004	$2b$10$YXrc8OTp281tUp8.xcRQ6OdIP.Y.AM6MUE9feWGgCoMvMPmH9b7k.	::1	node	2026-07-09 16:13:07.153+05:30	2026-07-02 16:13:07.254273+05:30	\N	\N	\N
dcc81cde-26d1-45cc-8beb-ad3ad56102cd	bbbb0000-0000-0000-0000-000000000001	$2b$10$Wq0XSSMU9HNJ/gkPeeZmK.UiI39ruTGnE3H6KGQssPArY0GIWD7g2	::1	node	2026-07-09 16:13:30.433+05:30	2026-07-02 16:13:30.530236+05:30	\N	\N	\N
00e25179-a62c-46dd-98e6-39dc0c3cb018	bbbb0000-0000-0000-0000-000000000003	$2b$10$l2TbHjDMlNJwd2ekS7LqDOeEuNLRUH99TwEA68J3AMPztHi06AUHa	::1	node	2026-07-09 16:13:30.666+05:30	2026-07-02 16:13:30.779273+05:30	\N	\N	\N
a44483fe-d9d6-4ca8-920d-afaee6231635	bbbb0000-0000-0000-0000-000000000004	$2b$10$CGJ0MLVftN5CP/imn3eUOe1lI4fWLi1erAbaL6eLTaEeyMiYL8vYO	::1	node	2026-07-09 16:13:30.894+05:30	2026-07-02 16:13:30.996326+05:30	\N	\N	\N
5e0b1a38-4794-46d1-9aff-d21b381e1b5b	bbbb0000-0000-0000-0000-000000000001	$2b$10$wPhuBONI6goiWnF66H.tvOSOYSZ69P.3qePAGsGtHqqxifiausr9S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 16:38:29.311+05:30	2026-07-02 16:38:29.40988+05:30	\N	\N	\N
87729af7-d4e8-4ac5-946c-f1449bf357ae	bbbb0000-0000-0000-0000-000000000001	$2b$10$bDnoL9CnjyzLXN59bUqh3.CxdJMTG/y8cR57g/VrhgFktREYyVyOm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 16:58:06.649+05:30	2026-07-02 16:58:06.744655+05:30	\N	\N	\N
42c1a9ff-b2a5-4d19-a489-31d6446ea9d2	bbbb0000-0000-0000-0000-000000000001	$2b$10$3rJKkzmsBocbjG7vVqPDoujVGjDRldS8SAkvMnUJPIh0i3uBv2nzi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 17:18:09.408+05:30	2026-07-02 17:18:09.497036+05:30	\N	\N	\N
d901e119-5e0d-486a-a298-0cebd109e183	bbbb0000-0000-0000-0000-000000000001	$2b$10$UDOFIbHMqWWZMzmiSssSkeYtO2TezinLMtdLZYRgaxwWagjIVclHu	::1	\N	2026-07-09 17:19:40.611+05:30	2026-07-02 17:19:40.718285+05:30	\N	\N	\N
78647d85-cb21-4789-b55d-3409e01575d2	bbbb0000-0000-0000-0000-000000000001	$2b$10$0ES/XHmMmJIPFDDuBWF50OEn1Dd2t4axtgJHPaRlE00bg.QJGWjPe	::1	\N	2026-07-09 17:19:56.454+05:30	2026-07-02 17:19:56.614386+05:30	\N	\N	\N
a81eb665-dc01-4992-b871-2a8b27fb3a54	bbbb0000-0000-0000-0000-000000000001	$2b$10$6nAZeQM3SG/n2HtPFBTknuM5ebQicDo.FmH3s3DFqwig4SsUejGq6	::1	\N	2026-07-09 17:27:46.743+05:30	2026-07-02 17:27:46.836178+05:30	\N	\N	\N
750f6a85-a20b-4da7-8761-be0431d44bad	bbbb0000-0000-0000-0000-000000000001	$2b$10$pQFcJs46jisE/AHYwUwsm.p6bruNXTlM/cRQQKer/l0hKHTwrTKTW	::1	\N	2026-07-09 17:33:16.017+05:30	2026-07-02 17:33:16.117061+05:30	\N	\N	\N
4a77c3a3-86b5-4ab7-bb55-b18e7c06f9d2	bbbb0000-0000-0000-0000-000000000001	$2b$10$mm3JG7rj0D8kQjo3g5mm8Oss4lkHYME8ES36vQFsrgosbwJjRWToq	::1	\N	2026-07-09 17:33:29.383+05:30	2026-07-02 17:33:29.486243+05:30	\N	\N	\N
5ace4780-5704-4075-8823-0c3a9628f04d	bbbb0000-0000-0000-0000-000000000001	$2b$10$/M7lzih4FYdNv9Unv/EKtuBX7zxByLPolYk.ISI.DeEDal9e4J4My	::1	\N	2026-07-09 17:34:00.585+05:30	2026-07-02 17:34:00.739447+05:30	\N	\N	\N
b461d3c9-ef6a-41f8-a591-58c5ed029643	bbbb0000-0000-0000-0000-000000000001	$2b$10$3eoCTNllHby5P.AKNy5cw.jKC/7iKSG0znco.G9kIe8pDdL/KR7mG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 17:34:25.213+05:30	2026-07-02 17:34:25.301215+05:30	\N	\N	\N
9352dcf2-2afc-4505-86de-e9150fb652a5	bbbb0000-0000-0000-0000-000000000001	$2b$10$WSJ9JjC49XhnMAhcdCxDGuYNLzRQ9vhNtegGrefByVJaIOGMesIoy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 18:01:22.597+05:30	2026-07-02 18:01:22.686491+05:30	\N	\N	\N
48ea0247-ccd6-4a16-b4e2-85c1feb7e128	bbbb0000-0000-0000-0000-000000000001	$2b$10$DvadfLo3DpQf/PZKB2QUXedhdsftm6r5LkS7x0HkE6k8nsvhv9bkS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 18:22:25.295+05:30	2026-07-02 18:22:25.381785+05:30	\N	\N	\N
81d26a19-0097-4187-a712-72f234e5a59e	bbbb0000-0000-0000-0000-000000000001	$2b$10$kUuAE4/tXkvaIMHOCE92uukfHdECn6eZaATdf7CNMW6l/IZiNa6MO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 22:35:00.61+05:30	2026-07-02 22:35:00.699994+05:30	\N	\N	\N
699931d8-1b8c-4923-9166-2b12d1888bea	bbbb0000-0000-0000-0000-000000000001	$2b$10$Px9YIHKf0fIJc8QO9jKGAeGsm0XWbv0jznm4dboBsMhXNJ8SHjqcW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 22:51:11.098+05:30	2026-07-02 22:51:11.186413+05:30	\N	\N	\N
467103c2-041a-4ca1-b031-4e30a1fc8971	bbbb0000-0000-0000-0000-000000000001	$2b$10$CTXhgR.aI/eJ8DY6577Yr.UZflgH5Hj.j8cVqpC6R8XyqHThqYl2.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 10:20:17.465+05:30	2026-07-03 10:20:17.58047+05:30	\N	\N	\N
f60600d1-08bf-4d68-b34f-262952aac2c9	bbbb0000-0000-0000-0000-000000000001	$2b$10$ROFMooBBumnZleV7FZy6s.azPyL/WKfAPPhoU9cMqmrL.w6pxz1/u	::1	\N	2026-07-10 10:38:17.068+05:30	2026-07-03 10:38:17.209607+05:30	\N	\N	\N
4dd6f0ea-b0a3-40b4-b9ee-a4ca06772065	bbbb0000-0000-0000-0000-000000000001	$2b$10$/0Pc6RQW6utsV4ftOTuL9uv2kRbuF0MnTuBy6yg/zRUeZULZZ0paO	::1	\N	2026-07-10 10:42:52.971+05:30	2026-07-03 10:42:53.110711+05:30	\N	\N	\N
9c596f52-8c56-4b14-934a-08c509ee9148	bbbb0000-0000-0000-0000-000000000001	$2b$10$8YxnDmrN/uLQKa8yBlPuXOXkk00/MhK4UlYm6d2661TTY7MiqYnwG	::1	\N	2026-07-10 10:43:30.31+05:30	2026-07-03 10:43:30.431983+05:30	\N	\N	\N
f1f92652-4591-4032-928f-f6d74c682617	bbbb0000-0000-0000-0000-000000000003	$2b$10$HFOK6InKF.esZZx.5V8F9u/PDoGMDUh1EQiqWrOD1OQiX4OWShNqa	::1	\N	2026-07-10 10:43:30.566+05:30	2026-07-03 10:43:30.691121+05:30	\N	\N	\N
bd86c1a3-752c-472e-81c5-4b66239eada7	bbbb0000-0000-0000-0000-000000000001	$2b$10$HD.5ujA7dWvv.HfpYPpjuOoKCAt2yWgTFfnzpXZoGPmVVmeDau6ke	::1	\N	2026-07-10 10:44:01.494+05:30	2026-07-03 10:44:01.625279+05:30	\N	\N	\N
4950971a-d31a-4d89-9530-12e37f04cbb5	bbbb0000-0000-0000-0000-000000000003	$2b$10$jw8iEzc/mJz7ZSGylKP.KOI1fnGm573V4GWqW9e4HajNCKN5gO/km	::1	\N	2026-07-10 10:44:01.768+05:30	2026-07-03 10:44:01.890724+05:30	\N	\N	\N
841a670f-b6b8-43f2-8fc7-bbc045558773	bbbb0000-0000-0000-0000-000000000001	$2b$10$gQgbfrBS2HZcvs3nI.k09.x24//PH2ihx8hg4Gx6YNMvteay.MttG	::1	node	2026-07-10 10:44:08.87+05:30	2026-07-03 10:44:09.089739+05:30	\N	\N	\N
77024abc-f2ad-4450-9597-1aa9c6170c03	bbbb0000-0000-0000-0000-000000000003	$2b$10$t0VxqrPg0fnO./1w0aHXaehFx2BSAuYaciS14V5naVS0fzrWzNvIG	::1	node	2026-07-10 10:44:09.255+05:30	2026-07-03 10:44:09.37817+05:30	\N	\N	\N
4270f757-5952-482e-9dd2-a498631e40ff	bbbb0000-0000-0000-0000-000000000004	$2b$10$T7V0Y40F/M3mSBantKMuTOVIA.MbeyINOPYA01S3fk7jQ3dreUGY6	::1	node	2026-07-10 10:44:09.505+05:30	2026-07-03 10:44:09.623886+05:30	\N	\N	\N
d8d5f3ab-9f15-49f6-8e73-fcbbe1606d3d	bbbb0000-0000-0000-0000-000000000001	$2b$10$yAtbPIsqqlfVzpXhWuznMuG.PZtsqE9b975jWJ0UUMJ8dt9uXPc3y	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 10:45:18.984+05:30	2026-07-03 10:45:19.101207+05:30	\N	\N	\N
08b56602-08ed-44e5-be06-aba72cf686ab	bbbb0000-0000-0000-0000-000000000001	$2b$10$jrDQ4yb7vvvVJtyJtQLIpO7da139XjSFORpstQkT/K6UGaaUSqNNS	::1	\N	2026-07-10 10:56:05.726+05:30	2026-07-03 10:56:05.853968+05:30	\N	\N	\N
645797c9-058e-4fdf-ae61-d57e009fb5e8	bbbb0000-0000-0000-0000-000000000003	$2b$10$P0e0iPUqZ6Il7enx7xYmy.LF.4FTUDuXDp8KMYrnSADDYNUREJnvy	::1	\N	2026-07-10 10:56:05.998+05:30	2026-07-03 10:56:06.119685+05:30	\N	\N	\N
7c524df5-0ba3-4857-8dd2-9f81ac30fad5	bbbb0000-0000-0000-0000-000000000001	$2b$10$EQnXyd0yA5CZZGXTCeWStuCxOB8joZjZ6uYhH/QY5JzVuLQyVAEmW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 11:10:06.921+05:30	2026-07-03 11:10:07.049284+05:30	\N	\N	\N
b139e48a-0197-4929-b124-1f471b31081b	bbbb0000-0000-0000-0000-000000000001	$2b$10$xfutlakP2WXj2mk13QNAxewbUMJXBr9E948KdE864s.eedTlepGze	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 11:25:44.61+05:30	2026-07-03 11:25:44.811689+05:30	\N	\N	\N
1fd6e373-1f3e-418d-9a84-57c21c8a36de	bbbb0000-0000-0000-0000-000000000001	$2b$10$GK2zaeudp3AWIsvW5N93OOgxty7VUrPjHNFPDd0Q.rtomPBRjYZPW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 11:45:52.947+05:30	2026-07-03 11:45:53.064592+05:30	\N	\N	\N
5c856979-875a-4193-9a45-4bbe85618e4f	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$y7FRNvsxoNHuN0xSFuAXuOST.XjBxihXyCScc3ef/UU61D7n87c5G	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 12:19:50.195+05:30	2026-07-03 12:19:50.307311+05:30	\N	\N	\N
57cbd70d-59d8-47f2-a719-cd43628d993a	bbbb0000-0000-0000-0000-000000000001	$2b$10$Z4D6/hoYZ3a2PRoBsq6HHOTxObm76gSrCRb8XMK1x8miz8kyIdwwS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 13:23:52.57+05:30	2026-07-03 13:23:52.685951+05:30	\N	\N	\N
3ecdbf19-68eb-4c21-96eb-ce9bbe51054d	bbbb0000-0000-0000-0000-000000000001	$2b$10$AtFrbcyYPfkZM5D.PJv5NemUPuMrYVX5LBt.d1V9pXlCurMNyimIG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 13:39:07.556+05:30	2026-07-03 13:39:07.683745+05:30	\N	\N	\N
77d229ea-aeb9-45bc-b684-1429722a6e8d	bbbb0000-0000-0000-0000-000000000001	$2b$10$W0A6snfHVsMQA.DFCeb7reDTOQDufZPEFGpnzSMyIY5Sl/7EdRg52	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 13:59:08.671+05:30	2026-07-03 13:59:08.786702+05:30	\N	\N	\N
ab1bca00-d705-4ea7-8488-ca693d20f22e	bbbb0000-0000-0000-0000-000000000001	$2b$10$px4V8FlhZR6mAEQr4BS4muYFJTYvaavshKnuru/k1cIJBI7Zgsdly	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 14:14:25.518+05:30	2026-07-03 14:14:25.637055+05:30	\N	\N	\N
4839ddb5-06a5-42c8-b977-18f240834938	bbbb0000-0000-0000-0000-000000000001	$2b$10$Mu1uN70oaoISRgU6F107z.B6phdQsEtbP4/jMpF4oEcvoboNI34se	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 14:30:07.517+05:30	2026-07-03 14:30:07.6358+05:30	\N	\N	\N
cee9ddbf-1c7a-4bab-b177-a18c3f1255b7	bbbb0000-0000-0000-0000-000000000001	$2b$10$7beBy4rt.lJTtsDPxwAj/uRFfKjPi7235LtGIlMQH2HpnfkpBrbRm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 14:54:27.925+05:30	2026-07-03 14:54:28.042182+05:30	\N	\N	\N
eeeddc71-c8da-493c-9e66-9d1ac8081171	bbbb0000-0000-0000-0000-000000000001	$2b$10$GtAS9M/OiOe5yXMmawj16OTlBRMfil8/c2lkwrOZFb8PPQpe7b0YS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 15:19:04.857+05:30	2026-07-03 15:19:04.989923+05:30	\N	\N	\N
0d0b3497-fc56-4353-b51d-3e83c4281330	bbbb0000-0000-0000-0000-000000000001	$2b$10$F2VSIBZM0TFI1O2YLec4SuMvEpj68P/tomQeuLmHwWK/vzUIG8s1q	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 15:52:22.422+05:30	2026-07-03 15:52:22.53382+05:30	\N	\N	\N
684fd7a7-abdc-4bd8-9d0a-3a169b230111	bbbb0000-0000-0000-0000-000000000001	$2b$10$CycAEYFM.HDNPwS5hxLGU.Le.3DhswTKyrwIz2382J/ddLEbBlpc.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 16:09:42.459+05:30	2026-07-03 16:09:42.574842+05:30	\N	\N	\N
0c188390-f0eb-4146-913b-cc3ef0b4084f	bbbb0000-0000-0000-0000-000000000001	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYmJiYjAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IlNVUEVSX0FETUlOIiwidGVuYW50X2lkIjoiYWFhYTAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiYnJhbmNoX2lkIjpudWxsLCJ0ZWFtX2lkIjpudWxsLCJpYXQiOjE3ODMwNzU4NzMsImV4cCI6MTc4MzA3OTQ3M30.4z3IMWM_0T8InxC4pCePicMfXHTyvqMhTtiLQlTvaM0	\N	\N	2026-07-03 17:21:13.175978+05:30	2026-07-03 16:21:13.175978+05:30	\N	\N	\N
123e4567-e89b-12d3-a456-426614174000	bbbb0000-0000-0000-0000-000000000001	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYmJiYjAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IlNVUEVSX0FETUlOIiwidGVuYW50X2lkIjoiYWFhYTAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiYnJhbmNoX2lkIjpudWxsLCJ0ZWFtX2lkIjpudWxsLCJqdGkiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJpYXQiOjE3ODMwNzU4OTQsImV4cCI6MTc4MzA3OTQ5NH0.FOb-dqCl4oPwrf5ZPjHQlkCDINCIpNZVlPxGiAXJ7c4	127.0.0.1	test	2026-07-03 17:21:35.143451+05:30	2026-07-03 16:21:35.143451+05:30	\N	\N	\N
e649bc59-93b1-431a-ae8d-c2cab29d6949	bbbb0000-0000-0000-0000-000000000001	$2b$10$rm7LD2hOJXuSWdSJLldW8uv.NDpZ6juHo1I480QKyeWLbKZck5ug2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 16:46:38.523+05:30	2026-07-03 16:46:38.891643+05:30	\N	\N	\N
4fec4806-7cde-440b-b34a-58985885e815	bbbb0000-0000-0000-0000-000000000001	$2b$10$vYYiGDvl//EPnJUdnX87f.TkZzOXeQeON2la./et/p4Q6CW022tIu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 16:46:38.53+05:30	2026-07-03 16:46:38.896904+05:30	\N	\N	\N
40cbb4e2-0e13-4baa-88bf-f85c14ea9e87	bbbb0000-0000-0000-0000-000000000001	$2b$10$k7XMWnOfBkK0kmMOMr2Gd.8PKKmStX0nqDeIcYVBFpbSVVdvxvGay	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 16:46:38.521+05:30	2026-07-03 16:46:38.901183+05:30	\N	\N	\N
e8eb0f80-f551-4fec-b3f7-9e43071c3a94	bbbb0000-0000-0000-0000-000000000001	$2b$10$Wpsx6nNS6drLmpdRNtizouucXFvS1JPLnVqXYx23xDmUO5xaagVJe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 16:46:38.567+05:30	2026-07-03 16:46:39.281611+05:30	\N	\N	\N
212049e1-864d-45ae-ac90-e5e49f39f0e7	bbbb0000-0000-0000-0000-000000000001	$2b$10$mY0hyveYMwdb.aTpbX7yQe42tDvXh4auhvc4NLH8hJ.nmhAd7TOQm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 17:05:22.925+05:30	2026-07-03 17:05:23.067133+05:30	\N	\N	\N
88b61105-ee8b-4e7d-9350-74064e3d9b89	bbbb0000-0000-0000-0000-000000000001	$2b$10$zCjyv5egPLmX0EFvRoxGZet2DigvHyqjdXSEJEisRHseTZqlekCba	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 17:23:51.21+05:30	2026-07-03 17:23:51.534046+05:30	\N	\N	\N
dcfe6eaa-fe0b-4d45-890c-07d7b9ea4eb6	bbbb0000-0000-0000-0000-000000000001	$2b$10$T9T1SvimLl7BBqT31LJyl.R6Zz5A4D25ghYRbbfdQwR4OSoT9H85q	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 17:23:51.542+05:30	2026-07-03 17:23:51.841963+05:30	\N	\N	\N
4ec62fbf-88b0-487f-885e-fa37833bf124	bbbb0000-0000-0000-0000-000000000001	$2b$10$JR0YzjdbpbTOyR41mVVYP.SgcBbKdD4cEIhRSFtsEnG489YpJTJgy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 17:23:51.537+05:30	2026-07-03 17:23:51.894857+05:30	\N	\N	\N
c83e41bf-31b0-4830-abe0-5a93575dd227	bbbb0000-0000-0000-0000-000000000001	$2b$10$NTBEJY0YCHVEIAABl/khy.3xo1aA6pzXmhEK.Lbxm.xVFdU2BHAiG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:24:06.855+05:30	2026-07-04 03:24:07.557211+05:30	\N	\N	\N
aa236ae5-f601-4459-8913-d60dd05874c5	bbbb0000-0000-0000-0000-000000000001	$2b$10$23SiQPrij8f3/OmZbi8JhOpIVynnfZwjZpg3B4qp0JMpLMcH2DoZ6	::1	\N	2026-07-10 17:35:07.667+05:30	2026-07-03 17:35:07.811678+05:30	\N	\N	\N
fd9d29f9-cfb5-466c-a5f8-64355629a583	bbbb0000-0000-0000-0000-000000000001	$2b$10$IBEHZh6X3MoEHfloJzui6OM1bmF6azwZJ9Ia4RTrIRk1q14ZbK5n.	::1	\N	2026-07-10 17:44:54.656+05:30	2026-07-03 17:44:54.783045+05:30	\N	\N	\N
cd6e1cd0-82e4-4589-8122-5c5683baca3c	bbbb0000-0000-0000-0000-000000000001	$2b$10$QqmI4GyhXyIWmEnidUk95OdfBWOhW/YUiRET0YUEx8JGXPi5P0V9e	::1	\N	2026-07-10 17:45:23.62+05:30	2026-07-03 17:45:23.81489+05:30	\N	\N	\N
289f6c22-1b58-4977-9a85-620ade2f7809	bbbb0000-0000-0000-0000-000000000001	$2b$10$eUY.ccsOL/baXukBNqT0oOwpwcIjS4lq15vzNUgcB4V/2i9QXplWu	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456	2026-07-10 17:46:07.38+05:30	2026-07-03 17:46:07.502806+05:30	\N	\N	\N
8a784a35-1a25-4860-8b55-0326588a8149	bbbb0000-0000-0000-0000-000000000001	$2b$10$Z6E9TRwF5uWIjRza1VUb6eOEVzVn9PDc09mKqY25ETtn49C6HturW	::1	\N	2026-07-10 17:46:19.929+05:30	2026-07-03 17:46:20.052991+05:30	\N	\N	\N
e1e0451d-5839-47a7-91f8-98052304ae88	bbbb0000-0000-0000-0000-000000000001	$2b$10$1tKO2X91sQHk1W51HIdAtOptz6u0QyX2UbX7mR4vr0hnyOGor8Oku	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 17:47:57.149+05:30	2026-07-03 17:47:57.293033+05:30	\N	\N	\N
fbd1e0bd-e8b3-4fd1-9f39-a35e81cabca6	bbbb0000-0000-0000-0000-000000000001	$2b$10$LtWqBm1YcVI.2XYsIjALOOL9Vj8dm7SEPodiFdDx5I2yqKN6uKRPG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 17:47:57.163+05:30	2026-07-03 17:47:57.306291+05:30	\N	\N	\N
ffa9f943-3018-4b0a-a577-273864918543	bbbb0000-0000-0000-0000-000000000001	$2b$10$8HcTGysJTewF7vLTl9zz6OrI5p3I5tKEMAtkei.22ahegcQQpyT3K	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:40:03.185+05:30	2026-07-04 03:40:05.605469+05:30	\N	\N	\N
8d6ec359-f3df-427e-b7a0-a9708d539174	bbbb0000-0000-0000-0000-000000000001	$2b$10$rWGR6Tqz9bmlv9l0EaDqvu6gQRATqbu5/m6BsKDlqurHwIrCxhK/i	::1	\N	2026-07-10 17:51:55.253+05:30	2026-07-03 17:51:55.383313+05:30	\N	\N	\N
0f80fc25-d3e6-43b8-b976-0ad5222ca904	bbbb0000-0000-0000-0000-000000000001	$2b$10$8nf1puUpci9skJMafibrSu834RVZnYEbuH9HnNWK9XRlzQRm0aJjC	::1	\N	2026-07-10 17:54:53.668+05:30	2026-07-03 17:54:53.804501+05:30	\N	\N	\N
e9cf8be2-1f49-4f6d-8332-40acff059f7b	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$WW5aAe1aw16eWmUGZTlqcO14NKyOAttVxKxEDPyLUOKQeJ3XyoDH2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 18:17:09.411+05:30	2026-07-03 18:17:09.738495+05:30	\N	\N	\N
99660403-8117-4488-b093-c5ac78667342	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$QUe0x.5t7CnTIZS0a3v/1enU9F6ImUuDaMQNkF.4Zt/ybmgHjUKia	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 18:17:09.429+05:30	2026-07-03 18:17:09.742092+05:30	\N	\N	\N
bf0aceaa-1277-4725-9b70-b8762e795b97	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$4QnE4b2/evGIMpAk1N6ByuSisR.ft7bpQoFhT7SPcTc7rN3cxn.e.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 18:17:09.513+05:30	2026-07-03 18:17:09.757244+05:30	\N	\N	\N
78247038-e237-4679-82f8-abafb15fa831	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$ucd3Dym5qGBEDEFZkAYjzOSHKdSp8TvAWL2BBCElFSjlTDKda2F.y	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 19:35:02.016+05:30	2026-07-03 19:35:02.347609+05:30	\N	\N	\N
2f2ba02f-5959-42a5-b59d-359490f94766	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$PoHCDjZTV8SQAYNW20ZlZeRXhrUb8/DX1i94.BlbEwvEz/qsDZ6rO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 19:35:01.963+05:30	2026-07-03 19:35:02.392887+05:30	\N	\N	\N
0d32aaad-8487-4346-9c2c-2a4e1e5a9618	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$IsSlU4NYoKieRF1vNgPks.aj6TItQ9UAEvmXDyQZseMfB923ezUEa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 19:35:02.091+05:30	2026-07-03 19:35:02.600551+05:30	\N	\N	\N
d4ebe59f-d3b3-4a51-bbcb-fd57c9ab3d5c	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$hlHbQ/UmFwqpQpaSYvJx0uiNz4.dMDe8yY6ty6Yci..Bcu1UkihFa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 19:35:02.199+05:30	2026-07-03 19:35:02.823027+05:30	\N	\N	\N
1b4ca80b-9b08-497d-b593-662b26614c3d	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$mTkjtZvn5uxxxn9.LsgMzOgYCByg7Y4d873uKK/RV7L6oes8pboDi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 19:35:05.559+05:30	2026-07-03 19:35:05.671721+05:30	\N	\N	\N
47afb427-2052-44b8-867b-44cb056af1a1	bbbb0000-0000-0000-0000-000000000001	$2b$10$9EM.pMnHwqriZGrXpZQCae.uNexyfMYUaHHc6M.IERClixHUODlo6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:02:59.062+05:30	2026-07-03 23:03:01.987236+05:30	\N	\N	\N
af52dde7-556c-43c3-ace9-c9f2f57b98aa	bbbb0000-0000-0000-0000-000000000001	$2b$10$jDKejVF4a6tglpz86wqNe./9wu1jSyvELoVB96ITI0/PiAte4L4C2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:02:59.08+05:30	2026-07-03 23:03:02.102056+05:30	\N	\N	\N
a09a23da-265f-454f-a9c9-8a4ab04fb01e	bbbb0000-0000-0000-0000-000000000001	$2b$10$p.nAeCruc0.HOUzgFbngNuao9qnFBJCjzypmREm5G2q9xvmsZv7h2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:02:59.957+05:30	2026-07-03 23:03:02.307991+05:30	\N	\N	\N
ad40b4e4-35fd-44d0-955c-f565407a4e7c	bbbb0000-0000-0000-0000-000000000001	$2b$10$QVBI7yeNG5nvuZCAzvciP.9LJHqlz6900hOgVrB9R74ccurRmF7Ea	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:03:00.823+05:30	2026-07-03 23:03:02.329918+05:30	\N	\N	\N
55442fab-3358-4797-93dd-3373443f5cce	bbbb0000-0000-0000-0000-000000000001	$2b$10$YKwjmfLB857k3QB/ObMgTuy0BwAewJKJbXLTxc13/Q7RyKqAPMu8i	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:46:05.287+05:30	2026-07-03 23:46:07.143691+05:30	\N	\N	\N
071f5cd3-2d2a-4e9f-864e-54b17810d802	bbbb0000-0000-0000-0000-000000000001	$2b$10$kIA8Y7t2XdjskGvHmx0e9.K/2LbDyhmfFb8hUDpTuVRK3gisHAZKK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:46:05.349+05:30	2026-07-03 23:46:07.22627+05:30	\N	\N	\N
261afa4f-9931-48dc-86b9-93e60a731a36	bbbb0000-0000-0000-0000-000000000001	$2b$10$k1om2NGjKV9V0.80x2axwekcd90baM9Z/OEtHFAXkhWeFHPSc2AFu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:46:05.298+05:30	2026-07-03 23:46:07.357337+05:30	\N	\N	\N
88d49cfa-2df0-4a9d-a34c-88523f4a2cb4	bbbb0000-0000-0000-0000-000000000001	$2b$10$3W/lt6/x01LYw6YJsWsR.uIztu9V1EIJRjuwO7k.LsE0pJPzpajTW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:46:05.688+05:30	2026-07-03 23:46:07.548116+05:30	\N	\N	\N
0e1e3e6c-dea9-481a-b609-8ceea6afcf3f	bbbb0000-0000-0000-0000-000000000001	$2b$10$Q5wzBHXzIo4yxj5VDtHRo.9IfGOuoq6/FdbzxbsauU8ESA9X4SQIW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:54:16.527+05:30	2026-07-03 23:54:17.877501+05:30	\N	\N	\N
5ec0f6c7-34b0-4fb3-b2aa-d1b77bd48813	bbbb0000-0000-0000-0000-000000000001	$2b$10$3zszTK1nKzpiR9VvLGSyNOLYizKu/m.m6tA0fQvb2XAFlqjnNy1bG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:54:16.782+05:30	2026-07-03 23:54:18.046947+05:30	\N	\N	\N
e182d433-301d-44c9-b478-d13b6265dfd3	bbbb0000-0000-0000-0000-000000000001	$2b$10$j2EUdRjYTNsXQnX.JqhsduppG/JA80FMlAF2TZewZnjLQuOMaew.S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:54:16.983+05:30	2026-07-03 23:54:18.177281+05:30	\N	\N	\N
7aa9c69b-a878-4220-9bd3-697ec74847a3	bbbb0000-0000-0000-0000-000000000001	$2b$10$uSWCfsjPRr.eEVWQe0yaSuOEnajokYpAjoCMi.rmIpccxFHR1Wee.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:54:20.094+05:30	2026-07-03 23:54:20.568522+05:30	\N	\N	\N
a796e8fe-bf40-4418-81ff-f0daaf3d1d17	bbbb0000-0000-0000-0000-000000000001	$2b$10$XJsVwdvmElawUMbtcuVr9unii3Wm5VIxJ997URmd28reEtaV2LKWO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-10 23:54:21.82+05:30	2026-07-03 23:54:23.149201+05:30	\N	\N	\N
26914270-2367-4f38-b1df-8af846ff1e45	bbbb0000-0000-0000-0000-000000000001	$2b$10$/JQGdaFuBnA1sekYasYpmOcWAcgy6n5xD8rKScjAz/ixEbz.Lf5UK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:24:06.898+05:30	2026-07-04 03:24:07.544112+05:30	\N	\N	\N
9ac16731-127a-4f64-8926-d1d89e8bc756	bbbb0000-0000-0000-0000-000000000001	$2b$10$NmJn5KwShAsJu8iL5SznP.kc1IIpJgzgh3TzIceNIBfw6NgaCPZSG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:14:26.125+05:30	2026-07-04 00:14:28.108474+05:30	\N	\N	\N
cfbb4e3b-c66f-43ab-b49e-83d38897a3c7	bbbb0000-0000-0000-0000-000000000001	$2b$10$ow3Q.Yn2CXqIe50NZEaLj.RLPCByvC/eKughpsh.0eZOhsIELKszG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:14:26.234+05:30	2026-07-04 00:14:28.147034+05:30	\N	\N	\N
3829e202-fca8-4395-9e99-be50056b6e79	bbbb0000-0000-0000-0000-000000000001	$2b$10$HDppSKKsvYD5pQ2eB5GIVeYumjZUHZlom9gRqjv6IZuGb6EZIDdCG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:14:27.698+05:30	2026-07-04 00:14:28.917521+05:30	\N	\N	\N
9d1754d0-d88e-47c4-b956-2577e3d5b14e	bbbb0000-0000-0000-0000-000000000001	$2b$10$oSNzVLKB9tDdnxlxzMq6JeHf70TAdbgqeBVXZ2gd9k.W5XZB6ThVG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:14:26.971+05:30	2026-07-04 00:14:28.937119+05:30	\N	\N	\N
f6c38080-91ec-4a44-b872-cd65d17dd9e6	bbbb0000-0000-0000-0000-000000000001	$2b$10$tCQuWRNI008geCJ5.o0q2uaSzLBhOi9GViNHbYLxjGCwk5BoiWXn6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:24:06.884+05:30	2026-07-04 03:24:07.645182+05:30	\N	\N	\N
dd13f3c4-424e-4ecf-83d8-e8cd5496fd23	bbbb0000-0000-0000-0000-000000000001	$2b$10$VhQDUohfLIO.itbcEg8KGe4t7FZ5eJ1kpaecA3Rp0swFvUqB9lK5K	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:36:12.263+05:30	2026-07-04 00:36:14.264419+05:30	\N	\N	\N
271fbae6-a720-4bdb-9f9e-93f37beb6f6d	bbbb0000-0000-0000-0000-000000000001	$2b$10$sZHCs5lourog4bHrhXuAW.byforCC7Y4K10Bz/MjX/jSug9oyVwlG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:36:12.342+05:30	2026-07-04 00:36:14.3116+05:30	\N	\N	\N
9b2403eb-6cb7-44ef-a06a-66f754eaea52	bbbb0000-0000-0000-0000-000000000001	$2b$10$4dDtDzCKCCed40Oz4mW3o.JBTkxE3pNc/lDiRaagpO2.VTtr4rfPu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:36:12.496+05:30	2026-07-04 00:36:14.572102+05:30	\N	\N	\N
77a323b2-97a7-4bba-8aef-6fe93bc98a10	bbbb0000-0000-0000-0000-000000000001	$2b$10$O69p2hEKEhr5WugCgR9v/OPxD68Q7SqEEBqt6/JDCDjFE07AFwBM2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 00:36:13.172+05:30	2026-07-04 00:36:14.750438+05:30	\N	\N	\N
448de23a-7d17-4a5e-85c7-d7ff1d30eb39	bbbb0000-0000-0000-0000-000000000001	$2b$10$tj.MV99wWXk4kJkVh0mNOuRCoT5HBhzHlQE9BWql/eGnduFg0i7ca	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:01:54.403+05:30	2026-07-04 01:01:54.914649+05:30	\N	\N	\N
adcc7ce7-2a18-4fd8-87c0-b992ddf349c2	bbbb0000-0000-0000-0000-000000000001	$2b$10$e3dLLWHkd2iX039dkbGgQuT8eMcFMFbiqAhv7aVqA1D/B0FJWl8DC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:39:59.77+05:30	2026-07-04 03:40:03.131485+05:30	\N	\N	\N
cffc5bab-a6d5-4660-a1b5-1d07f5b3a7de	bbbb0000-0000-0000-0000-000000000001	$2b$10$2rJCFQ5fmVVCBSF8B3sbmOkfTaZdYw6hv7nItzYk0sONEHaTJO65O	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:19:07.957+05:30	2026-07-04 01:19:09.799979+05:30	\N	\N	\N
6d84d383-9d45-41df-9e92-9708a7252e71	bbbb0000-0000-0000-0000-000000000001	$2b$10$F7y.uw94MHposVLQFWv3N.znq.fNjMuebvADnxOcmFJhbBL3vMrly	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:19:08.359+05:30	2026-07-04 01:19:10.155091+05:30	\N	\N	\N
b7ebbb57-8fe3-491c-aad1-6e7a9b8f01d9	bbbb0000-0000-0000-0000-000000000001	$2b$10$2lL00m8U4OTWkiONO4KR2ejMDLIjvP.JgndF3AmFukilUHJV/pwRu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:19:08.4+05:30	2026-07-04 01:19:10.18998+05:30	\N	\N	\N
a93f885c-3d99-4406-a9a2-c7d4f1c5425b	bbbb0000-0000-0000-0000-000000000001	$2b$10$5fmVxitDu8pH7Y8mjYC.O.yjV6c5s5bN7aKyAB67gIH8JA068J7wy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:19:08.651+05:30	2026-07-04 01:19:10.58687+05:30	\N	\N	\N
06acaf8f-2c84-4949-9523-f3ae512723ae	bbbb0000-0000-0000-0000-000000000001	$2b$10$GiEm2Jg5khmgxcxbUh6yFONboncTDpG7OlwouYEwA5fliGwz8eiTG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:40:00.369+05:30	2026-07-04 03:40:03.71399+05:30	\N	\N	\N
58059490-af7f-45f3-af9e-5fed71f44923	bbbb0000-0000-0000-0000-000000000001	$2b$10$gBWCvIgaYJsp6LANYNMzIO8eJLGabVih95BZXFMUAqwNKkEI/O6di	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:52:12.679+05:30	2026-07-04 01:52:14.36562+05:30	\N	\N	\N
aefa4b4f-4dae-47ab-a23e-26c95bf27586	bbbb0000-0000-0000-0000-000000000001	$2b$10$A5bPgkidQt9.O7oLoo3oWeKilW/PT.3bK1pAkNWf.0FmnS12uW/Su	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:52:12.776+05:30	2026-07-04 01:52:14.442554+05:30	\N	\N	\N
60f2047d-ac04-4038-bbd0-a84f846abc4b	bbbb0000-0000-0000-0000-000000000001	$2b$10$gTGrzr.nFHUE4my444hmvO23q7PfM8rGweOsheLc4HiJoUetBS..K	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:52:12.815+05:30	2026-07-04 01:52:14.492147+05:30	\N	\N	\N
7fb5ff06-c36d-4be1-97b0-37f282156121	bbbb0000-0000-0000-0000-000000000001	$2b$10$EMIL8CB/VhhwZU5QA1sYFeX5mqPp/rG0mzNPuBtee1rFxNhyDWpTC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 01:52:13.494+05:30	2026-07-04 01:52:14.787494+05:30	\N	\N	\N
3c24d2ea-0638-434c-b259-e35554307f68	bbbb0000-0000-0000-0000-000000000001	$2b$10$KusiExeOM6mg3w27IR7R3u17bTNTNV1l.8KFo0b7EtuKrDBoWg.x2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 03:40:03.172+05:30	2026-07-04 03:40:05.622749+05:30	\N	\N	\N
cfcaf4e9-9f60-4a0f-9ef5-4b9406cc7d5c	b6be28ec-f9e1-47cf-ace9-79439c73eb1f	$2b$10$7r93nyz7txMtbjfMx9ymJeoEt.FKGmZoN0NsJHC4b.4jmARjBKrSW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 09:47:26.682+05:30	2026-07-04 09:47:26.972518+05:30	\N	\N	\N
c0ba05a0-f2fb-42cc-97fc-079b437ddb46	b6be28ec-f9e1-47cf-ace9-79439c73eb1f	$2b$10$Oypv.fDk/r9y4lc5SRGiZOixv5WFz10FB9Y3MOIYeWC6dVBKk0geK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 09:47:26.737+05:30	2026-07-04 09:47:26.975779+05:30	\N	\N	\N
ce1aaa28-7fe9-4a03-a2e9-769d87183ca7	b6be28ec-f9e1-47cf-ace9-79439c73eb1f	$2b$10$1tpYmVgDWyCWyH6PTZhSR./ggtCYqW56uIYtYTedubw2yRbLz2TqC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 09:47:26.805+05:30	2026-07-04 09:47:27.140669+05:30	\N	\N	\N
943b0193-c5bb-4f8c-abcf-4eda3b69b0e4	bbbb0000-0000-0000-0000-000000000001	$2b$10$9PfEe26MQbvALjtRPQy3hu4YRviBKeSMBEPZxY7ga4OUI/yo2j37.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 10:59:33.738+05:30	2026-07-09 10:59:33.842804+05:30	\N	\N	\N
4e254ec0-fd10-403e-b4ef-818de78f0539	bbbb0000-0000-0000-0000-000000000001	$2b$10$321V0Y2lKiFXunudxyprKeZMdk6AsZERVqPYGyWiwkU.U4yvN93Vm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 11:23:15.705+05:30	2026-07-09 11:23:16.24632+05:30	\N	\N	\N
ef21fa5b-667a-4063-ae91-f509ac2fddbf	bbbb0000-0000-0000-0000-000000000001	$2b$10$xWX3Db1Mp2GZvnLlFL3S9.1Iukqv1OB1RwG4WqP.L51tnspNJc8bm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 10:04:43.918+05:30	2026-07-04 10:04:44.412097+05:30	\N	\N	\N
6e466962-ee59-4b1c-9b1c-06fbc2333bce	bbbb0000-0000-0000-0000-000000000001	$2b$10$Ujh7Ktr4Lg4ooCF6uxbsqedv.ffFHVZBBvQyPa2ylC3ON4j80T6nG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 10:04:43.937+05:30	2026-07-04 10:04:44.506806+05:30	\N	\N	\N
3c497fb3-38b4-4ea6-8ab9-734a38ab283a	bbbb0000-0000-0000-0000-000000000001	$2b$10$uXhQiVuX2XOMP2HVVJNDcOhcNYOA4qXAqmFVEZzDv32QsNaW95bU6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 10:04:44.15+05:30	2026-07-04 10:04:44.65418+05:30	\N	\N	\N
09ce8565-8e8b-4bef-97af-f4fe2e4b7904	bbbb0000-0000-0000-0000-000000000001	$2b$10$jeSNPpCKAgNmBcbMtjeqkOrPAzIZYF/kGAAkfr4Hv5.r0XjMK9Blu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 10:04:44.155+05:30	2026-07-04 10:04:44.670343+05:30	\N	\N	\N
9fbad1c4-1a34-4292-87a5-0e16d6a32a36	bbbb0000-0000-0000-0000-000000000001	$2b$10$7iY1jsE7xB4ColofRMJUAOtI/EEzEmEJSqwpKxdcO3BfHQnLlRlJ.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 14:29:24.711+05:30	2026-07-09 14:29:24.943505+05:30	\N	\N	\N
e390a45c-34d6-47b5-9c49-bffdcee286bf	bbbb0000-0000-0000-0000-000000000001	$2b$10$plFyQsvrYl8gH1OGfCq2EevVAGeOKa3CW798Ag2kwmNaVDIPY4/v6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 14:29:24.803+05:30	2026-07-09 14:29:25.171935+05:30	\N	\N	\N
6ac08d4c-53e2-449a-b19e-0a2812854d65	bbbb0000-0000-0000-0000-000000000001	$2b$10$n7G/COPPU7irWkXg4EIawe4U8RwBIwpE.bH64tvz8ASST.a2ZMEaC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:10:36.854+05:30	2026-07-09 15:10:37.444479+05:30	\N	\N	\N
3fee3b37-f6b9-4da4-918a-370dc0ee8607	bbbb0000-0000-0000-0000-000000000001	$2b$10$6RRgoAailC9BMip5HgKdkuHrHOZ1V/zud6A2W8KS/ikonlIpr5W.6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:29:04.42+05:30	2026-07-09 15:29:05.360687+05:30	\N	\N	\N
9d073236-6bc1-4a66-93ea-c32b62ba17ab	bbbb0000-0000-0000-0000-000000000001	$2b$10$TR5nyvaQ6BYpWPp8nMeTV.DVuODuS55oh3CcNLFhA./24KZzzjXOe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 09:46:47.789+05:30	2026-07-10 09:46:48.851185+05:30	\N	\N	\N
afe1d681-9928-4e6e-9b56-e61a9242a005	bbbb0000-0000-0000-0000-000000000001	$2b$10$WwbLIsfgrvWarwWz/E0QVeRtDK1kJadpavVd1l2mSJtURy0iE/Ya2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 16:26:14.241+05:30	2026-07-10 16:26:14.76741+05:30	\N	\N	\N
34dc7297-a578-47e4-8e76-190f8c3cc4b3	bbbb0000-0000-0000-0000-000000000001	$2b$10$z8rAm8hZUMmJbROLeUKf1uLtapMNLsCKy.FwO096OK6s5sJB4BNcC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 16:26:14.259+05:30	2026-07-10 16:26:15.140293+05:30	\N	\N	\N
3e24bf4b-fd82-457a-986a-d04fefbe4b23	bbbb0000-0000-0000-0000-000000000001	$2b$10$QLpxPT02m9ugv9wt8Ua.U.XCDUgkzFhQm6eK2j6TBKucB/7lTFpcS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 16:26:15.019+05:30	2026-07-10 16:26:15.438519+05:30	\N	\N	\N
617fe87d-a8fa-433a-8733-14d8f4093855	bbbb0000-0000-0000-0000-000000000001	$2b$10$TvvwhBEQ1qkGPOe9VJ8jfuBaxqoaZ3h5lzm1yjpoKjQrhhafbzjvy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:24:38.738+05:30	2026-07-10 17:24:39.842245+05:30	\N	\N	\N
9a036e58-5657-471a-ad7c-088f2dedaa0a	bbbb0000-0000-0000-0000-000000000001	$2b$10$YsPKuyyBvHm0FYY4a2J6yu1m6U4OyJOLd9ePoaRlHzY3JYMgNI6XO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:24:38.753+05:30	2026-07-10 17:24:39.986612+05:30	\N	\N	\N
b445697c-8bfb-47b5-b524-09834723a4ec	bbbb0000-0000-0000-0000-000000000001	$2b$10$de/.8du0ZOJvTp1RC4dWC.oeFdh5HXhkQCGM45PNaHqmbDXiHWaHG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:39:47.726+05:30	2026-07-10 17:39:49.147791+05:30	\N	\N	\N
895e1dae-097e-43c1-a719-31fe6bcf1fd0	bbbb0000-0000-0000-0000-000000000001	$2b$10$WcDjQ7LuV6VIe.OnOZvND.k9UhVZG9AC6qapDaRmLQ1wsaXnucpDy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:39:49.387+05:30	2026-07-10 17:39:49.908746+05:30	\N	\N	\N
940a6bb3-55b0-4220-9caf-826a5ef9c722	bbbb0000-0000-0000-0000-000000000001	$2b$10$IEflquqOkrydlWKDOKgDr.5CRERqkfAdjtOy0jxLSUoUvQQE45v4S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:39:49.469+05:30	2026-07-10 17:39:49.975785+05:30	\N	\N	\N
9b807a39-76b7-42a9-9e67-3d19e03ab7bf	bbbb0000-0000-0000-0000-000000000001	$2b$10$KIbQu5yj2BmIffyqbfTjMeVC2Y6DPVCxnj0t.xQfGuOZCJ9vWWfyS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 11:28:38.119+05:30	2026-07-04 11:28:38.694947+05:30	\N	\N	\N
327ca067-1505-4300-b238-8a5c8be590ba	bbbb0000-0000-0000-0000-000000000001	$2b$10$UnuxDceZoY1DAFmpY6oMYeqECh7NjlL7MqEblzMZcU9mCXT2UFTDW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 11:28:38.271+05:30	2026-07-04 11:28:38.903477+05:30	\N	\N	\N
80c44f5c-6f72-47ad-823f-46e672aa8320	bbbb0000-0000-0000-0000-000000000001	$2b$10$FKW94BSmcaR3KXJFnCaq9uoeevEl7j81ZxPE037GApA/PXBUP07Oy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 11:28:38.252+05:30	2026-07-04 11:28:38.950245+05:30	\N	\N	\N
ec1ab357-9f86-4ae7-9927-f2d27ec20aef	bbbb0000-0000-0000-0000-000000000001	$2b$10$Rk9jIzcAj5epdS8S1.EYcuCWD93wYGlPOvOBL8Ib6KoNdqIs3fRJG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:02:41.985+05:30	2026-07-10 18:02:42.597178+05:30	\N	\N	\N
490b031b-5b22-4e37-a43f-4c02a8638813	bbbb0000-0000-0000-0000-000000000001	$2b$10$VJfD6rzxoZLey/nuBGqyf.tgvQ1AzBYnioePcWM/ro3SSRJ1MxsTu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:02:41.994+05:30	2026-07-10 18:02:42.786486+05:30	\N	\N	\N
3e70dfd9-6937-467e-a0ef-ed0c904240bf	bbbb0000-0000-0000-0000-000000000001	$2b$10$.xS.NWSseKwr0RYZ6zOZU.VO7l0n/oykfrOKj/N8TgLYi.8WM3cDG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:20:31.757+05:30	2026-07-10 18:20:32.042962+05:30	\N	\N	\N
2b44f0e2-b6fa-4081-b7b1-a6ce058c81b0	bbbb0000-0000-0000-0000-000000000001	$2b$10$9Yy9GR9yzHfRtyrO2a0/4ec8fzsi4.MYnQ7SJDq2uaFN0K.WXmTVS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:20:31.788+05:30	2026-07-10 18:20:32.757218+05:30	\N	\N	\N
ff49711d-14cd-4519-88c9-e7fa1c97125f	bbbb0000-0000-0000-0000-000000000001	$2b$10$FZVyEH3NhNOmuDH6B4KKA.k333gjnK66se7c3uQJPnxypJvx.oJGy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:20:31.929+05:30	2026-07-10 18:20:32.917058+05:30	\N	\N	\N
82d8bc9c-3278-4440-b0c8-71994bb52001	bbbb0000-0000-0000-0000-000000000001	$2b$10$MsdvhT9xcI8ViAH0h5QbIelSEtjoSTS.KGonf9sAz.pNwS86RINMG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 22:31:22.589+05:30	2026-07-10 22:31:22.814882+05:30	\N	\N	\N
7abec2de-bc6a-4a0e-bf36-e93867f8bb14	bbbb0000-0000-0000-0000-000000000001	$2b$10$UQIBsYtn7SaFBzR2a71w4eIWpSDJPUhalnFP.DYtodqMXhPh74/Mi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 10:06:02.955+05:30	2026-07-11 10:06:03.290415+05:30	\N	\N	\N
815636d5-3436-4f0c-88da-7de04b791567	bbbb0000-0000-0000-0000-000000000001	$2b$10$ZVGaMJtQT4ymqcPAJ0Z3dOgi.QHv/MeZDuT3FE/OxSTZVbQs5ZE.e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:06:03.457+05:30	2026-07-11 11:06:04.111735+05:30	\N	\N	\N
d9db1481-677d-4743-8668-ec1751f192ad	bbbb0000-0000-0000-0000-000000000001	$2b$10$0EKeojP38jVGTo71SBeheO15R0LpB83Wvq8tCJ1DJ15IpLMMFuQay	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 11:28:38.348+05:30	2026-07-04 11:28:38.977493+05:30	\N	\N	\N
3419c0ac-1539-4da6-8209-0b61f0f99c87	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$GvY7jT10hgyIaVbQpDMWi.piFIS8dKvdn.qtQcBWNtc7R0wPLZq.m	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 12:09:52.938+05:30	2026-07-04 12:09:53.095029+05:30	\N	\N	\N
b7341600-c5dc-4994-a585-7d93e73d51b4	bbbb0000-0000-0000-0000-000000000001	$2b$10$UXU0zD8tRYRA2B35Ka.9wOd080lVQwkvrTlZAbNBw02wo9nMARIiO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 12:49:03.862+05:30	2026-07-04 12:49:04.004688+05:30	\N	\N	\N
06d2ef26-32b1-461a-a2e8-691b84237d53	bbbb0000-0000-0000-0000-000000000001	$2b$10$UNiySOYCFOZiYMl6v/pbOO5nzY4VBxiETlyp/TTFyTTbjZbxvt2CG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 14:07:56.196+05:30	2026-07-04 14:07:56.607001+05:30	\N	\N	\N
a265c94e-871b-475d-92f3-c1f8351fc45d	bbbb0000-0000-0000-0000-000000000001	$2b$10$IrQRSuFUoKU15FBWExVVDOthn1kwkDrpXuu1j1hdzerU23p/SOeom	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 14:07:56.236+05:30	2026-07-04 14:07:56.698493+05:30	\N	\N	\N
b583a818-b9cb-41c8-97d7-cfd506ed3ed7	bbbb0000-0000-0000-0000-000000000001	$2b$10$vfGG883fTbJrA50poyRRxuoI/FKFS8XUnQ/EWuJX9PkEW4sQj6TJ.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 14:07:56.329+05:30	2026-07-04 14:07:56.720998+05:30	\N	\N	\N
a16e2587-c10e-44d7-a058-17f7ac2c0e89	bbbb0000-0000-0000-0000-000000000001	$2b$10$13mMf7dOdwM9JW04ncqaNuieTauKb/Kv9q4Wco/7MWRnUA96gh/HK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 14:07:56.326+05:30	2026-07-04 14:07:56.724551+05:30	\N	\N	\N
79fea47d-ce0e-4088-8f22-e94cec155057	40f2f484-0476-4ab1-a564-c69b67af7a67	$2b$10$aNb4Vw4dLRGCWawDI/BcGubDpemW3U9xtT6lEqS8/NvfHXQ/zDQ9m	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-11 14:36:41.435+05:30	2026-07-04 14:36:41.573241+05:30	\N	\N	\N
9ff1a3af-f8a5-4de7-83e2-029c7d1f83de	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$/mJo/8xK9zQ2.tf1bn0lgOAa/8SS02km5Xo4fbyUAZNw8w4zRK1Pe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-12 12:01:06.69+05:30	2026-07-05 12:01:06.929912+05:30	\N	\N	\N
496f11a7-ed0d-4af6-9047-5ac0f1f6bae6	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$u5kqywpwokZt48YxxrMnrOOEVVCK.5n2lKmoyXp4NIhHYHlylflJ.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-12 12:01:06.786+05:30	2026-07-05 12:01:07.264366+05:30	\N	\N	\N
6528e0d8-fcbd-4b48-a944-e3fbf9df11cf	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$90WNfnMr5.T3beFM99jFQeHiLiDVOhwpZD1EyWEcPcpK3/RZHDBW.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-12 12:01:06.832+05:30	2026-07-05 12:01:07.268017+05:30	\N	\N	\N
e123d2ba-f7ae-444d-9f1c-116242b6b812	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$lvyd3cVWKnF63.kTsiFtI.b.HRyj.EopKXL3rIDzAd3xKSgD1SBQC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-12 12:01:06.934+05:30	2026-07-05 12:01:07.536968+05:30	\N	\N	\N
6bb17a19-7202-4118-84bf-5a99cd461c85	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$N7oQ39F22RZtAK1npt7CKeHzELvV9rhhXXNYgTus7TNuTgj3ptwEy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 10:20:50.264+05:30	2026-07-06 10:20:50.493194+05:30	\N	\N	\N
ab6a1433-dba9-4d92-9d31-b64c8be67f6f	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$ORX1QWYRsQQW/cfDGQUJ.O/YHSQjraBrNQ1kqBd/PF4Zrjgp00fuq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 10:20:50.303+05:30	2026-07-06 10:20:50.705285+05:30	\N	\N	\N
64ad4a15-6c5b-49f4-87ba-b362f5988e2e	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$9.dKCpQ4vhhsiiXtJCVYJ.Y1L7Q5tvD3IkdolJ2o8BTH2ZbNQ9vPG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 10:20:50.313+05:30	2026-07-06 10:20:50.821706+05:30	\N	\N	\N
ea843602-3add-47e7-92d9-fb50e2dc1e39	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$OhjYBgvLwE2HOQIcqmfQOe4A12HKHFQD.rjdAMMnjQk.Ci392ky2G	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 10:20:50.366+05:30	2026-07-06 10:20:51.51676+05:30	\N	\N	\N
26104067-0eb7-44c8-acd2-bba862fbe195	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$C5yY7H6oVJJYugWiOzSGt.h3ShgHkdGJKEtwYVroBaV.Q18I47GNO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 10:20:51.52+05:30	2026-07-06 10:20:51.748658+05:30	\N	\N	\N
ddd194c6-e83d-461f-b225-3d6648ad03b6	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$zkSd/JdAlZt4Yg78lLB7JOtHOgUVC1Ll51kRFq1iKdeZCozOfg.rm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 10:20:51.525+05:30	2026-07-06 10:20:51.815892+05:30	\N	\N	\N
1e8b1d38-43ca-451a-b881-dd953deb63d7	bbbb0000-0000-0000-0000-000000000001	$2b$10$DVFRS7pXNO7ormnLrex7n.SW7wxoJ.lojby2Z2GRZRQmLEY5CMsiu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:05:27.675+05:30	2026-07-06 11:05:27.963246+05:30	\N	\N	\N
4f758979-5266-4654-824a-786924fb540c	bbbb0000-0000-0000-0000-000000000001	$2b$10$JUciesc7f9Nk1xbCkTvYn.1AMvoRINYAnFW6LDVDAEucueUVQ6VNS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:05:27.744+05:30	2026-07-06 11:05:27.976903+05:30	\N	\N	\N
a08e7752-726f-4b6c-9450-820897ff03e3	bbbb0000-0000-0000-0000-000000000001	$2b$10$ktBFdfgkTm07RUN9RDjvoeAKz.JuqmUPXvwDhPfLXOsnGoBUXEnZS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:05:27.811+05:30	2026-07-06 11:05:27.996098+05:30	\N	\N	\N
35328163-f68c-4dc5-9cb2-8620b216ebc2	bbbb0000-0000-0000-0000-000000000001	$2b$10$Bxts4IPhd.n5vxNhuh/OfOCiSNRsOSrqwQ3a02rTs8iBGc3hsNJHm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:05:27.848+05:30	2026-07-06 11:05:28.07857+05:30	\N	\N	\N
93836521-9a8f-4b1e-ae28-2e42111b5acd	bbbb0000-0000-0000-0000-000000000001	$2b$10$gjyrweWBn06i3zQAIgStFei.q.IqyO1V4ycKvP0l13/yN6zswfOWq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:23:26.829+05:30	2026-07-06 11:23:27.234082+05:30	\N	\N	\N
510953ad-ee66-425a-bde8-9565cf01de77	bbbb0000-0000-0000-0000-000000000001	$2b$10$u4UsiG0J.YTl0h7yWuFXqedhMMn0ArQZbQ89RsejyBaIcWi2kovO2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:23:26.817+05:30	2026-07-06 11:23:27.247732+05:30	\N	\N	\N
8d8d148f-66e6-49b0-9770-9508a2ce18ca	bbbb0000-0000-0000-0000-000000000001	$2b$10$ueWgvGyMkz5t/vNq1l1p3O/kKi7zsplCalyLYFQKZtmxAnOOn16X2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:23:26.824+05:30	2026-07-06 11:23:27.261985+05:30	\N	\N	\N
475fc446-76ce-4d3a-8f35-ac85dee3a10d	bbbb0000-0000-0000-0000-000000000001	$2b$10$SWMWRlhduV44svClxYVMJuH.sAYi9x59XvzvXJUkToxpOLFmN.Wpy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:23:26.833+05:30	2026-07-06 11:23:27.342072+05:30	\N	\N	\N
21bbb023-bd99-4f38-b96b-9096fcb53e90	bbbb0000-0000-0000-0000-000000000001	$2b$10$DEiNxJ5PSGBiZwI7W6YebeiEcuos.GVjTOlA9XarJLOZFqH1kzZM6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:51:02.345+05:30	2026-07-06 11:51:02.712642+05:30	\N	\N	\N
71aacdb4-9a22-4dac-9036-9ee9a029dd4b	bbbb0000-0000-0000-0000-000000000001	$2b$10$TPMHqZ3HILnA2p7UiqZDK.H4IaSizHCJSCa9xx1TKP1BnqlekFf1e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:51:02.343+05:30	2026-07-06 11:51:02.748492+05:30	\N	\N	\N
e07c065b-0d3c-49ae-b061-08ce85398530	bbbb0000-0000-0000-0000-000000000001	$2b$10$O0xw3b835zZmHLGVbyRMG.43h1zMDzRHtwQp/VrMDm/GNPX10DC6i	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:51:02.354+05:30	2026-07-06 11:51:02.807752+05:30	\N	\N	\N
86bd363f-de6e-48cf-a42d-aab12169c70c	bbbb0000-0000-0000-0000-000000000001	$2b$10$FHbG9zBhkaqjPfxbRidD1uyKw/uR3lMs/vTHma4/0hhVQoSBG4.86	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 11:51:02.425+05:30	2026-07-06 11:51:02.991329+05:30	\N	\N	\N
10fc993e-d632-49c6-83b9-f430725bbf2e	bbbb0000-0000-0000-0000-000000000001	$2b$10$WfuieyQFY6MACQw1UTNu4u7DMZjONxTkg92CV.dFexmH7pYkMWUYm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 11:23:15.701+05:30	2026-07-09 11:23:16.259682+05:30	\N	\N	\N
ed3ba630-0f0b-41c5-a18b-4369ebf4584c	bbbb0000-0000-0000-0000-000000000001	$2b$10$X0d8aIoUJXa1eoXMm5MxCO9e3uWAgICdV9IsS6WbziKRjf0YeZA8a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 12:30:49.354+05:30	2026-07-06 12:30:49.735402+05:30	\N	\N	\N
2f576ff1-3973-4bd7-8cac-9d671722e6bb	bbbb0000-0000-0000-0000-000000000001	$2b$10$Ot7L8m3dRQHowtKIyjwf1eOxLrf.FFcks6IzYmfv2pnX8Y8uCWr1i	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 12:30:49.356+05:30	2026-07-06 12:30:50.017063+05:30	\N	\N	\N
dcfb9772-8535-4c53-a963-2618d07a443d	bbbb0000-0000-0000-0000-000000000001	$2b$10$aCi98Z4cJ1rHXGTLqV.iHu07HwQP.wZ3WBEe3GQyywMdZ3XmiYBAq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 12:30:49.469+05:30	2026-07-06 12:30:50.029842+05:30	\N	\N	\N
1c3ced20-dd3f-4313-abcc-6add35b4942c	bbbb0000-0000-0000-0000-000000000001	$2b$10$o1Imf11unJAr.J./1dUsyOy9MRr8YtWlMESHCFmttEoMjsTRxZkE.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 12:30:49.635+05:30	2026-07-06 12:30:50.175951+05:30	\N	\N	\N
10b9c8b5-e6d9-4dcf-be59-fbac28621787	bbbb0000-0000-0000-0000-000000000001	$2b$10$ipSdBMtQwAUJ2aaAGDoLa.t3DIijgRr6iEsA2YcIGbbINdIY1vgly	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 13:08:35.816+05:30	2026-07-09 13:08:36.032804+05:30	\N	\N	\N
79dd5447-17b6-4abf-bd89-b684b64af4c4	bbbb0000-0000-0000-0000-000000000001	$2b$10$7/sjHU5EhdWZKHpKbq72Lu1KBb3TCEGdRE97l.Qlcf1ciMsipGI6G	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:00:45.209+05:30	2026-07-06 13:00:45.470927+05:30	\N	\N	\N
a8a4014a-84ea-41d1-8d91-a0b5f2eab796	bbbb0000-0000-0000-0000-000000000001	$2b$10$i9perRYBDlglB/wgwrEvnu8wqECEFEIgLkPVGD5mVRsutH9UrKz3K	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:00:45.218+05:30	2026-07-06 13:00:45.518869+05:30	\N	\N	\N
e193933e-fb27-4d47-b9d8-f79692597764	bbbb0000-0000-0000-0000-000000000001	$2b$10$UkJz80mBYm24tuFK.hpHo.E.FDQ1NYXj9GlisXgDpvypJJXkcI5Mu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:00:45.22+05:30	2026-07-06 13:00:45.660388+05:30	\N	\N	\N
536013ec-a509-4491-af19-06b593c0fe00	bbbb0000-0000-0000-0000-000000000001	$2b$10$MJyj.fDXgq5hxOoWmhBO..4J0nFToKrkkg6v4fgMnl7pV9XrbBLRS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:00:45.383+05:30	2026-07-06 13:00:45.716761+05:30	\N	\N	\N
ea69fe25-f9f0-481d-b872-32944f19377b	bbbb0000-0000-0000-0000-000000000001	$2b$10$f9h/jz4xa/9yw0HnVYN.0eWn4Qf9psfghHyMQ85MfSNsuppSYScb.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:10:36.886+05:30	2026-07-09 15:10:37.325936+05:30	\N	\N	\N
cb29182e-e275-4e7b-8e64-bb23fc1f8227	bbbb0000-0000-0000-0000-000000000001	$2b$10$rxQOZr/LayOqL63oXCRvF.DiZQZhJb/XrjsHDxXFojZHLWDRKv..C	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:10:36.928+05:30	2026-07-09 15:10:37.518171+05:30	\N	\N	\N
2a0f3117-47c4-4d38-bb7b-a421f19b59a7	bbbb0000-0000-0000-0000-000000000001	$2b$10$rlOVPw6OpGuxGksMNmJlX.JHdaahM1y0O.kfw5EsUvxTDDJWZ8LPi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:32:58.616+05:30	2026-07-06 13:32:58.882454+05:30	\N	\N	\N
3d4ea958-e5c9-4f95-9c1b-27548181b940	bbbb0000-0000-0000-0000-000000000001	$2b$10$2itaBsMpd6nSCPLomKtjme5NHWUgWlaRL2ZyGTO38puM4Z8XxCoFW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:32:58.61+05:30	2026-07-06 13:32:58.891184+05:30	\N	\N	\N
c478871d-6eff-4039-8bd8-eb38d0f88879	bbbb0000-0000-0000-0000-000000000001	$2b$10$WBiprjBMOIxz0O.dsWNUO..QA7UKY5oLwTALiZzmh1dktCEX9/3Am	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:32:58.622+05:30	2026-07-06 13:32:58.922543+05:30	\N	\N	\N
b1fdb76c-6179-4e5b-802c-4a0e28f56fe6	bbbb0000-0000-0000-0000-000000000001	$2b$10$jn9hefNGRAHmPl.RkBB5WulIG5gs1W9h9.HSLi9Cqhk5WOKqpbsl2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 13:32:58.628+05:30	2026-07-06 13:32:59.27268+05:30	\N	\N	\N
cb90ab5a-1106-4be9-b18a-bceb707d69ba	bbbb0000-0000-0000-0000-000000000001	$2b$10$qO5JmxaugtTUvwY.mXYEieaQPdmaPqqY0TKNdmlrTXo/ESlfTkiee	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:29:04.472+05:30	2026-07-09 15:29:05.369285+05:30	\N	\N	\N
325bda87-2d15-48bb-a6ba-d1348bfe1efa	bbbb0000-0000-0000-0000-000000000001	$2b$10$.sYYb9ux1PA2dOOPq.ihAu3giesLQSP7/urolenuMKaap95REVbUu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 14:44:42.962+05:30	2026-07-06 14:44:43.186455+05:30	\N	\N	\N
5b4f3ac6-4609-4b98-87f6-d21f44d01cac	bbbb0000-0000-0000-0000-000000000001	$2b$10$Dsvdq6KjCfuKVtOyVGr.XOLr9n8g5KSIbruhMv0NTNwiJKKrR8wYG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 14:44:42.968+05:30	2026-07-06 14:44:43.252543+05:30	\N	\N	\N
a4036b19-1e3f-48a4-93f9-db5e5ab1efdc	bbbb0000-0000-0000-0000-000000000001	$2b$10$7yrsSUim.lZxI0BTbuOMqu4GwtuiBYu2cXhAagAxYhuNYkPuCYx7e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 14:44:42.965+05:30	2026-07-06 14:44:43.340059+05:30	\N	\N	\N
c1b685e5-b499-4774-92cf-088013ac4dd4	bbbb0000-0000-0000-0000-000000000001	$2b$10$XxjwXfn.0FOiyi4pzi3GpOUMU0L.zigh92Hfxxo5dXEwzR8lxfFru	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 14:44:42.982+05:30	2026-07-06 14:44:43.774741+05:30	\N	\N	\N
aaa0747a-51ab-4959-a8de-4d66c72c4fba	bbbb0000-0000-0000-0000-000000000001	$2b$10$u9hdMeCmm4q59zMG6Xa8mOIS721gei3E8E./yNOn5oxvwTPxAObE6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 17:34:13.238+05:30	2026-07-09 17:34:13.346795+05:30	\N	\N	\N
3301e2e5-9511-4e27-96df-9b6e56cc207e	bbbb0000-0000-0000-0000-000000000001	$2b$10$n7feTPFB5DoWIRSKbOktgeQ6yZ5EhTO6vSHAYNCh15.1rH7KzqiNe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 15:13:17.952+05:30	2026-07-06 15:13:18.064097+05:30	\N	\N	\N
22694c76-873a-4b3d-a3a2-be8a3780db20	bbbb0000-0000-0000-0000-000000000001	$2b$10$cqOBstwexb7uBK5ydLLxWul7Uuu3uQy0vT2PUZcSXLsk5l1x/WGsq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 23:31:26.18+05:30	2026-07-09 23:31:26.295837+05:30	\N	\N	\N
773f303e-1a98-4d9b-9765-a6a6d46e9e8e	bbbb0000-0000-0000-0000-000000000001	$2b$10$64Ynq76JzBaP4EpVMa3N/eHWbHF/YqyoLpVG1yCg.UfO3dIQx6WEu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 15:49:47.033+05:30	2026-07-06 15:49:47.309297+05:30	\N	\N	\N
6fae0113-23e2-4c06-8997-82396a2354bb	bbbb0000-0000-0000-0000-000000000001	$2b$10$lYVLREstikaQ6RV9uYuXkOXwuY/WZOxU6SY5O6kU7QZNXEheun12S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 15:49:47.031+05:30	2026-07-06 15:49:47.60661+05:30	\N	\N	\N
d7843266-4923-4b89-b9e1-259b1d0d5244	bbbb0000-0000-0000-0000-000000000001	$2b$10$mam4KDBZriP6ASxXhhVqneuzJlpC6sPRayEnUdMFzd1Nr7SNkuxAq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 15:49:47.042+05:30	2026-07-06 15:49:47.636317+05:30	\N	\N	\N
409e338f-d929-4dae-8118-89eefe6d9f3e	bbbb0000-0000-0000-0000-000000000001	$2b$10$5lKy.1JLInYeH16zVDhEP.CsY6STYaNHLag0yBcLYb.PecEj4xB32	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 09:46:47.854+05:30	2026-07-10 09:46:48.892727+05:30	\N	\N	\N
151bb0b2-7ae6-41c0-a140-9a5139a85c53	bbbb0000-0000-0000-0000-000000000001	$2b$10$tmHI9pATvvVnMyDvfYDpSu9JHlkf/2QFc0SOL5b6soBDtGtiwj.L6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 16:26:14.25+05:30	2026-07-10 16:26:14.953947+05:30	\N	\N	\N
d48212eb-2133-468e-9e3f-29adf7f9f230	bbbb0000-0000-0000-0000-000000000001	$2b$10$ga.63lZ0pvSWLHZBevxMu.yiB3p19Qt3TtdQFW0TjFRZTg3OrPmIm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 15:49:47.027+05:30	2026-07-06 15:49:47.708605+05:30	\N	\N	\N
bf497d84-1f57-42cf-bddc-c4cfa178f909	bbbb0000-0000-0000-0000-000000000001	$2b$10$5Zw555C7w5PeJGuchx/xCOnfdiGFMGkU24wrLlLCcTjt9J1hbpIpG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 16:06:07.976+05:30	2026-07-06 16:06:08.235057+05:30	\N	\N	\N
becfe86a-8f4b-4e25-8f60-22fc6bcb5497	bbbb0000-0000-0000-0000-000000000001	$2b$10$iQ.hL.eEYx2whx0i4sSZO.fnN4LEkSUSHcX1F1zZOhuVfREx7vmdW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 16:06:07.958+05:30	2026-07-06 16:06:08.275065+05:30	\N	\N	\N
7c131c18-83f1-4c9f-8782-f7fe19558571	bbbb0000-0000-0000-0000-000000000001	$2b$10$eShIUsax0lk4XWjHGacvA.0r1se5x4BURawGUKntXQz4gKUA6ucK2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 16:06:08.047+05:30	2026-07-06 16:06:08.339518+05:30	\N	\N	\N
b68cd355-e521-42e2-842a-ae4888a9eba4	bbbb0000-0000-0000-0000-000000000001	$2b$10$7Kk1RjOnF9EWv4tPCbSmV.88WlscDo7mtA4KB2dHg6QDzLBfUdP62	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 16:06:08.099+05:30	2026-07-06 16:06:08.405182+05:30	\N	\N	\N
df6b0c8a-a225-4f6e-a9aa-a6b8949dd7ea	bbbb0000-0000-0000-0000-000000000001	$2b$10$DBWqusp9WBGQqefhkQJdbOZOHCf92EIQ3v.bCW77MrilPqGPey5fq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 17:23:31.491+05:30	2026-07-06 17:23:31.731759+05:30	\N	\N	\N
876f58d5-d5ae-42fb-8da7-d8f90833a73a	bbbb0000-0000-0000-0000-000000000001	$2b$10$r0RfkculLVr5n32KfMkXKug8VpZPv3AMewFE8G2l5fcLecG1eKt/O	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 17:23:31.536+05:30	2026-07-06 17:23:31.763749+05:30	\N	\N	\N
2415ac43-1a97-4006-8ff1-20f5276029b1	bbbb0000-0000-0000-0000-000000000001	$2b$10$K1xn4joCwsc/WlZN8.bArOTtiC8XASGnN91CxWBq4SZzpy3MVFLkm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 22:41:44.199+05:30	2026-07-06 22:41:44.613011+05:30	\N	\N	\N
2ab98621-4c02-435e-a099-67cabb65dfac	bbbb0000-0000-0000-0000-000000000001	$2b$10$c1CcwAqqWriFs2AD.d/z5uEknqwczxxLBRSWPAMaoqliEJFEsSQva	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 22:41:44.449+05:30	2026-07-06 22:41:45.034312+05:30	\N	\N	\N
6cb4ff41-4bd8-4d6c-9288-ffeed6136117	bbbb0000-0000-0000-0000-000000000001	$2b$10$gnjksYv2fMIedhDq9FuxJuWTb0sd.Av3hi.gGUXBBhQio4QA1ZwdG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 22:41:44.452+05:30	2026-07-06 22:41:45.03733+05:30	\N	\N	\N
840f494a-7670-442f-85d3-2e761d57b081	bbbb0000-0000-0000-0000-000000000001	$2b$10$7c.M7zA5POXmaTJk2KKbU.zi9JZFNYM2sidL.7W.5MElbQ13LOIOC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 12:00:15.188+05:30	2026-07-07 12:00:15.701461+05:30	\N	\N	\N
408ea1e0-88c7-4be8-96c0-28381873f556	bbbb0000-0000-0000-0000-000000000001	$2b$10$8XQHgyMtFmhqQPQ93baZo.7iQcqPG0CjfTxC87xVEowR2dl9ZmbUO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 12:00:15.279+05:30	2026-07-07 12:00:15.767202+05:30	\N	\N	\N
d54d5a8c-fa5d-42bd-b316-3268bb200ffb	bbbb0000-0000-0000-0000-000000000001	$2b$10$cef/vLzSuV4jo0x5gbkiSOlPIhYjI4PXphre8aBTqj9ajaq.4fnR.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 12:00:15.677+05:30	2026-07-07 12:00:16.29178+05:30	\N	\N	\N
4addc89d-e537-414f-8c21-1175df7f6041	bbbb0000-0000-0000-0000-000000000001	$2b$10$LinyrOxJOl0uvo/xSIsxNOqiE3sV4iTvAA2qgzWtyPxzyZ29fuR7.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 12:00:15.679+05:30	2026-07-07 12:00:16.294004+05:30	\N	\N	\N
97cc103a-af75-4613-a615-e3fc44a2c22d	bbbb0000-0000-0000-0000-000000000001	$2b$10$qeEdlpz80oM5lBTJWXyLtOEAl5Zkfnw6atEe3DcZDRoJ5J09VT872	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:23:48.43+05:30	2026-07-07 16:23:48.666015+05:30	\N	\N	\N
aeab9f0f-5dd2-4622-af99-894ed32664f6	bbbb0000-0000-0000-0000-000000000001	$2b$10$YWHMAi4YzCsW/MzPs6I/B.XNDqZKVm3hHaKRHAUFTskSRngWa3Tdm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:23:48.469+05:30	2026-07-07 16:23:48.811084+05:30	\N	\N	\N
d46a823a-c557-494b-971d-07acbdd166e3	bbbb0000-0000-0000-0000-000000000001	$2b$10$8CpBABcT18wHEaG/tbxiP.fj859VrJ9AwnsKnnCyOtLTrRdR1swsS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:23:48.406+05:30	2026-07-07 16:23:48.825875+05:30	\N	\N	\N
95b811f7-43ea-4e40-a387-5fe6c4e778db	bbbb0000-0000-0000-0000-000000000001	$2b$10$mwDEe7aAYz0os3fNJApL0O91QEbLXmZ.rfQl2Sbu9o1xauOS1n02.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:23:48.502+05:30	2026-07-07 16:23:48.930802+05:30	\N	\N	\N
c10175c0-db52-41cf-8da2-866825af14d2	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$Jwx7QEpO7tOh2Rvzlymh7.mR2AedQgxIA4llQX1oAT4JMBugqsvgm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:53:34.681+05:30	2026-07-07 16:53:34.862727+05:30	\N	\N	\N
7f99ccda-fdb9-47f7-bd89-fac2d256e2ff	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$h.HnTax8r11EiiWcYeE3KuJiMdcvhpDx8wH0OQVmz1WiJsS3ySN6m	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:53:34.744+05:30	2026-07-07 16:53:34.947546+05:30	\N	\N	\N
84433eb1-14f2-4674-b814-aa84e98e9016	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$XHtywqJeq.kt6LotuoHCm.mXa/Y97kS1LCV3sHOPGxQxPhzCPlsIC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 16:53:34.741+05:30	2026-07-07 16:53:35.127352+05:30	\N	\N	\N
fcf0a238-9354-42e4-97ed-d8278cee011c	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$pWNjq5XgFdzOSr4ZHaW2g.Va633aq965IpxE6q8ClFGRMCuKw9Tia	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 17:12:49.486+05:30	2026-07-07 17:12:49.706316+05:30	\N	\N	\N
eba30a7f-8d46-47a4-8ab3-88a2df9d6bd3	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$AKSdGZ84pgrPYsbii0CnbO3lbi3mV2PFS/kpLa9eteWzU6Vp5sNsW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 17:56:23.008+05:30	2026-07-07 17:56:23.207574+05:30	\N	\N	\N
ba991e6d-eead-4b32-a8c2-2f48c1f0921c	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$VHrtWsWhXqbY1uMgafEIuui83JIByOoqvgVvWGIi28IfduvPCkbY2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 17:56:23.049+05:30	2026-07-07 17:56:23.213739+05:30	\N	\N	\N
c679e694-f3cb-47c8-91c7-3b035227ed62	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$XZH8zOUUOuz0BRR0917zq.e1/NDA4Ib79gbyTxD/oLjO5A0LYCE66	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 17:56:23.105+05:30	2026-07-07 17:56:23.373082+05:30	\N	\N	\N
bef66be8-0f56-41dd-bf08-95538cf59a3a	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$8C.zN7iDwDRCdFOl9IaXd.0mHDPZgDBUND2F1TKxUcX0WppJw.6JO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 17:56:23.031+05:30	2026-07-07 17:56:23.375757+05:30	\N	\N	\N
8a7fbf19-ab3f-4235-9cbd-f69d086f7606	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$6bQjLGZdwdwkni2jo6L4mesosH6ata8trDvuwdyLkSVNqR0XsJUz.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 18:12:24.951+05:30	2026-07-07 18:12:25.133353+05:30	\N	\N	\N
e5461588-03a1-4da8-859b-90281f8584aa	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$1MCt1pV.3sW21R/5MRgyceQN1sWsdBLF3tupnDgLJLdp4tuS9.7pG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 18:12:24.986+05:30	2026-07-07 18:12:25.196221+05:30	\N	\N	\N
8e2b1dd7-ae20-4922-96bf-166200701362	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$cvU.zRuaOHDkrOp9tQ2lnuuX4s1YRK9vyfl5oYvAqfSOrpGPAoC6S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 18:12:25.054+05:30	2026-07-07 18:12:25.277188+05:30	\N	\N	\N
2ea8a64b-2898-4a3b-ad86-c401fd876e7a	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$4CUqdmwm.HTsYq2IFRGEx.re4OggfS0gjfLgH79s1pt4Z.lG09pGy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 18:12:25.061+05:30	2026-07-07 18:12:25.425496+05:30	\N	\N	\N
61a3a92d-cdfc-4b3d-89ea-4ecbd3f1b2ff	bbbb0000-0000-0000-0000-000000000001	$2b$10$AL6rxQrMjv94p37R.MuHDOHEDis5aZNj3YekCtRtGLo1BMbKx88zi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 11:23:15.711+05:30	2026-07-09 11:23:16.194192+05:30	\N	\N	\N
3eab79fb-5536-4670-918d-406220717ca7	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$rsjfCHN7dHXd3iqVNJpVCOeNLi2oPHP0OtY75wHopPUUW/leT5lZK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 19:29:31.392+05:30	2026-07-07 19:29:32.129076+05:30	\N	\N	\N
1f0c6fa2-e142-4b90-95e4-bf793d16fcaa	4bdeab3d-bcbd-4d39-9c88-555cfda88116	$2b$10$CBeR6ggsRulV7pM0rIEe4.ELutGJMAKKa8igtaLr.6hVDgOUfSAhC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 19:29:36.373+05:30	2026-07-07 19:29:36.577086+05:30	\N	\N	\N
7bc09d70-84da-4948-baa0-e0534f2c4926	bbbb0000-0000-0000-0000-000000000001	$2b$10$V7qseBzyeCahAEgFhtHYV.fGKFd3CS0O2VMNwVsscqOaoS2ZHBHC6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 10:45:00.297+05:30	2026-07-08 10:45:02.831764+05:30	\N	\N	\N
ce2f1eee-17a7-47e3-bf19-8d0a7c1d99b3	bbbb0000-0000-0000-0000-000000000001	$2b$10$ELUQF1R8/MYPSprXXgoiBOCzVSWf9PomNZ5OlTg7fzR2Bs7ZJXaTW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 10:45:00.309+05:30	2026-07-08 10:45:02.856732+05:30	\N	\N	\N
96cbbc11-618d-4fed-930a-639eb35c1dca	bbbb0000-0000-0000-0000-000000000001	$2b$10$sPpRQHLsu5UdCCHb1ELEM.3uvWP/68PKdUROfOOeMzd/Eu.TynkxG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 10:45:00.322+05:30	2026-07-08 10:45:02.867171+05:30	\N	\N	\N
3d0ad6f9-607c-47b2-8161-8ffa106548f1	bbbb0000-0000-0000-0000-000000000001	$2b$10$0dBeSWZZ4GYnjg0pNyiuOuKsNLM6aUu1mTqXgT0ZcYqBRtD1PkbTa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 10:45:00.513+05:30	2026-07-08 10:45:03.23554+05:30	\N	\N	\N
cbf7bdcd-a529-45ca-92cd-9c7b3075606f	bbbb0000-0000-0000-0000-000000000001	$2b$10$3SZGAWk9ITLGRFWwj3EzsucJQYseJOYWp45Rw7/CKXhAzv1Yz4t8W	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 11:07:58.394+05:30	2026-07-08 11:08:00.31282+05:30	\N	\N	\N
49e82299-9f50-4a25-97b9-c891a6232789	bbbb0000-0000-0000-0000-000000000001	$2b$10$IjSwSrLKHcf218ibiGLYeerAKznOlvyZzit3tRk37/LEH0MctN5Vu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 11:07:58.804+05:30	2026-07-08 11:08:00.877083+05:30	\N	\N	\N
1df86cd8-1667-4da8-9011-74712a5623f8	bbbb0000-0000-0000-0000-000000000001	$2b$10$ve46zXchL0kYM1jUTM9uO.jSsFBpmaYsKy2cbLjJWN.4ElIlTE0hK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 11:07:58.826+05:30	2026-07-08 11:08:00.905121+05:30	\N	\N	\N
581b7597-27ca-4cd4-bec1-a67b0dc7f02f	bbbb0000-0000-0000-0000-000000000001	$2b$10$pK7CmsVs4TzyTGwqzZtUqOILpH8Uj6VgLQVl5Ppm2OXFe0sFRgJcK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 11:07:59.296+05:30	2026-07-08 11:08:01.432432+05:30	\N	\N	\N
bd92839a-2e00-43a0-abfa-d4e41f29c63f	bbbb0000-0000-0000-0000-000000000001	$2b$10$Sl58NfQI3.FQLPAUKsfkRuxCWheh4EwEfmFQtFLw.x3YPE.zyWiY.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 12:17:35.916+05:30	2026-07-08 12:17:36.700652+05:30	\N	\N	\N
3b48d4d1-ded6-4366-8f01-748502900651	bbbb0000-0000-0000-0000-000000000001	$2b$10$Nz41u.w42WUwlt9C2ehGyuc4p8Rda1Nqcu7NfSJWmaiBcf7pTp9/G	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 15:18:55.003+05:30	2026-07-08 15:18:55.446439+05:30	\N	\N	\N
9805fabb-1b6f-4970-982e-2a90aa43d9eb	bbbb0000-0000-0000-0000-000000000001	$2b$10$M.7yEAzktsIYG6ROSfra8Ot8iunVILURGv5LmOfg7qltuCgYnFz7u	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 16:19:57.652+05:30	2026-07-08 16:19:59.898129+05:30	\N	\N	\N
29f015fe-ff44-4752-8ae7-04935a0594e3	bbbb0000-0000-0000-0000-000000000001	$2b$10$m1ptknXU1QxS7tWaqhxFROE1ThlJI1TmBy9bPjxE92/gfgAvD/6PW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 16:19:57.971+05:30	2026-07-08 16:20:00.268309+05:30	\N	\N	\N
f4dcfee1-3c8d-41c0-99df-97eeea56b412	bbbb0000-0000-0000-0000-000000000001	$2b$10$UYNYOc1/A4Flruoo3K1atu24q0U4CSS.h1xGsHzTGsamHUks08R8.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 16:19:59.864+05:30	2026-07-08 16:20:01.787304+05:30	\N	\N	\N
eb07d5d1-488e-4151-a156-32f4a8bd71e6	bbbb0000-0000-0000-0000-000000000001	$2b$10$BgoIAUUX4Ub8mSr5WEMWe.C/.igdUebastoTDcnEKQkP5X3zqQugW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 18:13:41.74+05:30	2026-07-08 18:13:42.21046+05:30	\N	\N	\N
ed86f783-e6b6-4ecc-ba2f-829d1b8f1c78	bbbb0000-0000-0000-0000-000000000001	$2b$10$yxtyU59vUAaYI6sfz4YCi.TRv3iY/b8XceQ6PeUlU1ceu4CTW4oj2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 20:48:53.629+05:30	2026-07-08 20:48:54.729744+05:30	\N	\N	\N
6c24b04b-bd03-4b75-bbee-a913ab021723	bbbb0000-0000-0000-0000-000000000001	$2b$10$l/kNo2ICekpmhz8RzusBVeS8RpVqR.EdswDmTbPOtdE0bKQO2RY3u	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 20:48:53.601+05:30	2026-07-08 20:48:54.954428+05:30	\N	\N	\N
3db66d15-eaaf-4ffc-9953-317615010b79	bbbb0000-0000-0000-0000-000000000001	$2b$10$iVgRIb.WCnpQCTLdPd/E8.ijLm6u6AJRPHkaRZtsvrBu786eDMt06	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 20:48:53.666+05:30	2026-07-08 20:48:55.433024+05:30	\N	\N	\N
5b2fd4b9-45c0-4ed0-8768-5746c2cfcb07	bbbb0000-0000-0000-0000-000000000001	$2b$10$jm8e3Ss2us8zrXMVlg86eOHo4VQBnH0U2ygu4bqCFCJLXV82l/yb.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 20:49:00.667+05:30	2026-07-08 20:49:00.920275+05:30	\N	\N	\N
56bfc009-189f-45e1-8a71-bc05d828fadb	bbbb0000-0000-0000-0000-000000000001	$2b$10$WpicuOosXajNTjdMbo9ZQ.VLRNl0Z5zzFCOhxCgrdnihhVh9VHpL6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 22:57:25.749+05:30	2026-07-08 22:57:26.300412+05:30	\N	\N	\N
5a2e16b4-c4df-4802-a6ba-3ae0adbb62f9	bbbb0000-0000-0000-0000-000000000001	$2b$10$cPDdsQAlKPHE14qhqrlUxOep.Ohnan4et639K8EvAUL2pBntFPLc6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 23:01:59.146+05:30	2026-07-08 23:01:59.854173+05:30	\N	\N	\N
9b9e27c9-e890-444d-b4d3-6fd2b6ec4493	bbbb0000-0000-0000-0000-000000000001	$2b$10$o62mMVW3J8duAGtExxTMRufxPPfww09anvpngYymEmKamOFVoP5WK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 23:02:57.931+05:30	2026-07-08 23:02:58.322285+05:30	\N	\N	\N
3128c750-12a7-4123-b1a6-933bf67e3085	bbbb0000-0000-0000-0000-000000000001	$2b$10$6Tl42zZLwp3Y8HznGpQSD.jOCdlFCD8PP9etpYiXliu1IhKWzEPu6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 23:03:11.429+05:30	2026-07-08 23:03:11.795693+05:30	\N	\N	\N
61a37742-2a4b-4b34-b18a-d6ef623684dd	bbbb0000-0000-0000-0000-000000000001	$2b$10$GIXiia.ZbmrZ9Yncq3OXX.EeQvWNnyJnwscNeDE76GnlaVCghBzpa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 09:44:57.25+05:30	2026-07-09 09:44:57.388321+05:30	\N	\N	\N
1fabc411-0f8a-4203-ab5f-65902c7015f3	bbbb0000-0000-0000-0000-000000000001	$2b$10$e30q.j4.4HY1BoEfwv15MuGxOgnA7QU4kd9uopXfugmwZn169.Qm6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 09:44:57.254+05:30	2026-07-09 09:44:57.421645+05:30	\N	\N	\N
f3290603-6b5c-4b25-a7c2-3acde01c0c58	bbbb0000-0000-0000-0000-000000000001	$2b$10$Pda367JigfFF/kHrdtuOauDN.ipJrk8WWQCQAyCnnfAtLwhY0yW.a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 09:44:57.258+05:30	2026-07-09 09:44:57.781189+05:30	\N	\N	\N
2bbdd86b-57fb-4fd5-9219-31c5e0c3f5cf	bbbb0000-0000-0000-0000-000000000001	$2b$10$odHGDI95DjtOFXSCPUj8W.IxdAV9gXktaqdD7SehO9iyLk0Wj4GjO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 09:44:57.285+05:30	2026-07-09 09:44:57.821729+05:30	\N	\N	\N
9751f00b-fbc0-40eb-ba2e-4284a985295b	bbbb0000-0000-0000-0000-000000000001	$2b$10$lDdMCpyhyZ2AQ0MsPkPxjurqFwvrzHiHU8pjKFyLaS.9T0.zXoCo.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 09:44:57.377+05:30	2026-07-09 09:44:57.904218+05:30	\N	\N	\N
af6ac881-f099-40dc-8e15-68ece382cc3f	bbbb0000-0000-0000-0000-000000000001	$2b$10$rsj8RX8a3JF50HKb090e4.Cxabn0Io94s5OU5yROrVtWQ7Vjv2MsK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 09:44:57.388+05:30	2026-07-09 09:44:58.080673+05:30	\N	\N	\N
5c331e98-a15e-4444-8909-db833d1338cb	bbbb0000-0000-0000-0000-000000000001	$2b$10$BVKdDO9B0JemiXP5jWmSH.aL0L8Ko7odvXTWeFvU8aqZovXK5/OhG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 10:42:14.497+05:30	2026-07-09 10:42:14.732181+05:30	\N	\N	\N
8b84d859-7b0e-43ac-b912-3a7b8a96ea03	bbbb0000-0000-0000-0000-000000000001	$2b$10$87CU112Pw5wMONRBJ9gP5ub4GZT0EJg4ERypbtHKYWc0TMEcdie.K	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 10:42:14.62+05:30	2026-07-09 10:42:15.141632+05:30	\N	\N	\N
548750b2-07cc-48b7-b6d5-94632c186306	bbbb0000-0000-0000-0000-000000000001	$2b$10$vLlMpHrSuiFbr3J1yg0F5ecVkdyxNE/5XiLRjhxiO71NaYUmK99qu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 10:42:14.68+05:30	2026-07-09 10:42:15.215456+05:30	\N	\N	\N
f848eeed-85d2-4d9d-98a1-fb5e5d032395	bbbb0000-0000-0000-0000-000000000001	$2b$10$5g7f7Eb0KnA7a7s4jbeUO.kYqQi.viKjpInTb3VIP2jtG1OEaY3HC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 11:23:15.717+05:30	2026-07-09 11:23:16.235023+05:30	\N	\N	\N
6dbca44c-5689-4891-8180-52dc7d953402	bbbb0000-0000-0000-0000-000000000001	$2b$10$xu6/7HxNm11fi/MlkFdlsuLCEND8nmXlbrz12dj.xcWS3s3iTb5ku	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 14:29:24.705+05:30	2026-07-09 14:29:24.924303+05:30	\N	\N	\N
c9ddb31b-5923-421e-9de6-e518209ee80e	bbbb0000-0000-0000-0000-000000000001	$2b$10$aVm4jpxMDvG91rtsv/KZR.Vo65tkt0YVDnTYwrMnDO2eIRbewNsV2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 14:29:24.709+05:30	2026-07-09 14:29:25.113463+05:30	\N	\N	\N
a213d65b-a149-4e26-8b33-5c1df6005524	bbbb0000-0000-0000-0000-000000000001	$2b$10$g8rU7cHaTmoVRql9YGFHDuOpWhRSHHQugZvZSJpAUWBJ6WMdIeCxu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:10:36.9+05:30	2026-07-09 15:10:37.372604+05:30	\N	\N	\N
8e9e7feb-2509-4ec3-9cfe-26bbd13b242c	bbbb0000-0000-0000-0000-000000000001	$2b$10$IdqzbxOtyV7n.Wr3dFAfxebTdUHdSvNSBp.ZIl1QrCR.qW3goA0kO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:29:04.37+05:30	2026-07-09 15:29:05.351971+05:30	\N	\N	\N
51dd76d1-378a-473c-b0dc-a878b6134fd0	bbbb0000-0000-0000-0000-000000000001	$2b$10$5vrIc5AOP7nIX.yV5FhjQejnzlpp77gI86BIi.0Ft422Cv5BHwT2S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 15:29:04.543+05:30	2026-07-09 15:29:05.400465+05:30	\N	\N	\N
9dc2a668-9624-47de-a48a-dba155838278	bbbb0000-0000-0000-0000-000000000001	$2b$10$.45QXTdEm6Rh1S75m9YT3eXotzEsJvqWh790wK6PhGUFGThBHITnS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 09:46:47.702+05:30	2026-07-10 09:46:48.779979+05:30	\N	\N	\N
600509e6-d045-49a3-8d0d-9f3b8b820b70	bbbb0000-0000-0000-0000-000000000001	$2b$10$WAnDVxg2QeqsTTG8k7PvKOFGlG4sMKd5CBaAKWWpYtapdTxdbS5Xm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 09:46:47.949+05:30	2026-07-10 09:46:49.002492+05:30	\N	\N	\N
f285fdaa-cec6-412b-945e-7a33cbe6d827	bbbb0000-0000-0000-0000-000000000001	$2b$10$odc20QvKp7aRgHRTKGVfRuMq5mOwu5LNaJ5dsSn7NQGPBN3D5bLYq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 16:26:14.254+05:30	2026-07-10 16:26:14.992636+05:30	\N	\N	\N
611d7aff-1124-4ba2-a693-034a4ea25e2b	bbbb0000-0000-0000-0000-000000000001	$2b$10$VNmB4UYcCR0xPJE9YUnJIug2e8eUZORsjugv.whOr9Q06VoRwk/dK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:24:38.747+05:30	2026-07-10 17:24:39.668542+05:30	\N	\N	\N
2cdc226c-c776-4ffe-b960-e3dfbaf50a52	bbbb0000-0000-0000-0000-000000000001	$2b$10$5sVmAI42VOT4xBHDcE2kyepzbA4OgvX7VOjySIM9KBgHDfeE7aI6.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:24:38.724+05:30	2026-07-10 17:24:39.925884+05:30	\N	\N	\N
e171ce75-77a7-4b7f-88b4-b960b44b334c	bbbb0000-0000-0000-0000-000000000001	$2b$10$rccBQjLBSOXMxhQCHnqI3eajPu0oTpq8B0BIYJsSWpilCDTXBlfga	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:39:47.694+05:30	2026-07-10 17:39:49.064578+05:30	\N	\N	\N
db75752b-72fc-4754-bc69-35932ecd787e	bbbb0000-0000-0000-0000-000000000001	$2b$10$lv.XgQSJWsEdVwlvAC5nIumZaf/wJZSnzFCVliaOWvCLTm5QwpAme	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 17:39:47.736+05:30	2026-07-10 17:39:49.239197+05:30	\N	\N	\N
e38ea84e-a3b1-47d4-92cf-ca36f346e210	bbbb0000-0000-0000-0000-000000000001	$2b$10$Qa6YhrsXwZGvWLDx/ZxNx.x3ZN5SeTssTYE9I1xBT5Gl2Rfbrz2kK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:02:42.014+05:30	2026-07-10 18:02:42.438489+05:30	\N	\N	\N
733271e5-aa1d-4bc7-80d7-3fbcb91a8952	bbbb0000-0000-0000-0000-000000000001	$2b$10$JQjwv0x89PLbz2pCavNKUOl9wToRdJNs221j/xVZB46NNkyQ0BDjO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:02:42.035+05:30	2026-07-10 18:02:42.691975+05:30	\N	\N	\N
111bf42c-832a-4370-a87a-3428bc721711	bbbb0000-0000-0000-0000-000000000001	$2b$10$7nznDy/uocbUekcvl/BMD.YZnXlyjzOVg6aZN3F48pZniAxZtoWnC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:20:31.751+05:30	2026-07-10 18:20:32.01186+05:30	\N	\N	\N
18827068-8c23-4b5d-8816-7f61b83c0b90	bbbb0000-0000-0000-0000-000000000001	$2b$10$.JUQ1vVmnJaT0p5ZjcyHsOR8KXQrOjAhJctBPzXeV3.dOLz7orPry	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 18:20:31.761+05:30	2026-07-10 18:20:32.304965+05:30	\N	\N	\N
22b3f556-ffd1-47d8-9151-863ded838181	bbbb0000-0000-0000-0000-000000000001	$2b$10$aEIuPh1g8Jyy1C0yhP.DWOG/aB6kgHyfpXY8N56HMwhhRDr25zPfq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 22:31:22.586+05:30	2026-07-10 22:31:22.773927+05:30	\N	\N	\N
654bbfbc-c4c5-4375-bd01-1a955d57d77a	bbbb0000-0000-0000-0000-000000000001	$2b$10$aJglAFvgoDTFyOjtR3qVyeC8GqnIyGGomxQXtjVSCFuXAw5SY152q	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 22:31:22.592+05:30	2026-07-10 22:31:22.849356+05:30	\N	\N	\N
0b247539-cf09-480b-a27e-92b177d04709	bbbb0000-0000-0000-0000-000000000001	$2b$10$FHDhx6H18X9/gWaF09aUv.sEJ0lTGCn.HKbEV/IKh6HazwA42wOSG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 00:28:47.916+05:30	2026-07-11 00:28:48.218563+05:30	\N	\N	\N
02de7ef8-0d00-4b98-94e5-771f910fa49a	bbbb0000-0000-0000-0000-000000000001	$2b$10$lMW14mk0ulF23taz.N3dDOTBk9jdGbI2Qlo9qQ.5xvz4ffyNT6rsW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 01:00:23.875+05:30	2026-07-11 01:00:23.974369+05:30	\N	\N	\N
fdda721f-91dd-4e1a-8c06-2cb8453f5891	bbbb0000-0000-0000-0000-000000000001	$2b$10$3OJqr2ey/JXqbT7roz7SzuFvHUYkeLaolFDHpSY0KB8A7DpQAO5yy	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 10:06:02.962+05:30	2026-07-11 10:06:03.20798+05:30	\N	\N	\N
9fd75e38-d229-4a06-9bcb-67941dcd8781	bbbb0000-0000-0000-0000-000000000001	$2b$10$TxSuThXhC7eY0ArFNhvFh.bhN4xBZY4PruPSfAbLrTcE4BD8p2bR6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 10:06:02.966+05:30	2026-07-11 10:06:03.375749+05:30	\N	\N	\N
40cb07d3-7c7b-4a82-a397-8486da4af24e	bbbb0000-0000-0000-0000-000000000001	$2b$10$qtEqSCUI8l0DODZbJlclC.Q7f8VkbaZ8vvn.O/ta8z2Ybq/UnmAeO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:06:03.454+05:30	2026-07-11 11:06:04.009021+05:30	\N	\N	\N
a3feee8f-144d-40a6-bc6a-1e514762f701	bbbb0000-0000-0000-0000-000000000001	$2b$10$KNqVwyKdqsTP3i.C98P4cekXkdVW/wowC3mnvK/przWM.ZPZ7OUmu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:06:03.473+05:30	2026-07-11 11:06:04.412372+05:30	\N	\N	\N
2ab309a8-7813-4b9b-b529-ad4e7850b5a2	bbbb0000-0000-0000-0000-000000000001	$2b$10$bRLqjmy2Crbv1ldgJDG4OepXoZovh1RhLdqmdNziXusPLn2OcUwuK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:06:03.476+05:30	2026-07-11 11:06:04.430994+05:30	\N	\N	\N
8e4a5336-d282-405e-b924-42252c5538b2	bbbb0000-0000-0000-0000-000000000001	$2b$10$dTkQqtpCWvx.lg0D7UI2PuHTolAO9zpqJbCzv96cKlSCfKAe13sRq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:22:13.997+05:30	2026-07-11 11:22:16.868792+05:30	\N	\N	\N
cf8783d3-ce12-44f5-80dd-cf7946ef325d	bbbb0000-0000-0000-0000-000000000001	$2b$10$xPyLrOBXorKQyWhY5znoS.wYQNZA4T2nT14OZza81Nf6d2ySgPob2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:22:13.975+05:30	2026-07-11 11:22:16.960602+05:30	\N	\N	\N
1f599086-6d49-46c9-b255-d8d60b12e62e	bbbb0000-0000-0000-0000-000000000001	$2b$10$BLKpaLbl.jQI/HUAyt9RDur9QzTRMeJjzNXFTmOrLWeWLOf6UIqEa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:22:14.006+05:30	2026-07-11 11:22:17.076221+05:30	\N	\N	\N
45ab2c1e-89fa-4875-b6f3-1afef2957107	bbbb0000-0000-0000-0000-000000000001	$2b$10$Eun6XiewovTLaWeYjcDav.QcnfJ9KamriEUpC/uV51wzVXCKWpVQq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 11:22:14.08+05:30	2026-07-11 11:22:17.244199+05:30	\N	\N	\N
0e642c23-8648-4969-853e-cca222380fc6	bbbb0000-0000-0000-0000-000000000001	$2b$10$x27nwW.fl3rq.k9YZdRKzO993dZ4UojIO6OhJmjytV2333/Son26a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 12:06:02.464+05:30	2026-07-11 12:06:03.785683+05:30	\N	\N	\N
5a929bf8-cbab-4afb-8ea9-765f1a733663	bbbb0000-0000-0000-0000-000000000001	$2b$10$S8LSsH05x3r3a8QOmj2/WOY24y/2ZMKi8ia.XiBoIrWGRVd3Uaz/.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 12:31:17.914+05:30	2026-07-11 12:31:20.047621+05:30	\N	\N	\N
25ac8f53-2d79-4ea4-bbf1-3da395a8c432	bbbb0000-0000-0000-0000-000000000001	$2b$10$F9b5xHhLRP3T08IpecdNduD/eu/NKmzMVynBibGoZv//sS4YhlG/G	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 12:31:17.985+05:30	2026-07-11 12:31:20.276574+05:30	\N	\N	\N
6add77b4-fb66-414e-b0e5-f64fa75a7a1a	bbbb0000-0000-0000-0000-000000000001	$2b$10$SPaCUIFTZ9QVWOYexoqa8.uAnNi64EEHW62n5dJRMj7m9oF8DsS7S	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 12:31:17.958+05:30	2026-07-11 12:31:20.344318+05:30	\N	\N	\N
79682f6f-7bbb-48d5-9a1f-78d04c254023	bbbb0000-0000-0000-0000-000000000001	$2b$10$NsP1KZxmug9usYRkpUfNY.5fQ8SybVlYB99HWITXKtQwvq33gUgHW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 12:31:29.563+05:30	2026-07-11 12:31:29.931585+05:30	\N	\N	\N
e9402479-3fb0-4ef2-bf82-da356e9e2b7e	bbbb0000-0000-0000-0000-000000000001	$2b$10$VvgT7oS0bZ8EW4D7bDqfJ.apkIrZdqk0A0raWX/rBfCEKxoSaJCQm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 13:13:15.991+05:30	2026-07-11 13:13:16.838988+05:30	\N	\N	\N
440888a4-75c5-4f87-a950-661a8069fa41	bbbb0000-0000-0000-0000-000000000001	$2b$10$e/MJYQuUlVYm4xy0N23CVe/u9bMi5bdapqkXdfUCbIyFECdI6MpPC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 13:13:16.161+05:30	2026-07-11 13:13:16.978622+05:30	\N	\N	\N
baf4dcd7-4962-4261-be87-d88720b2fb91	bbbb0000-0000-0000-0000-000000000001	$2b$10$dteZr7.UV8cuP3n8LRyPB.50nzk2YqWOErbLMBgBlKR8SzBVtap56	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 13:13:16.302+05:30	2026-07-11 13:13:17.143245+05:30	\N	\N	\N
5f8d7681-d175-468a-80ce-42c7ff51eeba	bbbb0000-0000-0000-0000-000000000001	$2b$10$9PD26YOR6W/pCJbpdiZxl.ErcZDi7izIOfc/TPB2HRrMb2oLjrMPe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 13:40:47.958+05:30	2026-07-11 13:40:49.051452+05:30	\N	\N	\N
be58e506-3104-4c02-ae6e-7b7f6db43241	bbbb0000-0000-0000-0000-000000000001	$2b$10$tygzD1xdReRu7kCjKg/o7O/bcJnvtMJbu2gmL9dIrTDHtEMpYuAPu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 13:40:47.939+05:30	2026-07-11 13:40:49.221173+05:30	\N	\N	\N
91e86e25-45b2-4600-99fc-a05826b7c62f	bbbb0000-0000-0000-0000-000000000001	$2b$10$ZuTQBSIo/IWNR/d6pZ4DCuvlB4.rtGTzR6aZMX8qG.pEc6iuWijGq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 14:18:18.127+05:30	2026-07-11 14:18:18.349269+05:30	\N	\N	\N
0bf9cb93-d244-4eba-90c7-ac576ab7d375	bbbb0000-0000-0000-0000-000000000001	$2b$10$kMKGqH8W8xzPh1hDRgL5h.kD9CIT00DCu9Z2dIjpmUr63Wg1xQG.K	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 14:18:18.159+05:30	2026-07-11 14:18:18.368948+05:30	\N	\N	\N
3fd265d3-ad3d-4bc3-a6b1-aac5aec7d9ec	bbbb0000-0000-0000-0000-000000000001	$2b$10$Qkekteik0zvPUre7BKQCXuYbIieqezbGUklVsqqUcfW4aEkngyNdG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 14:18:18.154+05:30	2026-07-11 14:18:18.383896+05:30	\N	\N	\N
9b1b8da4-3043-43de-b4be-25d85bd59999	bbbb0000-0000-0000-0000-000000000001	$2b$10$pLSoEISManqy.nU/Zlagmew.B/Zhbj0u9aoidzi.Mt7XDeFP6hRy6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 15:04:36.369+05:30	2026-07-11 15:04:36.50855+05:30	\N	\N	\N
23343e47-299e-403d-b902-1afb40581481	bbbb0000-0000-0000-0000-000000000001	$2b$10$lbev1KdYD8ACpog8FiT9S.QbYoCWHvBsKxwpT.wQPIcfOdLtr27oW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 15:04:36.452+05:30	2026-07-11 15:04:36.632413+05:30	\N	\N	\N
f9105721-4c78-46fa-a286-128e8aa560d6	bbbb0000-0000-0000-0000-000000000001	$2b$10$LGFgsdcaotlUs2BJbQcDKObiFyTuUw1cSULULJSNW/ch7KzJwRwOG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 15:04:36.502+05:30	2026-07-11 15:04:36.684945+05:30	\N	\N	\N
18d717c1-d52a-46b8-a23b-6f4807bfa7c5	bbbb0000-0000-0000-0000-000000000001	$2b$10$qoXgCaVhkOJBGaP3eDkcFe0pUV7WQrJ9cTMZnm/LYNyWkFtRcjOA6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 15:30:35.879+05:30	2026-07-11 15:30:36.067999+05:30	\N	\N	\N
46805dbe-81ec-4177-aaf5-043bddc21956	bbbb0000-0000-0000-0000-000000000001	$2b$10$J.MjGLHzgJ.DdJoGT5r8Hucjg9tX5fvJSawKmroXpHYAoryIZ3zYq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 15:30:35.938+05:30	2026-07-11 15:30:36.112695+05:30	\N	\N	\N
edb523ca-b654-4829-8fff-04f7c0a8c35b	bbbb0000-0000-0000-0000-000000000001	$2b$10$5SBpbMrQx2vf./mi7vc5QuKFPWu3tdoQGb/G3rCsNu1.yCs3bvoYC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 15:30:35.969+05:30	2026-07-11 15:30:36.165773+05:30	\N	\N	\N
d13ad624-69a2-432a-a34e-9f38c29068b5	bbbb0000-0000-0000-0000-000000000001	$2b$10$tSObjtAOd2N9JSB9Nrx0neXensqsjzElFP7yB.XywIkjxnuVXygya	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-19 18:15:10.932+05:30	2026-07-12 18:15:11.328406+05:30	\N	\N	\N
722dc4ef-5aa7-4039-9624-404f2552c46c	bbbb0000-0000-0000-0000-000000000001	$2b$10$pilzwE.muui83lPYkpuzp.Ffd5L3B8zIko1FLrxsO9iIerIWZSTc2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-19 18:15:13.573+05:30	2026-07-12 18:15:13.802635+05:30	\N	\N	\N
761ccc89-2318-4688-8662-5b685f278a2b	bbbb0000-0000-0000-0000-000000000001	$2b$10$EUBJhHJLIenQv5EgDOCJte0b1P9NK05S0pI1fwbC3dP7yfC9N/zQK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-19 23:23:28.096+05:30	2026-07-12 23:23:28.644076+05:30	\N	\N	\N
2a79b6ed-2bb5-4dae-8b41-3f1362468a01	bbbb0000-0000-0000-0000-000000000001	$2b$10$H3WNpP4G03SDPxrS/qtEnecGQWe7q5v//sLJkvj665DJfg0kshi.O	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:10:38.341+05:30	2026-07-13 00:10:38.75417+05:30	\N	\N	\N
c1f2a8ea-1f7e-4f3c-a4af-13e7745f53c0	bbbb0000-0000-0000-0000-000000000001	$2b$10$KKiaPZwhCnvDoecvzdYL8..QvyFfaXD2FtXXF6i6Z.aOxVAvdSlWK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:16:43.481+05:30	2026-07-13 00:16:45.2561+05:30	\N	\N	\N
4fd7abf9-8308-4a28-a7ce-567bb6214001	bbbb0000-0000-0000-0000-000000000001	$2b$10$jaRApK3/zAkM/TNtlGSlNe/gd.7srkq34xKDz4bx/ZjDJkthMoI5.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:16:43.569+05:30	2026-07-13 00:16:45.536301+05:30	\N	\N	\N
cb8d36a3-4951-442e-a79c-7199bfe97a1a	bbbb0000-0000-0000-0000-000000000001	$2b$10$gEodEp1Bkq0lGhMPzgQmA.HUkzwtdD0Af4EOVS96IpMvoePJMhdpK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:16:44.143+05:30	2026-07-13 00:16:45.897412+05:30	\N	\N	\N
dd3d6929-e703-48da-987d-ce2e95a572a9	bbbb0000-0000-0000-0000-000000000001	$2b$10$cHhKxPY1F/ckIB8n71khRubpAfVOTH.fl.7JUSuLDbNW8A1W140uq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:16:44.15+05:30	2026-07-13 00:16:46.015308+05:30	\N	\N	\N
cff514db-e4f5-4c02-a353-0433d8182b15	bbbb0000-0000-0000-0000-000000000001	$2b$10$C/d.woFWKst04uxehkRvGu6f0XN1Tz6x02LGJb4Xuqg4QVBXM7D.2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:30:08.687+05:30	2026-07-13 00:30:10.044337+05:30	\N	\N	\N
25f55b69-f69b-4333-92de-9003d66d2536	bbbb0000-0000-0000-0000-000000000001	$2b$10$Y7s.EWOlAEdGOeRRTjNaZOw9kzFrELTN32TieVe0jrd01KWe8/1Mu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:30:09.055+05:30	2026-07-13 00:30:10.27721+05:30	\N	\N	\N
ee4318b8-d630-41aa-91e8-01bd7d4012ac	bbbb0000-0000-0000-0000-000000000001	$2b$10$7R8OGi/hWSr.w/rKWqTWPed4US1V4dOi0CZOiOG8tFUfHAytTVzjS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:30:09.699+05:30	2026-07-13 00:30:11.106075+05:30	\N	\N	\N
f8564cd1-b806-43c6-99d7-0c7dde789767	bbbb0000-0000-0000-0000-000000000001	$2b$10$0NGJL5jnteb9ryu.KWk/je6lC67iSmr3p7oiqqCN/8Mw9eTMYQOP6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:30:10.312+05:30	2026-07-13 00:30:11.159838+05:30	\N	\N	\N
d9c20395-b310-41ec-b9ba-f9b97c4cc88d	bbbb0000-0000-0000-0000-000000000001	$2b$10$7NAtSTztGZjNi06nyKYRrOoZ6ROyerp4ygb3yWPXvu7upIczhetZu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:30:19.249+05:30	2026-07-13 00:30:19.887721+05:30	\N	\N	\N
6a9fced0-f13c-42ab-a988-d0577fc39b80	bbbb0000-0000-0000-0000-000000000001	$2b$10$oHTr7rT5MxTFQdO7w1OsB.LakJpIb8db.oBkYDFCO1NaKNBYWXbP.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:32:21.162+05:30	2026-07-13 00:32:22.686371+05:30	\N	\N	\N
359a0fe8-ae85-4b4f-abea-ff4ce3b9f90b	bbbb0000-0000-0000-0000-000000000001	$2b$10$u0USeKKo8wr44XiTMqAdCemjQ67AXgtTEimEyfRugZDOo8uz1iFGO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:32:21.265+05:30	2026-07-13 00:32:22.843298+05:30	\N	\N	\N
e64f9aed-c06f-424c-b866-8fa256de3a25	bbbb0000-0000-0000-0000-000000000001	$2b$10$yNechyM/pZvk5xEWrgvl3.4LSWKhMYRUT9S2zEtAJo5l6AUPUePKS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:32:22.031+05:30	2026-07-13 00:32:23.87741+05:30	\N	\N	\N
eded0c6c-d0f4-4846-8402-244dc0a2eb2a	bbbb0000-0000-0000-0000-000000000001	$2b$10$BL/l7kw2vW.qHpq2JJX.H.QbDqv9NMU7RtQsgjwpkTvZvRU70jSQW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:32:27.309+05:30	2026-07-13 00:32:27.744537+05:30	\N	\N	\N
cd41442b-7b29-4a4e-ab0d-d0ad580149f2	bbbb0000-0000-0000-0000-000000000001	$2b$10$aw.GEj6dr0X8Wc5t.Fmq..lwKas/Ltovyd4uu9sVdXHHNucgLvDhe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:53:22.384+05:30	2026-07-13 00:53:22.840042+05:30	\N	\N	\N
de3f1a9a-6013-417a-b86f-dd6c604dc441	bbbb0000-0000-0000-0000-000000000001	$2b$10$EHzSeYwoqRvTiY0M.wDD1eUOC2ewPV/iRVG5hlvJMReWxECvBIi4y	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 00:55:18.108+05:30	2026-07-13 00:55:18.585348+05:30	\N	\N	\N
de61f26b-b3b8-4d44-82a8-05789077f988	bbbb0000-0000-0000-0000-000000000001	$2b$10$GiCoQnXlT2WKO3WwA0fg8uU1mrLeh2n/z2V1HYF8g5eTN89FoSUSe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 10:13:31.354+05:30	2026-07-13 10:13:31.850601+05:30	\N	\N	\N
99695120-1ee8-4580-a52a-f8e51fc1e9d3	bbbb0000-0000-0000-0000-000000000001	$2b$10$JFyv4udbBaR.eqbArfuAguTgfCdNecCZZaaM8Y7Vmk8FStfHCksk.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 10:13:31.324+05:30	2026-07-13 10:13:31.90892+05:30	\N	\N	\N
f864ca2e-0b5e-4c7d-8e14-a3740d027f97	bbbb0000-0000-0000-0000-000000000001	$2b$10$tddtjB5cMzHgj.4Uh2TpiOloEjgzpwVa9Ur1dzqLDarxcm9Hw6dKm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 10:13:31.343+05:30	2026-07-13 10:13:31.960599+05:30	\N	\N	\N
097defab-f8a6-4079-98de-441f9a6b874e	bbbb0000-0000-0000-0000-000000000001	$2b$10$xpcZp8caFOraE9w3Az/MRu9DfG1M6QbHtdyqvNLhWDyG0XzCxe1Se	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 10:13:31.584+05:30	2026-07-13 10:13:32.19953+05:30	\N	\N	\N
438d2c55-5a24-432b-82a4-24e67676e732	bbbb0000-0000-0000-0000-000000000001	$2b$10$2sxYOQ4zL2oifg9Q7/vR7uoYaO6x4N5VMF9e3bqtsLcxo40yjotVu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 12:03:28.216+05:30	2026-07-13 12:03:29.026245+05:30	\N	\N	\N
ba0a443f-53fd-453f-861d-cec77ebd884e	bbbb0000-0000-0000-0000-000000000001	$2b$10$dXvA32OKI3BaWxbjBK917O3ghHfjziJHFy3mpl6YfmRrsCVx9/wYW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 12:03:28.369+05:30	2026-07-13 12:03:29.193858+05:30	\N	\N	\N
6fc544b0-d700-4f3d-80be-31e739aa25f8	bbbb0000-0000-0000-0000-000000000001	$2b$10$EdBZpsmIrGqywSzAwUQkSeBUkINaJwVparZ8ijoLUKsve1ACxmM3a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 12:03:28.454+05:30	2026-07-13 12:03:29.293772+05:30	\N	\N	\N
c993c1a4-3e71-4e8f-8683-9e065f1ce20a	bbbb0000-0000-0000-0000-000000000001	$2b$10$eSRWCXT7JnB0KD1J6IpJxuDpggMjhJo8vjCaAoLVCYNPdlpbhhPpW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 12:03:28.889+05:30	2026-07-13 12:03:29.692141+05:30	\N	\N	\N
cc00c29c-0ecb-44ee-a50b-15a0c26a66ec	bbbb0000-0000-0000-0000-000000000001	$2b$10$ibylYEGuAg7sIGzNa58S.eU5831pjyAroCVdeVW584IxBZ2kN9S1C	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 13:49:10.567+05:30	2026-07-13 13:49:10.679671+05:30	\N	\N	\N
71ce26c9-372b-40c3-a571-7215c99bf323	bbbb0000-0000-0000-0000-000000000001	$2b$10$oTVlU/0J4LNsRuwlly0ZneXNIodT6BaMNtpVF1CV6o3SocyAKqWYW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 16:13:09.916+05:30	2026-07-13 16:13:10.02689+05:30	\N	\N	\N
c3371bb2-0cc3-4d3f-9f19-507a1e8dfddd	bbbb0000-0000-0000-0000-000000000001	$2b$10$EJg3e5eomY3/G7o5KLqCaeVEtlvHZ/13NwI.P0GQDfKPSHeVUl3A2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 17:28:21.185+05:30	2026-07-13 17:28:21.506879+05:30	\N	\N	\N
48d09415-0e1a-48c2-a34c-92564964b9c5	bbbb0000-0000-0000-0000-000000000001	$2b$10$AZM8fyjZnd95Aq2rpMCX/eoQR9cm0j3zhNkbBnx.2NtMR.b2zmsIS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 17:28:21.194+05:30	2026-07-13 17:28:21.556968+05:30	\N	\N	\N
98a7534a-c71c-4567-9649-d0ecb0ece958	bbbb0000-0000-0000-0000-000000000001	$2b$10$XYvBSsbLeBDapwQhGABKNeC/sJ4R053P2bGQQlFUIaGx1lptjbZj2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 17:28:21.19+05:30	2026-07-13 17:28:21.712527+05:30	\N	\N	\N
40ab7cde-6019-4107-aa8e-e8e8573a8c5d	bbbb0000-0000-0000-0000-000000000001	$2b$10$aVds2ocRr4j3guwH2pPzG.XN8YuMbmkru2vumfhrQF2VDerb.8yzG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 17:28:22.027+05:30	2026-07-13 17:28:22.284425+05:30	\N	\N	\N
d6c1bb5a-b6a5-49da-b33d-c440961ffa42	bbbb0000-0000-0000-0000-000000000001	$2b$10$cOKOPMnuomIoZGNZNzIWHue2uAf8lxsOj9OK6gywOwKoGJQHMQ.ii	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 19:59:18.468+05:30	2026-07-13 19:59:18.588271+05:30	\N	\N	\N
3014ba7d-b28b-48aa-bb51-1df388c28c91	bbbb0000-0000-0000-0000-000000000001	$2b$10$4z2walTtfOApPElEfgN54OU32XmPvPntld1Jn8eAKeSuRXOADaQpW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 19:59:18.47+05:30	2026-07-13 19:59:18.631196+05:30	\N	\N	\N
aa324c4a-6e5f-4689-a73a-555b89a97442	bbbb0000-0000-0000-0000-000000000001	$2b$10$F.salD9xfBOnDaR9oBTEdeDdI2lcNM/pT3fZF.0.yaw7.swM/lUMC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 19:59:18.572+05:30	2026-07-13 19:59:18.789272+05:30	\N	\N	\N
d1df6e27-bb8f-4741-9232-e45022c484b9	bbbb0000-0000-0000-0000-000000000001	$2b$10$QKDFC2oIJJiG9LM6/UHESOAOBoeAKvqGMZPZq7bH1SJBEJV/oqWLi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:42:31.691+05:30	2026-07-14 10:42:32.090154+05:30	\N	\N	\N
806f93ea-96ff-4ef3-a002-aa83e52fc55e	bbbb0000-0000-0000-0000-000000000001	$2b$10$N8Cc9Cmfzky/yC5cvkXmv.FHEFtqmA1jHyYPmseo6YdehYseos/Fu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:42:31.713+05:30	2026-07-14 10:42:32.111584+05:30	\N	\N	\N
ab599389-f569-439d-a676-7bd3a485e5f3	bbbb0000-0000-0000-0000-000000000001	$2b$10$ad7X4bUDGLWKN48AWwyhs.lGSnBXEemQa0mvbqw4g8p9JXBD1Kug2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:42:31.751+05:30	2026-07-14 10:42:32.629676+05:30	\N	\N	\N
f1f657a5-e0be-4f6e-831c-184ce27bc28a	bbbb0000-0000-0000-0000-000000000001	$2b$10$D16ldQry9mce4ZNSX0mVVOa7mzR8hCeWBZi3nNrTHLJWWtFAsRF2y	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:42:32.075+05:30	2026-07-14 10:42:32.677917+05:30	\N	\N	\N
49f7db91-1a85-433d-88b8-c9a347097a28	bbbb0000-0000-0000-0000-000000000001	$2b$10$eghcTyHTzyOsBnJ4uf8jMOoXSvZANEEb0R30PyjNd9mB5bTtjQ9ye	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:42:32.25+05:30	2026-07-14 10:42:32.843806+05:30	\N	\N	\N
e5939c48-de64-4928-b8a0-e56613079b8f	bbbb0000-0000-0000-0000-000000000001	$2b$10$gA7D4XRUq8HYA96X73c36epyyd/VrG5hfsngcbHjp0wI2Lrxku1O6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:09:18.261+05:30	2026-07-16 11:09:19.390357+05:30	\N	\N	\N
00610a08-4fa4-4ca0-b3a2-2d704a9c1ecb	bbbb0000-0000-0000-0000-000000000001	$2b$10$H5RoXJ6oAVLW.SqxVeMks.E4MR.OgErncf/TOpN0ntnW6.CCKervK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:09:18.354+05:30	2026-07-16 11:09:19.44283+05:30	\N	\N	\N
31f3d19c-af15-47c2-bc85-697ae3b86838	bbbb0000-0000-0000-0000-000000000001	$2b$10$3O.Q6Rico3tzWTL2QmBHlOqLbmNClC.8Mp7dZp8Uuqz4P8T6G54bq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:09:18.479+05:30	2026-07-16 11:09:19.487835+05:30	\N	\N	\N
bf370833-d963-4eb5-9a80-114cc983a6a8	bbbb0000-0000-0000-0000-000000000001	$2b$10$UGFUIBON0EwbjrpCFIRWqeCtWeuqDOAp3uRP/S317QNZgVhv.sQPW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:09:18.36+05:30	2026-07-16 11:09:19.498919+05:30	\N	\N	\N
91d24841-4aa0-4e3c-9f79-d7728ce3282f	bbbb0000-0000-0000-0000-000000000001	$2b$10$QcV0DomqT9QiwlcBibt.9.nFcnYBTqKPiAoBuSVXdbVb.2vDZ.wM2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:38:02.289+05:30	2026-07-16 11:38:02.910123+05:30	\N	\N	\N
cb312ba0-52a2-4f32-a475-2ad6ff013a0e	bbbb0000-0000-0000-0000-000000000001	$2b$10$d318wmSuy99wbSBi6MSz1eMmg5ktaUG00eWTctV6JO0nHdRyK9IDa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:38:02.276+05:30	2026-07-16 11:38:03.019435+05:30	\N	\N	\N
8c83c38b-7b1f-4da9-a8bd-cf9fadff6a57	bbbb0000-0000-0000-0000-000000000001	$2b$10$9JKYgv1CUzpMXx3Hc1ToturRr4oeflW5nYe6BzVn5kc3M26ZevjQq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:38:02.298+05:30	2026-07-16 11:38:03.048063+05:30	\N	\N	\N
568bc53c-45c8-4454-b1c1-6eb2e3226183	bbbb0000-0000-0000-0000-000000000001	$2b$10$q0nZpvhsA7y8uEUzT0IgTuVM4xUaBMRVUPhxgXpmRzXUg3.lYhjXO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 11:38:03.301+05:30	2026-07-16 11:38:03.59584+05:30	\N	\N	\N
c4b35e3d-0694-4c04-8db8-119966d72557	bbbb0000-0000-0000-0000-000000000001	$2b$10$nm7R9FNefSUUOO/qZE.iVO5dDDRbLHskG9X6jcgHjHIqkr7QpocxS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:04:03.742+05:30	2026-07-16 12:04:04.512538+05:30	\N	\N	\N
075d8af4-9ff9-4e87-bfcb-0dc2e8f85dea	bbbb0000-0000-0000-0000-000000000001	$2b$10$RkTOp1.PRZKY3K9QkxUqouwRwLtTywMKqCFFPA6bX5R/sDtc82zsW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:04:03.776+05:30	2026-07-16 12:04:04.562523+05:30	\N	\N	\N
fb0c01a4-ed39-420f-9603-2ce0a0e3c98d	bbbb0000-0000-0000-0000-000000000001	$2b$10$KHbdThNVJ.a67kmReCz/IOsW.IvZw3aqGtQ2b.6121y/PMrjXmdM6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:04:03.908+05:30	2026-07-16 12:04:04.808201+05:30	\N	\N	\N
d68d8c20-2816-484a-bec4-b5a93b8d91e3	bbbb0000-0000-0000-0000-000000000001	$2b$10$EaiigwwDVUhNHGjJpbqvluEX799FJKMuiizi4UdVeZnmKk9KVDDXG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:04:04.488+05:30	2026-07-16 12:04:04.922442+05:30	\N	\N	\N
9fcc58a1-8bb8-47d7-bb69-f26e2014075b	bbbb0000-0000-0000-0000-000000000001	$2b$10$BYCzeyCTYczaY/a5/Er.6uC/JcW8XTkXaoSPMF1jQMBXJcsP1tLHe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:21:18.456+05:30	2026-07-16 12:21:19.258863+05:30	\N	\N	\N
662cfafa-c6e6-4186-a98a-7564449f0305	bbbb0000-0000-0000-0000-000000000001	$2b$10$P7ICQD9wSdazGwjm6kdovupahwefb30vwr25WZw.r7kI91eeEWegC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:21:18.61+05:30	2026-07-16 12:21:19.624635+05:30	\N	\N	\N
f5e671e8-5bfd-46b3-9c18-2b3ba1818701	bbbb0000-0000-0000-0000-000000000001	$2b$10$9yk.mjKN5BzvHwNMST73aeeLlWBIKe69qfX/p42Sp/bKxQh9iU3Cq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:21:19.17+05:30	2026-07-16 12:21:19.679027+05:30	\N	\N	\N
16f8e41e-b755-4e4e-900b-4d0c320f47a5	bbbb0000-0000-0000-0000-000000000001	$2b$10$CFjQ3lctNxXIt49KZoGnuujWbAefWKTXLxdgTE9hqIwfSK5Gmghj.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:21:19.258+05:30	2026-07-16 12:21:19.722858+05:30	\N	\N	\N
a9d793a0-e773-4851-9a7e-2b6ea997a10e	bbbb0000-0000-0000-0000-000000000001	$2b$10$94lB7qyxOkeKgNrc7sAJEOUp6/saShecG7XoQkEdwCXheITUAURzS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:36:25.842+05:30	2026-07-16 12:36:26.501548+05:30	\N	\N	\N
7b7cc0df-9ef7-4765-9a60-5c49a00a0f7c	bbbb0000-0000-0000-0000-000000000001	$2b$10$QDYHb2ZMvuZYjtLUx36kg.3leTbCLwzd8fgPhEnW.723CJyxMw6mu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:36:25.828+05:30	2026-07-16 12:36:26.519055+05:30	\N	\N	\N
56e6f0cf-b12b-4285-8739-98bc5dc50538	bbbb0000-0000-0000-0000-000000000001	$2b$10$n2YMHpFG9ZOKpvoUWcP/L.pZifYAYPkAlf6n3GBJt3qj/l5/FyjOW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:36:26.669+05:30	2026-07-16 12:36:27.014688+05:30	\N	\N	\N
bcc79180-6a2b-4bb9-ad8a-485532355c44	bbbb0000-0000-0000-0000-000000000001	$2b$10$nhi6h32tofRjpPwk.fQWluVaysf79naU6IB3U7HLFeY3b0ZVa7spK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 12:36:26.528+05:30	2026-07-16 12:36:27.031214+05:30	\N	\N	\N
590bb2de-e59a-4058-8444-d01ff33a373d	bbbb0000-0000-0000-0000-000000000001	$2b$10$UNPJ.lP70dWBHKVRIDG4supIr.TX.SkesOv0p5X98FhkY45oQFQYG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 13:12:30.514+05:30	2026-07-16 13:12:30.857657+05:30	\N	\N	\N
2c864c8c-3b69-4c62-9888-e4a0f740c8a7	bbbb0000-0000-0000-0000-000000000001	$2b$10$e7hXNZeFIYAhPcgoNZALQ.5vR0IM/Dkv/Lw5ozU8SL2Pt5e4TnTIi	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 13:12:30.626+05:30	2026-07-16 13:12:31.042247+05:30	\N	\N	\N
71d33566-58ae-42ad-87f1-3041a02ea997	bbbb0000-0000-0000-0000-000000000001	$2b$10$b2214fOVS4Ny97qE2VlCyuVqs60WTU2AnMbzl6DsyccW/XbkXu7z2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 13:12:31.243+05:30	2026-07-16 13:12:32.285336+05:30	\N	\N	\N
69171bc7-5c57-4d25-9106-cd43ce0dd6f6	bbbb0000-0000-0000-0000-000000000001	$2b$10$X1jk5d8DQpWMPbcVO1ChT.WdgcdBBJ9r3N3166qejOCnhRYE34S2C	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 14:37:57.66+05:30	2026-07-16 14:37:57.790961+05:30	\N	\N	\N
e604c676-3de4-4d89-b38e-4b6e854ee3f4	bbbb0000-0000-0000-0000-000000000001	$2b$10$BjkbtfR.Fc65l.jO02ptoencEi/qKjzlGKEGSSVzHZSmKMJBHEczC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 14:37:57.677+05:30	2026-07-16 14:37:57.809609+05:30	\N	\N	\N
7b9e652d-2a11-4680-91ac-c8cb1f29eca2	bbbb0000-0000-0000-0000-000000000001	$2b$10$rTdeuTqk52xqKeaXxs5jg.S.fve5igTdFcfGJJ/C3tLyXUKketGXq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 14:37:57.752+05:30	2026-07-16 14:37:57.907099+05:30	\N	\N	\N
b353b399-90e4-4dee-baf5-7bd7c6c4a420	bbbb0000-0000-0000-0000-000000000001	$2b$10$v44NY6GD4her8XFWaRLlmuQ3jS2DYZBFKx6P.URJZCZy9nkv8tZoG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 14:37:57.755+05:30	2026-07-16 14:37:57.912687+05:30	\N	\N	\N
9910be4e-f244-4ed1-9ee7-3d3c2e5b8ac9	bbbb0000-0000-0000-0000-000000000001	$2b$10$uqCB9Wskxyjr2Wkf81EPEOQKeKyzdeqYouulYQu31MLmiBngZhRkC	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 15:11:58.061+05:30	2026-07-16 15:11:58.189947+05:30	\N	\N	\N
6e01890d-e6d8-43b4-b6a4-254bcd579f7f	bbbb0000-0000-0000-0000-000000000001	$2b$10$R7EB7NQHm3sOu6aURSAJCuSTyubLd/hqRxH9FBSPOFzq78PrCKOkK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 15:11:58.057+05:30	2026-07-16 15:11:58.196138+05:30	\N	\N	\N
945c2e85-7e21-4cdc-a05c-596620a66312	bbbb0000-0000-0000-0000-000000000001	$2b$10$W6KOEiNEf77cuhPVxDqk9.LKQIdCgZQEs8XhgG30Q.6Yh8uCUtRVK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 15:11:58.059+05:30	2026-07-16 15:11:58.200788+05:30	\N	\N	\N
293c8be5-c963-42c3-a0e6-944e5c9b997a	bbbb0000-0000-0000-0000-000000000001	$2b$10$jSQmEvdrm3FTweKe3Ci.t./kd8kLqcmDlxhi.Vuc3lF7rMQh7uxlW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 15:11:58.063+05:30	2026-07-16 15:11:58.212582+05:30	\N	\N	\N
448eaf10-7f08-43f4-b75b-e45614617ce6	bbbb0000-0000-0000-0000-000000000001	$2b$10$YzCNPRSsePAchTfkGIpagexSpQhIsbOHV3u5CzLPVjF9Y39r.yfza	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 15:33:39.504+05:30	2026-07-16 15:33:39.617686+05:30	\N	\N	\N
155646fe-9971-4186-8bf8-67edc8b5701a	bbbb0000-0000-0000-0000-000000000001	$2b$10$cVM.4uWsCJH6V4AczdYy9eutSzkRR3FQqbo0SkRc9SHmcfFgXVoAG	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 16:05:44.239+05:30	2026-07-16 16:05:44.555415+05:30	\N	\N	\N
fc1ef8d7-6b10-40b3-998c-1695332fdb45	bbbb0000-0000-0000-0000-000000000001	$2b$10$riC5gZk80iTVxU9pZYTqhO6FM19ad7YN9G.C4wcLc.EI.c/ZTj7Gm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 17:12:04.448+05:30	2026-07-16 17:12:04.6282+05:30	\N	\N	\N
bac1551e-0173-4816-bf34-d21414d773a0	bbbb0000-0000-0000-0000-000000000001	$2b$10$bI.msDKqwWO.8DfTqeJcSuDjhAsgXcWmiTElsdjT/XEdeLdYQ2k/i	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 17:12:04.452+05:30	2026-07-16 17:12:05.431562+05:30	\N	\N	\N
aa40175d-3e59-4d4e-a394-380865aed0a7	bbbb0000-0000-0000-0000-000000000001	$2b$10$sLFGhWvspckYjZdaT6V2huaqW2MOZVVrUu2cLlSY.zxhqZThVrGTe	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 17:36:10.404+05:30	2026-07-16 17:36:10.71598+05:30	\N	\N	\N
3d75b5ba-e43b-402e-8eea-39f92ea5d87d	bbbb0000-0000-0000-0000-000000000001	$2b$10$SuUY/TJ8QJyXFB3ZCysoL.XB0FhFFKuF1nmpTdEZX/xsLwJP763mW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 17:36:10.4+05:30	2026-07-16 17:36:11.640818+05:30	\N	\N	\N
ea5bdee6-b696-4de2-b7a6-fca2851ece59	bbbb0000-0000-0000-0000-000000000001	$2b$10$OLzO3VH8aE0YZUjJtTuwA.lz1pRsS5LpwyyCDUfmSWlcMBN7YXPeS	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 10:57:46.508+05:30	2026-07-17 10:57:47.304959+05:30	\N	\N	\N
5f020c1c-9f5e-4ff5-b554-3d1387f04b41	bbbb0000-0000-0000-0000-000000000001	$2b$10$8FJZtcQJBGajFHgYBXv65.psn/.Baahbit7TaoZn6s5Gr63UJqXlO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 10:57:46.531+05:30	2026-07-17 10:57:47.321868+05:30	\N	\N	\N
e45b99a2-73b7-4f33-b21b-e226eb9ea3e2	bbbb0000-0000-0000-0000-000000000001	$2b$10$fafvhw5RvfnIjXCmEnTXm.S36XhP8BAzU6YAEh/bmoK7A6dAJvEZm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 10:57:46.5+05:30	2026-07-17 10:57:47.336255+05:30	\N	\N	\N
cd34b956-2609-4ed1-a142-39063ca64eaf	bbbb0000-0000-0000-0000-000000000001	$2b$10$79DU4v6FJ3NaUncRNtzfkOH40zpEmYyaeNMxWCgzTplcCDWxc3Paq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 10:57:46.517+05:30	2026-07-17 10:57:47.370593+05:30	\N	\N	\N
5e221b72-05bd-45ef-8504-c82f489b3d92	bbbb0000-0000-0000-0000-000000000001	$2b$10$l27Z4QIeMfcIbuthrfju9.kf3CbZ/dUJ7ubIMS2sO.1g2m/.4.1Ri	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 12:12:07.806+05:30	2026-07-17 12:12:08.199736+05:30	\N	\N	\N
5191305b-5e85-4f12-a0ff-f7498f23828d	bbbb0000-0000-0000-0000-000000000001	$2b$10$jbcFtMWR.U7B7kDI5aDal.bHUmzvM8h1g1M7rMk347PYLoT7bZKwm	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 12:12:07.81+05:30	2026-07-17 12:12:08.268046+05:30	\N	\N	\N
859dd8b2-66ae-4100-b325-47946c5e9d19	bbbb0000-0000-0000-0000-000000000001	$2b$10$aBziBdlhtkoMPtdlKUhnI.61.7O.hhxQJ1KC/G5OAL7a6nlD8HBx6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 12:12:07.813+05:30	2026-07-17 12:12:08.469792+05:30	\N	\N	\N
dc5de5a4-1727-46a4-8f17-16676cccaa9e	bbbb0000-0000-0000-0000-000000000001	$2b$10$KzE1CiPLK54IyjJdIt4K.OUBB8yuZHjzi6NwCkn0rfcRrMECZAHZW	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 12:12:08.196+05:30	2026-07-17 12:12:09.054006+05:30	\N	\N	\N
d31cfa54-4c94-43f0-a170-9748b1b36c3a	bbbb0000-0000-0000-0000-000000000001	$2b$10$w4OPdzoUARcLt83cAvVjheZG.ntCLcEcw6TSJDcsSs9vaOYtgJ13C	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 14:08:44.79+05:30	2026-07-17 14:08:45.180305+05:30	\N	\N	\N
8a8503c4-9ab7-42bd-b086-2420a012d948	bbbb0000-0000-0000-0000-000000000001	$2b$10$FQKC2byIp//FSv/wXAPWmu0TNBE//ybjtuuFFabmBozBXjNqolBZq	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 14:08:44.881+05:30	2026-07-17 14:08:45.244638+05:30	\N	\N	\N
c8e50fe2-6131-456d-ab52-dd28129163c9	bbbb0000-0000-0000-0000-000000000001	$2b$10$TvADNlc7hnSpU5ouEGD7GeevTr7HpyQO7PUNVTGS9oUbhXw98QMN2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 14:08:44.883+05:30	2026-07-17 14:08:45.28338+05:30	\N	\N	\N
439fa166-5c9b-41ad-bfa2-bbcf8ad60498	bbbb0000-0000-0000-0000-000000000001	$2b$10$4yWkhOflSJIEqrcRmG5VKuzbUUBMX1gb.Rkk1ywbdLD4iDVHXWhx6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 14:08:44.846+05:30	2026-07-17 14:08:45.469671+05:30	\N	\N	\N
4b8b1cc0-9f77-4c05-80ee-64c339b21ad3	bbbb0000-0000-0000-0000-000000000001	$2b$10$UX6SSxTZHgiJJnv0dAntpeJ515s.qhxr5lSlRRIJVvBWpi0iYtWJa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 14:08:47.319+05:30	2026-07-17 14:08:47.445002+05:30	\N	\N	\N
\.


--
-- TOC entry 5690 (class 0 OID 25257)
-- Dependencies: 240
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, tenant_id, user_id, title, message, type, is_read, created_at, entity_type, entity_id, action_type, redirect_url) FROM stdin;
\.


--
-- TOC entry 5673 (class 0 OID 24783)
-- Dependencies: 223
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, created_at) FROM stdin;
10000000-0000-0000-0000-000000000001	leads:read	Can view leads	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000002	leads:write	Can create and edit leads	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000003	tasks:read	Can view tasks	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000004	tasks:write	Can create and edit tasks	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000005	branches:read	Can view branches	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000006	branches:write	Can manage branches	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000007	users:read	Can view users	2026-07-01 16:48:41.545275+05:30
10000000-0000-0000-0000-000000000008	users:write	Can manage users	2026-07-01 16:48:41.545275+05:30
\.


--
-- TOC entry 5711 (class 0 OID 25975)
-- Dependencies: 261
-- Data for Name: proforma_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proforma_items (id, proforma_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage, created_at) FROM stdin;
24d2cd11-3a9e-4cdd-bc02-3b83cc5e7e56	77ec82e3-f85a-432c-be0e-23a912c47162	item one	\N	\N	1.00	Nos	100.00	0.00	18.00	2026-07-16 16:00:39.245707+05:30
dcfb8b31-22ba-418e-a4b2-12112d920a5d	77ec82e3-f85a-432c-be0e-23a912c47162	item two	\N	\N	1.00	Nos	0.00	0.00	18.00	2026-07-16 16:00:39.245707+05:30
\.


--
-- TOC entry 5685 (class 0 OID 25104)
-- Dependencies: 235
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, tenant_id, lead_id, project_name, start_date, deadline, technology, status, progress_pct, total_cost, created_at, updated_at, team_id, developer_id, remarks) FROM stdin;
\.


--
-- TOC entry 5684 (class 0 OID 25073)
-- Dependencies: 234
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proposals (id, tenant_id, lead_id, proposal_number, proposal_version, business_analysis, technical_analysis, risk_analysis, scope, timeline, est_hours, quotation_amount, discount, final_cost, currency, status, is_approved, contract_signed, advance_received, advance_amount, created_at, updated_at, created_by, updated_by) FROM stdin;
96019d02-83b6-499e-9a85-ad0c6f44b6a6	aaaa0000-0000-0000-0000-000000000000	67b662cd-bafa-43a9-a890-e8d9393a53ee	PROP-67B662CD-152507-7271	v11	buissiness analysis	Technical Architecture Analysis	Risk Assessment	Risk Assessment\nDetailed Solution Scope	5 weeks	\N	68567.00	500.00	68067.00	INR	Draft	f	f	f	0.00	2026-07-04 10:29:12.508351+05:30	2026-07-04 10:29:12.508351+05:30	bbbb0000-0000-0000-0000-000000000001	\N
2efa9818-dfdb-45c6-bcf9-92a672ca224f	aaaa0000-0000-0000-0000-000000000000	e1b1c075-6fc9-4599-8c44-38fcf03a3a3a	PROP-E1B1C075-467022-3684	v1.0	Strong ROI potential	\N	\N	Full stack dev	3 months	\N	300000.00	0.00	300000.00	INR	Draft	f	f	f	0.00	2026-07-02 17:27:47.023846+05:30	2026-07-02 17:27:47.023846+05:30	bbbb0000-0000-0000-0000-000000000001	\N
\.


--
-- TOC entry 5709 (class 0 OID 25905)
-- Dependencies: 259
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_items (id, quotation_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage, created_at) FROM stdin;
14e2a4b2-fb7f-4360-8c57-ddcf5a2f9416	2aebc0c0-8312-4409-8628-beece6add414	item one	\N	\N	1.00	Nos	100.00	0.00	18.00	2026-07-10 16:38:43.59571+05:30
e84b3440-077b-47b3-a753-371016c3f382	2aebc0c0-8312-4409-8628-beece6add414	item two	\N	\N	1.00	Nos	0.00	0.00	18.00	2026-07-10 16:38:43.59571+05:30
2c223d53-5465-4229-8ec1-0fd185f6a4cb	9dd678ed-0932-4e2d-abdd-42438147db2c	item one	\N	\N	1.00	Nos	100.00	0.00	18.00	2026-07-16 12:05:46.89044+05:30
7c753e0c-3173-4cc2-b85f-821baa942e3a	9dd678ed-0932-4e2d-abdd-42438147db2c	item two	\N	\N	1.00	Nos	0.00	0.00	18.00	2026-07-16 12:05:46.89044+05:30
bc600e17-7aa9-4286-80ca-159b74a0e561	2bea5b63-22a1-4a69-8f47-0e6a60045afd	item one	\N	\N	1.00	Nos	100.00	0.00	18.00	2026-07-16 14:39:42.571069+05:30
48a40f9b-6c80-461b-bb60-555b037e20a1	2bea5b63-22a1-4a69-8f47-0e6a60045afd	item two	\N	\N	1.00	Nos	0.00	0.00	18.00	2026-07-16 14:39:42.571069+05:30
4d8ea116-2775-48a7-a963-909156c32e02	c3d06723-f666-4310-8c01-dbc8d05c879d	item	\N	\N	1.00	Nos	0.00	0.00	18.00	2026-07-16 16:07:26.905939+05:30
\.


--
-- TOC entry 5674 (class 0 OID 24796)
-- Dependencies: 224
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id, created_at) FROM stdin;
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000001	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000002	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000003	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000004	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000005	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000006	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000007	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	10000000-0000-0000-0000-000000000008	2026-07-01 16:48:41.545275+05:30
33333333-3333-3333-3333-333333333333	10000000-0000-0000-0000-000000000001	2026-07-01 16:48:41.545275+05:30
33333333-3333-3333-3333-333333333333	10000000-0000-0000-0000-000000000002	2026-07-01 16:48:41.545275+05:30
33333333-3333-3333-3333-333333333333	10000000-0000-0000-0000-000000000003	2026-07-01 16:48:41.545275+05:30
33333333-3333-3333-3333-333333333333	10000000-0000-0000-0000-000000000004	2026-07-01 16:48:41.545275+05:30
33333333-3333-3333-3333-333333333333	10000000-0000-0000-0000-000000000007	2026-07-01 16:48:41.545275+05:30
44444444-4444-4444-4444-444444444444	10000000-0000-0000-0000-000000000001	2026-07-01 16:48:41.545275+05:30
44444444-4444-4444-4444-444444444444	10000000-0000-0000-0000-000000000003	2026-07-01 16:48:41.545275+05:30
44444444-4444-4444-4444-444444444444	10000000-0000-0000-0000-000000000004	2026-07-01 16:48:41.545275+05:30
\.


--
-- TOC entry 5672 (class 0 OID 24770)
-- Dependencies: 222
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at) FROM stdin;
11111111-1111-1111-1111-111111111111	SUPER_ADMIN	System wide super administrator	2026-07-01 16:48:41.545275+05:30
22222222-2222-2222-2222-222222222222	ADMIN	Tenant specific branch manager/admin	2026-07-01 16:48:41.545275+05:30
33333333-3333-3333-3333-333333333333	TEAM_LEADER	Manages a specific team of developers	2026-07-01 16:48:41.545275+05:30
44444444-4444-4444-4444-444444444444	DEVELOPER	Executes tasks and handles lead requirements	2026-07-01 16:48:41.545275+05:30
\.


--
-- TOC entry 5688 (class 0 OID 25203)
-- Dependencies: 238
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_attachments (id, tenant_id, task_id, uploaded_by_id, file_name, file_url, file_size_bytes, mime_type, created_at) FROM stdin;
\.


--
-- TOC entry 5705 (class 0 OID 25686)
-- Dependencies: 255
-- Data for Name: task_checklists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_checklists (id, tenant_id, task_id, item_text, is_completed, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5687 (class 0 OID 25174)
-- Dependencies: 237
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_comments (id, tenant_id, task_id, author_id, comment, created_at) FROM stdin;
\.


--
-- TOC entry 5704 (class 0 OID 25668)
-- Dependencies: 254
-- Data for Name: task_dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_dependencies (task_id, depends_on_task_id, dependency_type) FROM stdin;
\.


--
-- TOC entry 5707 (class 0 OID 25726)
-- Dependencies: 257
-- Data for Name: task_label_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_label_mapping (task_id, label_id) FROM stdin;
\.


--
-- TOC entry 5706 (class 0 OID 25709)
-- Dependencies: 256
-- Data for Name: task_labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_labels (id, tenant_id, label_name, color_hex, created_at) FROM stdin;
\.


--
-- TOC entry 5686 (class 0 OID 25133)
-- Dependencies: 236
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, tenant_id, lead_id, assigned_by_id, assigned_to_id, title, description, category, priority, status, assigned_date, due_date, est_hours, hours_worked, progress_pct, blocker_reason, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5679 (class 0 OID 24916)
-- Dependencies: 229
-- Data for Name: team_leaders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_leaders (id, tenant_id, user_id, team_id, employee_id, designation, performance_score, created_at, updated_at) FROM stdin;
db6155d9-ca2c-4ef3-982b-19055c2c4044	aaaa0000-0000-0000-0000-000000000000	9f8a5f06-e696-49be-b9bf-fa761b421fcc	caa96296-6682-422e-8d6e-bf2f99eb2a73	test234	Team Leader	90	2026-07-03 12:05:16.088292+05:30	2026-07-03 12:05:16.088292+05:30
ebdfd33c-5272-4873-b85b-07ad5543e3f5	aaaa0000-0000-0000-0000-000000000000	17bb4dfb-86f7-4ae9-b4da-2a71588dfab5	9999ca29-d341-4d27-8fe1-dcd34ac6c785	afasrrvaer	Team Leaders	90	2026-07-03 13:08:22.514037+05:30	2026-07-03 13:08:22.514037+05:30
fb428718-73dc-4bc7-8bc4-b0ff87462b5a	aaaa0000-0000-0000-0000-000000000000	2ac67cf3-6709-46fd-8a18-21ae7967ff10	0eed0f34-d481-4327-b741-e1e435b045cd	asdawer	Team Leader	90	2026-07-03 14:55:21.197551+05:30	2026-07-03 14:55:21.197551+05:30
909812b7-1908-4bce-8f28-7ea1d3a4eb8b	aaaa0000-0000-0000-0000-000000000000	4531fed5-a66d-4b14-adbc-0716da3ec72f	19a0d7ee-0ce8-4df0-847c-12756210351f	admin@ansfasfasf	Team Leader	90	2026-07-03 15:51:20.783143+05:30	2026-07-03 15:51:20.783143+05:30
5f12452d-51f3-4248-a51f-b7f7fe60f379	aaaa0000-0000-0000-0000-000000000000	a0e60107-21e2-4d8f-b1c0-3fa13d96eb31	80508ee1-6927-486b-a51f-38f7d156e1aa	adminasdfasdfd	Team Leader	90	2026-07-03 16:14:02.926971+05:30	2026-07-03 16:14:02.926971+05:30
cbfc4d1c-383d-49a0-860e-65a1ca1dc20b	aaaa0000-0000-0000-0000-000000000000	66ece4fd-1a22-4746-a3bb-3e8fe3dced2e	cf7bf8e3-e9ab-46a4-95d6-b031c2c30a77	adafwe3	Team Leader	90	2026-07-03 18:48:07.25438+05:30	2026-07-03 18:48:07.25438+05:30
f2a93e2b-f0ce-462e-9872-5c35724ca320	aaaa0000-0000-0000-0000-000000000000	7b02aeb2-5ed8-42b7-8e45-6b968aae18b1	2174be67-7333-448d-8a70-738571bdefbf	test@gmail.com	Team Leader	90	2026-07-02 12:24:29.891933+05:30	2026-07-02 12:24:29.891933+05:30
9745ff00-2e47-4782-8930-73eeb48db775	aaaa0000-0000-0000-0000-000000000000	1344cc94-2641-41b7-bc9e-1508de08a9d5	249c05cc-3ab1-42e9-a85b-cf96733e63fb	test	Team Leader	90	2026-07-02 12:36:13.373828+05:30	2026-07-02 12:36:13.373828+05:30
14f20fd8-864a-4aba-be06-b128cbcf1254	aaaa0000-0000-0000-0000-000000000000	059a12cd-dc37-40cb-8d90-aa9461ee4bfb	328f447e-c59d-4b34-9768-5f75a16cc9d0	ashis=are	Team Leader	90	2026-07-04 04:15:51.794275+05:30	2026-07-04 04:15:51.794275+05:30
3f22cabb-81d9-4908-b83c-e05360214367	aaaa0000-0000-0000-0000-000000000000	50cf5f80-9be5-4b20-b8ca-b277fb94427c	7ab717ca-adc7-4211-9826-fb1f36c3c52f	EMP104	Team Leader	90	2026-07-04 10:10:23.896212+05:30	2026-07-04 10:10:23.896212+05:30
12801985-b742-47ad-a29b-262019fc42ca	aaaa0000-0000-0000-0000-000000000000	09fdb157-d457-4d8d-94b4-4970fb339349	a3bdf770-7e66-407b-b7f3-be348e708b51	adi123	Team Leader	90	2026-07-04 11:13:51.57384+05:30	2026-07-04 11:13:51.57384+05:30
13ff5167-9b72-429c-9503-ff8b500bd1f4	aaaa0000-0000-0000-0000-000000000000	a9866519-41e9-4bb4-8d33-e1e5e3e6628b	f91138a6-7c58-4b6e-911c-7a7a3bc50832	Sa123	Team Leader	90	2026-07-04 16:07:38.79204+05:30	2026-07-04 16:07:38.79204+05:30
f8c8e7c5-cb6a-4e4d-b499-433a4ee5d73d	aaaa0000-0000-0000-0000-000000000000	94471097-3e2d-4644-a9df-7fadd7187d9d	509447ff-9836-40fc-aca9-7e60e9823ed7	Ra789	Team Leader	90	2026-07-06 13:06:35.977517+05:30	2026-07-06 13:06:35.977517+05:30
\.


--
-- TOC entry 5678 (class 0 OID 24892)
-- Dependencies: 228
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, tenant_id, branch_id, team_name, department, created_at, updated_at, deleted_at) FROM stdin;
d5911344-f3d7-49fd-9d09-84f51486e2fd	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000002	Guardians_5438	Space	2026-07-02 11:37:27.765034+05:30	2026-07-02 11:37:27.932189+05:30	2026-07-02 11:37:27.932189+05:30
50c04ebb-5758-4aaf-b081-04d7635dda54	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000002	Guardians_2727	Space	2026-07-02 11:37:48.676782+05:30	2026-07-02 11:37:48.885322+05:30	2026-07-02 11:37:48.885322+05:30
2174be67-7333-448d-8a70-738571bdefbf	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	asdfghj	CRM Development	2026-07-02 12:24:29.891933+05:30	2026-07-02 12:24:29.891933+05:30	\N
249c05cc-3ab1-42e9-a85b-cf96733e63fb	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	super duper	CRM Development	2026-07-02 12:36:13.373828+05:30	2026-07-02 12:36:13.373828+05:30	\N
dddd0000-0000-0000-0000-000000000001	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000001	Mumbai Avengers	CRM Development	2026-07-01 16:48:41.545275+05:30	2026-07-02 15:01:03.599866+05:30	\N
caa96296-6682-422e-8d6e-bf2f99eb2a73	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	dfzgfdhfsds	CRM Development	2026-07-03 12:05:16.088292+05:30	2026-07-03 12:05:16.088292+05:30	\N
9999ca29-d341-4d27-8fe1-dcd34ac6c785	aaaa0000-0000-0000-0000-000000000000	f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	asdfghjsdfsd	CRM Development	2026-07-03 13:08:22.514037+05:30	2026-07-03 13:08:22.514037+05:30	\N
0eed0f34-d481-4327-b741-e1e435b045cd	aaaa0000-0000-0000-0000-000000000000	f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	sFSgf	CRM Development	2026-07-03 14:55:21.197551+05:30	2026-07-03 14:55:21.197551+05:30	\N
19a0d7ee-0ce8-4df0-847c-12756210351f	aaaa0000-0000-0000-0000-000000000000	f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	asdfghjsd	CRM Development	2026-07-03 15:51:20.783143+05:30	2026-07-03 15:51:20.783143+05:30	\N
80508ee1-6927-486b-a51f-38f7d156e1aa	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	asc	CRM Development	2026-07-03 16:14:02.926971+05:30	2026-07-03 16:14:02.926971+05:30	\N
cf7bf8e3-e9ab-46a4-95d6-b031c2c30a77	aaaa0000-0000-0000-0000-000000000000	f8a9713e-94ce-4e2a-92e5-ccb8dd8a09d3	asdfwe	CRM Development	2026-07-03 18:48:07.25438+05:30	2026-07-03 18:48:07.25438+05:30	\N
328f447e-c59d-4b34-9768-5f75a16cc9d0	aaaa0000-0000-0000-0000-000000000000	f7330ad2-308b-482e-999d-587b405a875b	asdfghjsddf	CRM Development	2026-07-04 04:15:51.794275+05:30	2026-07-04 04:15:51.794275+05:30	\N
7ab717ca-adc7-4211-9826-fb1f36c3c52f	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	developer	CRM Development	2026-07-04 10:10:23.896212+05:30	2026-07-04 10:10:23.896212+05:30	\N
a3bdf770-7e66-407b-b7f3-be348e708b51	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	alpha team	CRM Development	2026-07-04 11:13:51.57384+05:30	2026-07-04 11:13:51.57384+05:30	\N
f91138a6-7c58-4b6e-911c-7a7a3bc50832	aaaa0000-0000-0000-0000-000000000000	d3a62b2d-c688-4f9e-b04d-51c93873af57	king park member	technical	2026-07-04 16:07:38.79204+05:30	2026-07-04 16:07:38.79204+05:30	\N
509447ff-9836-40fc-aca9-7e60e9823ed7	aaaa0000-0000-0000-0000-000000000000	ef268a1f-f791-4c59-90b6-b36f8e1aa230	Mumbai Avengersdf	CRM Development	2026-07-06 13:06:35.977517+05:30	2026-07-06 13:06:35.977517+05:30	\N
\.


--
-- TOC entry 5671 (class 0 OID 24759)
-- Dependencies: 221
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, status, created_at, updated_at, deleted_at) FROM stdin;
aaaa0000-0000-0000-0000-000000000000	Kosqu Corporate Software	Active	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
\.


--
-- TOC entry 5675 (class 0 OID 24814)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, tenant_id, role_id, email, password_hash, first_name, last_name, phone, status, created_at, updated_at, deleted_at) FROM stdin;
bbbb0000-0000-0000-0000-000000000001	aaaa0000-0000-0000-0000-000000000000	11111111-1111-1111-1111-111111111111	admin@antigravity.com	$2b$10$uoNhEr5tKgfCj3S/pzIzX.YmDi6aL2t/GDhkdxq/vUS4.5d6xvhhW	System	Admin	\N	Active	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
ad7dad47-4ee9-4426-8f2f-480ea872b979	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	test6@gmail.com	$2b$10$fUUU4dVa.ZPsU3jvV2nVjO3wpqP2YMkpHLceVziWA2oASEUNg6gqy	Test	six	9209017621	Active	2026-07-02 10:36:45.135581+05:30	2026-07-02 10:36:45.135581+05:30	\N
7b02aeb2-5ed8-42b7-8e45-6b968aae18b1	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	leader@gmail.com	$2b$10$DfZtGgscgffelZIob.wwKOFW3uNIzQcaj4S9JO7wjKqks/hHkkLaq	Test	leader	\N	Inactive	2026-07-02 12:24:29.891933+05:30	2026-07-03 12:02:58.594705+05:30	2026-07-03 12:02:58.594705+05:30
1344cc94-2641-41b7-bc9e-1508de08a9d5	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	leader1@gmail.com	$2b$10$00.SyB7J7vX3QkV6Ste8E.BvxCv7HT1e1g7vXjyaYbFNlsY.A2Tf6	test	leader	\N	Inactive	2026-07-02 12:36:13.373828+05:30	2026-07-03 12:03:16.167314+05:30	2026-07-03 12:03:16.167314+05:30
9f8a5f06-e696-49be-b9bf-fa761b421fcc	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	bob@gmail.com	$2b$10$s9tMxQXWrOKntOH6VI8m9uN./GVG9gI6ZdtzE3D6WaU.kVK9FKkEG	Bob	Leader	\N	Active	2026-07-03 12:05:16.088292+05:30	2026-07-03 12:05:16.088292+05:30	\N
40f2f484-0476-4ab1-a564-c69b67af7a67	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	alise@gmail.com	$2b$10$zsUSS6vDbpBuAuTqQGKrI.CayryI6P3k9Qjs3FGTfaZ5CalsN9PDG	alise	Manager	9209017621	Active	2026-07-03 12:19:41.232122+05:30	2026-07-03 12:19:41.232122+05:30	\N
7cde0dd9-8e11-49bc-b8cc-8b04c70285db	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	starlord_5438@guardians.com	$2b$10$nOuQQQSsVQzS9JQY7nObguBmDihDgZ3jmWcfIGDb29HftMPeo/cUe	Star	Lord	\N	Inactive	2026-07-02 11:37:27.77473+05:30	2026-07-02 11:37:27.922122+05:30	2026-07-02 11:37:27.922122+05:30
17bb4dfb-86f7-4ae9-b4da-2a71588dfab5	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	stephen@gmail.com	$2b$10$oDerdWguseQ9h7Ysn/xFw.ZOJbHl532g7W.da9g17.TtA.kp.ejTG	stephen	Leader	\N	Active	2026-07-03 13:08:22.514037+05:30	2026-07-03 13:08:22.514037+05:30	\N
2ac67cf3-6709-46fd-8a18-21ae7967ff10	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	ram@gmail.com	$2b$10$ge12pKL7vg1QHUYqV8y1HOcUQsD7gt19Iexic5sOOtCPucapyBiri	ram	Leader	\N	Active	2026-07-03 14:55:21.197551+05:30	2026-07-03 14:55:21.197551+05:30	\N
4531fed5-a66d-4b14-adbc-0716da3ec72f	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	rahul@gmail.com	$2b$10$K8MYlvjkZdELgw6HS5H0qOnsvGCh6Peq.opiEVaA81qJyUm5Gcdgm	rahul	Leader	\N	Active	2026-07-03 15:51:20.783143+05:30	2026-07-03 15:51:20.783143+05:30	\N
a0e60107-21e2-4d8f-b1c0-3fa13d96eb31	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	virat@gmail.com	$2b$10$ETEbyFjxChPqOHWX/lXgd..ElvO9BpCWUSu3pdshPgCRodpIRv94C	virat	Leader	\N	Active	2026-07-03 16:14:02.926971+05:30	2026-07-03 16:14:02.926971+05:30	\N
af3e2ac7-f302-4cc0-b56c-4f70e2c3dd14	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	starlord_2727@guardians.com	$2b$10$UhS746tVzhJ2HDMOdU6l1uf2xc177.mDwTIvlg182Je7ast1dBbBG	Star	Lord	\N	Inactive	2026-07-02 11:37:48.687362+05:30	2026-07-02 11:37:48.875465+05:30	2026-07-02 11:37:48.875465+05:30
14c14e8d-7609-465e-adae-12a4eff9e3c4	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	test@gmail.com	$2b$10$sPxkqctAN6TkFXwPlEvaSu5udyaQ1U2huXZdAD9zWkw8.XPyyPuHC	Test	Manager	09209017621	Active	2026-07-03 18:31:38.206343+05:30	2026-07-03 18:31:38.206343+05:30	\N
66ece4fd-1a22-4746-a3bb-3e8fe3dced2e	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	tim@gmail.com	$2b$10$DFru124GE6YIU37eq8KiVezQ4SR98sqynsFM8rYo33NFloVkmKNVi	tim	Leader	\N	Active	2026-07-03 18:48:07.25438+05:30	2026-07-03 18:48:07.25438+05:30	\N
056be996-6131-43ce-9b59-b81eaa04884b	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	aadi@gmail.com	$2b$10$lNHIL4rmdcnsToUAjUPF8u4FqF9IVlQPG0MuH65A7Esbf4gLAJeGi	aadi	User	\N	Active	2026-07-03 19:47:10.69817+05:30	2026-07-03 19:47:10.69817+05:30	\N
fb3abd83-d17d-4f41-a851-1663610192b9	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	aadinathbmagar75@gmail.com	$2b$10$aXm1j8itFVKLf5fn9OabY.1i.4NvgkY5ORzAweFaFumBAhsSR/wry	aadinath	Babasaheb magar	\N	Active	2026-07-03 19:47:23.174173+05:30	2026-07-03 19:47:23.174173+05:30	\N
b10d27bc-a481-4028-9385-000756ab80de	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	qwer@gmail.com	$2b$10$rzdpTqOLQm19P1TOASKIxuzxu4TDd98qmWF1YneOMeiGA35UIM0O2	qwer	User	\N	Active	2026-07-03 19:47:41.030596+05:30	2026-07-03 19:47:41.030596+05:30	\N
bbbb0000-0000-0000-0000-000000000003	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	rohan.verma@kosqu.com	$2b$10$mWNj2bzDHMSW3vh7mPObnOliekyEi58GRsxVklWQ7hFJwJ.hOjXkK	Rohan	Verma	\N	Inactive	2026-07-01 16:48:41.545275+05:30	2026-07-04 03:09:21.578453+05:30	2026-07-04 03:09:21.578453+05:30
b6be28ec-f9e1-47cf-ace9-79439c73eb1f	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	ashish@gmail.com	$2b$10$FXz9cy8IgiOVXrG67Mxfp.1N8Ufdk5Vm2zbkwZQL/sgbXTxBr5UiC	ashish	Manager	09209017621	Active	2026-07-04 04:14:32.526504+05:30	2026-07-04 04:14:32.526504+05:30	\N
059a12cd-dc37-40cb-8d90-aa9461ee4bfb	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	aaqib@gmail.com	$2b$10$Sz.8322N9aaMYvzIb27jre2KR5meKd3mwmduPxsGmayeZXJtWNi6m	aaqib	Leader	\N	Active	2026-07-04 04:15:51.794275+05:30	2026-07-04 04:15:51.794275+05:30	\N
4bdeab3d-bcbd-4d39-9c88-555cfda88116	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	arjun@gmail.com	$2b$10$6f90HcNDtB6bL7oqkvz4MO/ZEydLeBkM.jKgOvdu3NZ.ybpc0riVW	arjun	Manager	09209017621	Active	2026-07-04 10:01:21.20814+05:30	2026-07-04 10:01:21.20814+05:30	\N
bbbb0000-0000-0000-0000-000000000004	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	aarav.mehta@kosqu.com	$2b$10$F5PIkVgLfMhRXvF9O1YYmO2X9JGzDYGXkcEgwMwTOPjGz8NCCYZqC	Aarav	Mehta	\N	Active	2026-07-01 16:48:41.545275+05:30	2026-07-02 15:00:31.707133+05:30	\N
bbbb0000-0000-0000-0000-000000000002	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	pooja.hegde@kosqueadv.com	$2b$10$PAw9t24XGGihZcRo9BfZKunsZjhLyJr2gW7uFs5RPb1.RY5AUFGw6	Pooja	Hegde	\N	Active	2026-07-01 16:48:41.545275+05:30	2026-07-02 15:00:31.7092+05:30	\N
50cf5f80-9be5-4b20-b8ca-b277fb94427c	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	sneha@company.com	$2b$10$Ts2RyOHddOrrIdI87jCb4ewj88.z8bVrJ05xbeNEOLucFiJzILVM.	sneha	patil	\N	Active	2026-07-04 10:10:23.896212+05:30	2026-07-04 10:10:23.896212+05:30	\N
a8ffefa4-0aca-47a4-9a8c-6df82d6580cf	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	seema@gmail.com	$2b$10$V8TV6VfylUjhlCQM9L/0ZuJiYwiDBilBIDWAGg.LD.OScP3zVbmnK	seema	User	\N	Active	2026-07-04 10:34:45.285943+05:30	2026-07-04 10:34:45.285943+05:30	\N
09fdb157-d457-4d8d-94b4-4970fb339349	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	aditya@gmail.com	$2b$10$6LWQ.dXDbNhOiUKgbY031OqJ/VIIK3Rix6dWOKJdIWjlnl8O6WE1i	aditya	Leader	\N	Active	2026-07-04 11:13:51.57384+05:30	2026-07-04 11:13:51.57384+05:30	\N
aa1d5937-3f0e-435e-9ff3-a2e1d15bf1d4	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	karan@gmail.com	$2b$10$f5jETm48631pqteYBV4mfeaM5m3H8mHMSHf0MwXknLyhKA//VvoU6	karan	singh	\N	Active	2026-07-04 11:20:50.175462+05:30	2026-07-04 11:20:50.175462+05:30	\N
7d19ca76-c798-4aa9-9120-e69fc700082a	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	seema12@gmail.com	$2b$10$t0M8M7Kmm9lU6NVfkHQ/TuQ1wK/v6ldoMR3DoxamxQbb5prMSvqOu	seema	User	\N	Active	2026-07-04 11:44:32.064544+05:30	2026-07-04 11:44:32.064544+05:30	\N
907fe096-fcc8-4c4b-90cb-be0dbdb81cd1	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	shyakya@gmail.com	$2b$10$kcD3FsesvcBz2inm1hgLG.d91uwf7wbC/DomT4i.2boMzpYPPoOwe	shyakyadita	User	\N	Active	2026-07-04 11:46:28.864063+05:30	2026-07-04 11:46:28.864063+05:30	\N
61c91173-e1d3-41da-a894-86311b3fbd9d	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	harsh@gmail.com	$2b$10$C19fkTuvJDDH232t2s3.fuAbRFZEVSvxNwuYcQR1jAmtWx69ZNmtu	Harsh	gawali	09209017626	Active	2026-07-04 16:05:21.65686+05:30	2026-07-04 16:05:21.65686+05:30	\N
a9866519-41e9-4bb4-8d33-e1e5e3e6628b	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	samarth@gmail.com	$2b$10$/zpWrsaUejCwR7iHTJBBHu5jSQOavltwTJcwp3uoSgvfy8E5U9woi	samarth	giram	\N	Active	2026-07-04 16:07:38.79204+05:30	2026-07-04 16:07:38.79204+05:30	\N
94471097-3e2d-4644-a9df-7fadd7187d9d	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	rahul1@gmail.com	$2b$10$z/FNRhQLPDdoDGuEkralve0BJcVfk93rUqzkgY7E7BkZ/2A328wYu	Rahul	Leader	\N	Active	2026-07-06 13:06:35.977517+05:30	2026-07-06 13:06:35.977517+05:30	\N
b3f4d63a-dbbc-4fe8-8f42-a24722826c14	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	qwerty@g.com	$2b$10$vRrrLtPfLyjuIM4v5AdK/u7uAQon0O50/r5aI5P8VGKwl.NE9U836	qewretr	Manager	1234567890	Inactive	2026-07-11 11:42:22.266002+05:30	2026-07-11 11:43:33.924521+05:30	2026-07-11 11:43:33.924521+05:30
5c1f34c2-3de9-4416-a782-00a5135c665e	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	imran@aits.com	$2b$10$VO7gtLu9.p6WoPAJx/CGiecGG37CuPOAaBve7NqzDh1DLXYiuhBBO	Imran	Manager	09209017621	Active	2026-07-11 15:14:34.84871+05:30	2026-07-11 15:14:34.84871+05:30	\N
55d9a6d0-b56b-4f13-9d45-f551dfeb6674	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	syakya@gmail.com	$2b$10$Sm4w85FM/LRUVAq35/sh6.1789Tty.hVUoj5eUZqe4mr4n1cD/Uva	syakya	User	\N	Inactive	2026-07-04 16:10:23.190674+05:30	2026-07-16 14:38:53.454117+05:30	2026-07-16 14:38:53.454117+05:30
bcb4beab-7b5a-48df-99b4-491aedeeb92d	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	testelv@gmail.com	$2b$10$VzFeojS3sTcgFVnWzL4c7.JjLk9ga/.77S1PMuRfcMRFIRWEwiNKa	test	User	\N	Active	2026-07-17 12:28:09.721598+05:30	2026-07-17 12:28:09.721598+05:30	\N
\.


--
-- TOC entry 5388 (class 2606 OID 26045)
-- Name: accounting_invoices accounting_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_invoices
    ADD CONSTRAINT accounting_invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5396 (class 2606 OID 26105)
-- Name: accounting_payments accounting_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_payments
    ADD CONSTRAINT accounting_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5380 (class 2606 OID 25964)
-- Name: accounting_proformas accounting_proformas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_proformas
    ADD CONSTRAINT accounting_proformas_pkey PRIMARY KEY (id);


--
-- TOC entry 5372 (class 2606 OID 25894)
-- Name: accounting_quotations accounting_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_quotations
    ADD CONSTRAINT accounting_quotations_pkey PRIMARY KEY (id);


--
-- TOC entry 5346 (class 2606 OID 25575)
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 5320 (class 2606 OID 25246)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5268 (class 2606 OID 24879)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- TOC entry 5299 (class 2606 OID 25057)
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- TOC entry 5358 (class 2606 OID 25657)
-- Name: custom_field_values custom_field_values_custom_field_id_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_custom_field_id_entity_id_key UNIQUE (custom_field_id, entity_id);


--
-- TOC entry 5360 (class 2606 OID 25655)
-- Name: custom_field_values custom_field_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_pkey PRIMARY KEY (id);


--
-- TOC entry 5354 (class 2606 OID 25634)
-- Name: custom_fields custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT custom_fields_pkey PRIMARY KEY (id);


--
-- TOC entry 5356 (class 2606 OID 25636)
-- Name: custom_fields custom_fields_tenant_id_entity_type_field_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT custom_fields_tenant_id_entity_type_field_name_key UNIQUE (tenant_id, entity_type, field_name);


--
-- TOC entry 5342 (class 2606 OID 25549)
-- Name: customer_success customer_success_lead_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_success
    ADD CONSTRAINT customer_success_lead_id_key UNIQUE (lead_id);


--
-- TOC entry 5344 (class 2606 OID 25547)
-- Name: customer_success customer_success_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_success
    ADD CONSTRAINT customer_success_pkey PRIMARY KEY (id);


--
-- TOC entry 5281 (class 2606 OID 24961)
-- Name: developers developers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_pkey PRIMARY KEY (id);


--
-- TOC entry 5283 (class 2606 OID 24963)
-- Name: developers developers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_user_id_key UNIQUE (user_id);


--
-- TOC entry 5394 (class 2606 OID 26081)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5336 (class 2606 OID 25456)
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 5330 (class 2606 OID 25382)
-- Name: lead_assignments lead_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5340 (class 2606 OID 25520)
-- Name: lead_deliveries lead_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_deliveries
    ADD CONSTRAINT lead_deliveries_pkey PRIMARY KEY (id);


--
-- TOC entry 5333 (class 2606 OID 25426)
-- Name: lead_followups lead_followups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_followups
    ADD CONSTRAINT lead_followups_pkey PRIMARY KEY (id);


--
-- TOC entry 5325 (class 2606 OID 25327)
-- Name: lead_journey lead_journey_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_journey
    ADD CONSTRAINT lead_journey_pkey PRIMARY KEY (id);


--
-- TOC entry 5297 (class 2606 OID 25025)
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 5338 (class 2606 OID 25488)
-- Name: lead_requirements lead_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_requirements
    ADD CONSTRAINT lead_requirements_pkey PRIMARY KEY (id);


--
-- TOC entry 5328 (class 2606 OID 25355)
-- Name: lead_status_history lead_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5352 (class 2606 OID 25610)
-- Name: lead_tag_mapping lead_tag_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_tag_mapping
    ADD CONSTRAINT lead_tag_mapping_pkey PRIMARY KEY (lead_id, tag_id);


--
-- TOC entry 5348 (class 2606 OID 25595)
-- Name: lead_tags lead_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_pkey PRIMARY KEY (id);


--
-- TOC entry 5350 (class 2606 OID 25597)
-- Name: lead_tags lead_tags_tenant_id_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_tenant_id_tag_name_key UNIQUE (tenant_id, tag_name);


--
-- TOC entry 5295 (class 2606 OID 24996)
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- TOC entry 5266 (class 2606 OID 24856)
-- Name: login_sessions login_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5323 (class 2606 OID 25270)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5254 (class 2606 OID 24795)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 5256 (class 2606 OID 24793)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5386 (class 2606 OID 26000)
-- Name: proforma_items proforma_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proforma_items
    ADD CONSTRAINT proforma_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5305 (class 2606 OID 25122)
-- Name: projects projects_lead_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_lead_id_key UNIQUE (lead_id);


--
-- TOC entry 5307 (class 2606 OID 25120)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 5303 (class 2606 OID 25093)
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- TOC entry 5378 (class 2606 OID 25930)
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5258 (class 2606 OID 24803)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5250 (class 2606 OID 24782)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5252 (class 2606 OID 24780)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5318 (class 2606 OID 25217)
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 5364 (class 2606 OID 25698)
-- Name: task_checklists task_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_checklists
    ADD CONSTRAINT task_checklists_pkey PRIMARY KEY (id);


--
-- TOC entry 5316 (class 2606 OID 25187)
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5362 (class 2606 OID 25675)
-- Name: task_dependencies task_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_pkey PRIMARY KEY (task_id, depends_on_task_id);


--
-- TOC entry 5370 (class 2606 OID 25732)
-- Name: task_label_mapping task_label_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_label_mapping
    ADD CONSTRAINT task_label_mapping_pkey PRIMARY KEY (task_id, label_id);


--
-- TOC entry 5366 (class 2606 OID 25718)
-- Name: task_labels task_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_labels
    ADD CONSTRAINT task_labels_pkey PRIMARY KEY (id);


--
-- TOC entry 5368 (class 2606 OID 25720)
-- Name: task_labels task_labels_tenant_id_label_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_labels
    ADD CONSTRAINT task_labels_tenant_id_label_name_key UNIQUE (tenant_id, label_name);


--
-- TOC entry 5314 (class 2606 OID 25153)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5275 (class 2606 OID 24928)
-- Name: team_leaders team_leaders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_pkey PRIMARY KEY (id);


--
-- TOC entry 5277 (class 2606 OID 24932)
-- Name: team_leaders team_leaders_team_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_team_id_key UNIQUE (team_id);


--
-- TOC entry 5279 (class 2606 OID 24930)
-- Name: team_leaders team_leaders_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_user_id_key UNIQUE (user_id);


--
-- TOC entry 5273 (class 2606 OID 24905)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 5248 (class 2606 OID 24769)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 5271 (class 2606 OID 24881)
-- Name: branches unique_tenant_branch_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT unique_tenant_branch_code UNIQUE (tenant_id, branch_code);


--
-- TOC entry 5262 (class 2606 OID 24833)
-- Name: users unique_tenant_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email);


--
-- TOC entry 5264 (class 2606 OID 24831)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5389 (class 1259 OID 26121)
-- Name: idx_ai_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_number ON public.accounting_invoices USING btree (tenant_id, invoice_number);


--
-- TOC entry 5390 (class 1259 OID 26120)
-- Name: idx_ai_proforma; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_proforma ON public.accounting_invoices USING btree (proforma_id);


--
-- TOC entry 5391 (class 1259 OID 26119)
-- Name: idx_ai_tenant_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_tenant_lead ON public.accounting_invoices USING btree (tenant_id, lead_id);


--
-- TOC entry 5381 (class 1259 OID 26117)
-- Name: idx_ap_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ap_number ON public.accounting_proformas USING btree (tenant_id, proforma_number);


--
-- TOC entry 5382 (class 1259 OID 26116)
-- Name: idx_ap_quotation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ap_quotation ON public.accounting_proformas USING btree (quotation_id);


--
-- TOC entry 5383 (class 1259 OID 26115)
-- Name: idx_ap_tenant_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ap_tenant_lead ON public.accounting_proformas USING btree (tenant_id, lead_id);


--
-- TOC entry 5397 (class 1259 OID 26124)
-- Name: idx_apymt_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_apymt_date ON public.accounting_payments USING btree (payment_date);


--
-- TOC entry 5398 (class 1259 OID 26123)
-- Name: idx_apymt_tenant_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_apymt_tenant_invoice ON public.accounting_payments USING btree (tenant_id, invoice_id);


--
-- TOC entry 5373 (class 1259 OID 26113)
-- Name: idx_aq_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aq_number ON public.accounting_quotations USING btree (tenant_id, quotation_number);


--
-- TOC entry 5374 (class 1259 OID 26112)
-- Name: idx_aq_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aq_parent ON public.accounting_quotations USING btree (parent_quotation_id);


--
-- TOC entry 5375 (class 1259 OID 26111)
-- Name: idx_aq_tenant_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aq_tenant_lead ON public.accounting_quotations USING btree (tenant_id, lead_id);


--
-- TOC entry 5321 (class 1259 OID 25285)
-- Name: idx_audit_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_tenant ON public.audit_logs USING btree (tenant_id, created_at DESC);


--
-- TOC entry 5269 (class 1259 OID 25282)
-- Name: idx_branches_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_tenant ON public.branches USING btree (tenant_id);


--
-- TOC entry 5300 (class 1259 OID 25296)
-- Name: idx_communications_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communications_lead ON public.communications USING btree (lead_id);


--
-- TOC entry 5392 (class 1259 OID 26122)
-- Name: idx_ii_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ii_invoice ON public.invoice_items USING btree (invoice_id);


--
-- TOC entry 5334 (class 1259 OID 25748)
-- Name: idx_lead_activities_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_activities_created ON public.lead_activities USING btree (created_at DESC);


--
-- TOC entry 5331 (class 1259 OID 25747)
-- Name: idx_lead_followups_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_followups_date ON public.lead_followups USING btree (followup_date);


--
-- TOC entry 5326 (class 1259 OID 25749)
-- Name: idx_lead_status_history_changed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_status_history_changed ON public.lead_status_history USING btree (changed_at DESC);


--
-- TOC entry 5284 (class 1259 OID 25287)
-- Name: idx_leads_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_active ON public.leads USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5285 (class 1259 OID 25746)
-- Name: idx_leads_assigned_sales_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_assigned_sales_user ON public.leads USING btree (assigned_sales_user_id);


--
-- TOC entry 5286 (class 1259 OID 25292)
-- Name: idx_leads_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_branch ON public.leads USING btree (branch_id);


--
-- TOC entry 5287 (class 1259 OID 25745)
-- Name: idx_leads_reporting_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_reporting_created ON public.leads USING btree (created_at DESC);


--
-- TOC entry 5288 (class 1259 OID 25744)
-- Name: idx_leads_reporting_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_reporting_priority ON public.leads USING btree (priority);


--
-- TOC entry 5289 (class 1259 OID 25743)
-- Name: idx_leads_reporting_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_reporting_status ON public.leads USING btree (status);


--
-- TOC entry 5290 (class 1259 OID 25290)
-- Name: idx_leads_search_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_search_contact ON public.leads USING gin (contact_person public.gin_trgm_ops);


--
-- TOC entry 5291 (class 1259 OID 25289)
-- Name: idx_leads_search_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_search_name ON public.leads USING gin (company_name public.gin_trgm_ops);


--
-- TOC entry 5292 (class 1259 OID 25293)
-- Name: idx_leads_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_team ON public.leads USING btree (team_id);


--
-- TOC entry 5293 (class 1259 OID 25283)
-- Name: idx_leads_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_tenant ON public.leads USING btree (tenant_id);


--
-- TOC entry 5384 (class 1259 OID 26118)
-- Name: idx_pi_proforma; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pi_proforma ON public.proforma_items USING btree (proforma_id);


--
-- TOC entry 5301 (class 1259 OID 25297)
-- Name: idx_proposals_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proposals_lead ON public.proposals USING btree (lead_id);


--
-- TOC entry 5376 (class 1259 OID 26114)
-- Name: idx_qi_quotation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qi_quotation ON public.quotation_items USING btree (quotation_id);


--
-- TOC entry 5308 (class 1259 OID 25288)
-- Name: idx_tasks_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_active ON public.tasks USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5309 (class 1259 OID 25295)
-- Name: idx_tasks_assignee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_assignee ON public.tasks USING btree (assigned_to_id);


--
-- TOC entry 5310 (class 1259 OID 25294)
-- Name: idx_tasks_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_lead ON public.tasks USING btree (lead_id);


--
-- TOC entry 5311 (class 1259 OID 25291)
-- Name: idx_tasks_search_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_search_title ON public.tasks USING gin (title public.gin_trgm_ops);


--
-- TOC entry 5312 (class 1259 OID 25284)
-- Name: idx_tasks_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_tenant ON public.tasks USING btree (tenant_id);


--
-- TOC entry 5259 (class 1259 OID 25286)
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_active ON public.users USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5260 (class 1259 OID 25281)
-- Name: idx_users_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);


--
-- TOC entry 5519 (class 2620 OID 26127)
-- Name: accounting_invoices trg_ai_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ai_updated_at BEFORE UPDATE ON public.accounting_invoices FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5517 (class 2620 OID 26126)
-- Name: accounting_proformas trg_ap_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ap_updated_at BEFORE UPDATE ON public.accounting_proformas FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5522 (class 2620 OID 26128)
-- Name: accounting_payments trg_apymt_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_apymt_updated_at BEFORE UPDATE ON public.accounting_payments FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5514 (class 2620 OID 26125)
-- Name: accounting_quotations trg_aq_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_aq_updated_at BEFORE UPDATE ON public.accounting_quotations FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5515 (class 2620 OID 26130)
-- Name: accounting_quotations trg_enforce_latest_revision; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_latest_revision AFTER INSERT OR UPDATE OF is_latest_revision ON public.accounting_quotations FOR EACH ROW WHEN ((new.is_latest_revision = true)) EXECUTE FUNCTION public.enforce_single_latest_revision();


--
-- TOC entry 5520 (class 2620 OID 26140)
-- Name: invoice_items trg_prevent_invoice_item_mod; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_invoice_item_mod BEFORE INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.prevent_invoice_item_modification();


--
-- TOC entry 5521 (class 2620 OID 26136)
-- Name: invoice_items trg_recalculate_invoice; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalculate_invoice AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();


--
-- TOC entry 5518 (class 2620 OID 26134)
-- Name: proforma_items trg_recalculate_proforma; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalculate_proforma AFTER INSERT OR DELETE OR UPDATE ON public.proforma_items FOR EACH ROW EXECUTE FUNCTION public.recalculate_proforma_totals();


--
-- TOC entry 5516 (class 2620 OID 26132)
-- Name: quotation_items trg_recalculate_quotation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalculate_quotation AFTER INSERT OR DELETE OR UPDATE ON public.quotation_items FOR EACH ROW EXECUTE FUNCTION public.recalculate_quotation_totals();


--
-- TOC entry 5523 (class 2620 OID 26138)
-- Name: accounting_payments trg_sync_invoice_ledger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_invoice_ledger AFTER INSERT OR DELETE OR UPDATE ON public.accounting_payments FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_ledger();


--
-- TOC entry 5500 (class 2620 OID 25301)
-- Name: branches update_branches_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5512 (class 2620 OID 25756)
-- Name: custom_field_values update_custom_field_values_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_custom_field_values_modtime BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5511 (class 2620 OID 25755)
-- Name: custom_fields update_custom_fields_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_custom_fields_modtime BEFORE UPDATE ON public.custom_fields FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5510 (class 2620 OID 25754)
-- Name: customer_success update_customer_success_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customer_success_modtime BEFORE UPDATE ON public.customer_success FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5509 (class 2620 OID 25753)
-- Name: lead_deliveries update_lead_deliveries_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lead_deliveries_modtime BEFORE UPDATE ON public.lead_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5507 (class 2620 OID 25751)
-- Name: lead_followups update_lead_followups_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lead_followups_modtime BEFORE UPDATE ON public.lead_followups FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5506 (class 2620 OID 25750)
-- Name: lead_journey update_lead_journey_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lead_journey_modtime BEFORE UPDATE ON public.lead_journey FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5508 (class 2620 OID 25752)
-- Name: lead_requirements update_lead_requirements_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lead_requirements_modtime BEFORE UPDATE ON public.lead_requirements FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5502 (class 2620 OID 25303)
-- Name: leads update_leads_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5504 (class 2620 OID 25306)
-- Name: projects update_projects_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5503 (class 2620 OID 25305)
-- Name: proposals update_proposals_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_proposals_modtime BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5513 (class 2620 OID 25757)
-- Name: task_checklists update_task_checklists_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_task_checklists_modtime BEFORE UPDATE ON public.task_checklists FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5505 (class 2620 OID 25304)
-- Name: tasks update_tasks_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5501 (class 2620 OID 25302)
-- Name: teams update_teams_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_teams_modtime BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5498 (class 2620 OID 25299)
-- Name: tenants update_tenants_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5499 (class 2620 OID 25300)
-- Name: users update_users_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5473 (class 2606 OID 25576)
-- Name: attachments attachments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5474 (class 2606 OID 25581)
-- Name: attachments attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5442 (class 2606 OID 25247)
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5443 (class 2606 OID 25252)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5404 (class 2606 OID 24887)
-- Name: branches branches_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5405 (class 2606 OID 24882)
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5421 (class 2606 OID 25068)
-- Name: communications communications_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5422 (class 2606 OID 25063)
-- Name: communications communications_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5423 (class 2606 OID 25058)
-- Name: communications communications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5479 (class 2606 OID 25663)
-- Name: custom_field_values custom_field_values_custom_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_custom_field_id_fkey FOREIGN KEY (custom_field_id) REFERENCES public.custom_fields(id) ON DELETE CASCADE;


--
-- TOC entry 5480 (class 2606 OID 25658)
-- Name: custom_field_values custom_field_values_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT custom_field_values_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5478 (class 2606 OID 25637)
-- Name: custom_fields custom_fields_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT custom_fields_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5471 (class 2606 OID 25555)
-- Name: customer_success customer_success_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_success
    ADD CONSTRAINT customer_success_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5472 (class 2606 OID 25550)
-- Name: customer_success customer_success_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_success
    ADD CONSTRAINT customer_success_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5411 (class 2606 OID 24974)
-- Name: developers developers_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE RESTRICT;


--
-- TOC entry 5412 (class 2606 OID 24964)
-- Name: developers developers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5413 (class 2606 OID 24969)
-- Name: developers developers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5494 (class 2606 OID 26046)
-- Name: accounting_invoices fk_ai_lead; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_invoices
    ADD CONSTRAINT fk_ai_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE RESTRICT;


--
-- TOC entry 5495 (class 2606 OID 26051)
-- Name: accounting_invoices fk_ai_proforma; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_invoices
    ADD CONSTRAINT fk_ai_proforma FOREIGN KEY (proforma_id) REFERENCES public.accounting_proformas(id) ON DELETE SET NULL;


--
-- TOC entry 5497 (class 2606 OID 26106)
-- Name: accounting_payments fk_ap_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_payments
    ADD CONSTRAINT fk_ap_invoice FOREIGN KEY (invoice_id) REFERENCES public.accounting_invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5491 (class 2606 OID 25965)
-- Name: accounting_proformas fk_ap_lead; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_proformas
    ADD CONSTRAINT fk_ap_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE RESTRICT;


--
-- TOC entry 5492 (class 2606 OID 25970)
-- Name: accounting_proformas fk_ap_quotation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_proformas
    ADD CONSTRAINT fk_ap_quotation FOREIGN KEY (quotation_id) REFERENCES public.accounting_quotations(id) ON DELETE SET NULL;


--
-- TOC entry 5488 (class 2606 OID 25895)
-- Name: accounting_quotations fk_aq_lead; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_quotations
    ADD CONSTRAINT fk_aq_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5489 (class 2606 OID 25900)
-- Name: accounting_quotations fk_aq_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_quotations
    ADD CONSTRAINT fk_aq_parent FOREIGN KEY (parent_quotation_id) REFERENCES public.accounting_quotations(id) ON DELETE CASCADE;


--
-- TOC entry 5496 (class 2606 OID 26082)
-- Name: invoice_items fk_ii_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES public.accounting_invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5493 (class 2606 OID 26001)
-- Name: proforma_items fk_pi_proforma; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proforma_items
    ADD CONSTRAINT fk_pi_proforma FOREIGN KEY (proforma_id) REFERENCES public.accounting_proformas(id) ON DELETE CASCADE;


--
-- TOC entry 5490 (class 2606 OID 25931)
-- Name: quotation_items fk_qi_quotation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT fk_qi_quotation FOREIGN KEY (quotation_id) REFERENCES public.accounting_quotations(id) ON DELETE CASCADE;


--
-- TOC entry 5461 (class 2606 OID 25462)
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5462 (class 2606 OID 25467)
-- Name: lead_activities lead_activities_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5463 (class 2606 OID 25457)
-- Name: lead_activities lead_activities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5452 (class 2606 OID 25408)
-- Name: lead_assignments lead_assignments_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5453 (class 2606 OID 25393)
-- Name: lead_assignments lead_assignments_assigned_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_assigned_from_user_id_fkey FOREIGN KEY (assigned_from_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5454 (class 2606 OID 25403)
-- Name: lead_assignments lead_assignments_assigned_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_assigned_team_id_fkey FOREIGN KEY (assigned_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 5455 (class 2606 OID 25398)
-- Name: lead_assignments lead_assignments_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5456 (class 2606 OID 25388)
-- Name: lead_assignments lead_assignments_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5457 (class 2606 OID 25383)
-- Name: lead_assignments lead_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignments
    ADD CONSTRAINT lead_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5469 (class 2606 OID 25526)
-- Name: lead_deliveries lead_deliveries_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_deliveries
    ADD CONSTRAINT lead_deliveries_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5470 (class 2606 OID 25521)
-- Name: lead_deliveries lead_deliveries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_deliveries
    ADD CONSTRAINT lead_deliveries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5458 (class 2606 OID 25437)
-- Name: lead_followups lead_followups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_followups
    ADD CONSTRAINT lead_followups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5459 (class 2606 OID 25432)
-- Name: lead_followups lead_followups_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_followups
    ADD CONSTRAINT lead_followups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5460 (class 2606 OID 25427)
-- Name: lead_followups lead_followups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_followups
    ADD CONSTRAINT lead_followups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5446 (class 2606 OID 25338)
-- Name: lead_journey lead_journey_entered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_journey
    ADD CONSTRAINT lead_journey_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5447 (class 2606 OID 25333)
-- Name: lead_journey lead_journey_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_journey
    ADD CONSTRAINT lead_journey_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5448 (class 2606 OID 25328)
-- Name: lead_journey lead_journey_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_journey
    ADD CONSTRAINT lead_journey_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5418 (class 2606 OID 25036)
-- Name: lead_notes lead_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5419 (class 2606 OID 25031)
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5420 (class 2606 OID 25026)
-- Name: lead_notes lead_notes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5464 (class 2606 OID 25761)
-- Name: lead_requirements lead_requirements_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_requirements
    ADD CONSTRAINT lead_requirements_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5465 (class 2606 OID 25499)
-- Name: lead_requirements lead_requirements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_requirements
    ADD CONSTRAINT lead_requirements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5466 (class 2606 OID 25494)
-- Name: lead_requirements lead_requirements_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_requirements
    ADD CONSTRAINT lead_requirements_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5467 (class 2606 OID 25489)
-- Name: lead_requirements lead_requirements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_requirements
    ADD CONSTRAINT lead_requirements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5468 (class 2606 OID 25766)
-- Name: lead_requirements lead_requirements_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_requirements
    ADD CONSTRAINT lead_requirements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5449 (class 2606 OID 25366)
-- Name: lead_status_history lead_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5450 (class 2606 OID 25361)
-- Name: lead_status_history lead_status_history_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5451 (class 2606 OID 25356)
-- Name: lead_status_history lead_status_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5476 (class 2606 OID 25611)
-- Name: lead_tag_mapping lead_tag_mapping_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_tag_mapping
    ADD CONSTRAINT lead_tag_mapping_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5477 (class 2606 OID 25616)
-- Name: lead_tag_mapping lead_tag_mapping_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_tag_mapping
    ADD CONSTRAINT lead_tag_mapping_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.lead_tags(id) ON DELETE CASCADE;


--
-- TOC entry 5475 (class 2606 OID 25598)
-- Name: lead_tags lead_tags_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5414 (class 2606 OID 25308)
-- Name: leads leads_assigned_sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_sales_user_id_fkey FOREIGN KEY (assigned_sales_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5415 (class 2606 OID 25002)
-- Name: leads leads_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- TOC entry 5416 (class 2606 OID 25007)
-- Name: leads leads_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 5417 (class 2606 OID 24997)
-- Name: leads leads_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5403 (class 2606 OID 24857)
-- Name: login_sessions login_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5444 (class 2606 OID 25271)
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5445 (class 2606 OID 25276)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5428 (class 2606 OID 25788)
-- Name: projects projects_developer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_developer_id_fkey FOREIGN KEY (developer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5429 (class 2606 OID 25128)
-- Name: projects projects_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE RESTRICT;


--
-- TOC entry 5430 (class 2606 OID 25783)
-- Name: projects projects_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 5431 (class 2606 OID 25123)
-- Name: projects projects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5424 (class 2606 OID 25771)
-- Name: proposals proposals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5425 (class 2606 OID 25099)
-- Name: proposals proposals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5426 (class 2606 OID 25094)
-- Name: proposals proposals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5427 (class 2606 OID 25776)
-- Name: proposals proposals_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5399 (class 2606 OID 24809)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5400 (class 2606 OID 24804)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5439 (class 2606 OID 25223)
-- Name: task_attachments task_attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5440 (class 2606 OID 25218)
-- Name: task_attachments task_attachments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5441 (class 2606 OID 25228)
-- Name: task_attachments task_attachments_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5483 (class 2606 OID 25704)
-- Name: task_checklists task_checklists_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_checklists
    ADD CONSTRAINT task_checklists_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5484 (class 2606 OID 25699)
-- Name: task_checklists task_checklists_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_checklists
    ADD CONSTRAINT task_checklists_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5436 (class 2606 OID 25198)
-- Name: task_comments task_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5437 (class 2606 OID 25193)
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5438 (class 2606 OID 25188)
-- Name: task_comments task_comments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5481 (class 2606 OID 25681)
-- Name: task_dependencies task_dependencies_depends_on_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_depends_on_task_id_fkey FOREIGN KEY (depends_on_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5482 (class 2606 OID 25676)
-- Name: task_dependencies task_dependencies_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5486 (class 2606 OID 25738)
-- Name: task_label_mapping task_label_mapping_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_label_mapping
    ADD CONSTRAINT task_label_mapping_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.task_labels(id) ON DELETE CASCADE;


--
-- TOC entry 5487 (class 2606 OID 25733)
-- Name: task_label_mapping task_label_mapping_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_label_mapping
    ADD CONSTRAINT task_label_mapping_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5485 (class 2606 OID 25721)
-- Name: task_labels task_labels_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_labels
    ADD CONSTRAINT task_labels_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5432 (class 2606 OID 25164)
-- Name: tasks tasks_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5433 (class 2606 OID 25169)
-- Name: tasks tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.developers(id) ON DELETE SET NULL;


--
-- TOC entry 5434 (class 2606 OID 25159)
-- Name: tasks tasks_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5435 (class 2606 OID 25154)
-- Name: tasks tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5408 (class 2606 OID 24943)
-- Name: team_leaders team_leaders_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE RESTRICT;


--
-- TOC entry 5409 (class 2606 OID 24933)
-- Name: team_leaders team_leaders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5410 (class 2606 OID 24938)
-- Name: team_leaders team_leaders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5406 (class 2606 OID 24911)
-- Name: teams teams_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- TOC entry 5407 (class 2606 OID 24906)
-- Name: teams teams_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5401 (class 2606 OID 24839)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- TOC entry 5402 (class 2606 OID 24834)
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


-- Completed on 2026-07-18 10:53:27

--
-- PostgreSQL database dump complete
--

\unrestrict SPZgYXtZlWzRtLnnRs99gNbHMcODacFyoNwvEP1c5uQ5fESYe1bcmRlWV1l9D0v

