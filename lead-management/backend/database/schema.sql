--
-- PostgreSQL database dump
--

\restrict B2W8kOES6j6sveEexgfP2ZSUFQUxRCi8uMCUfhyXhzDg2Yua7VPTKUS4FauOIni

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-02 14:29:02

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
-- TOC entry 5288 (class 0 OID 0)
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
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 920 (class 1247 OID 24680)
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
-- TOC entry 935 (class 1247 OID 24738)
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
-- TOC entry 923 (class 1247 OID 24690)
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
-- TOC entry 926 (class 1247 OID 24704)
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
-- TOC entry 932 (class 1247 OID 24726)
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
-- TOC entry 938 (class 1247 OID 24748)
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
-- TOC entry 917 (class 1247 OID 24670)
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
-- TOC entry 929 (class 1247 OID 24714)
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
-- TOC entry 282 (class 1255 OID 25298)
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    currency character varying(10) DEFAULT 'INR'::character varying,
    status public.proposal_status DEFAULT 'Draft'::public.proposal_status,
    is_approved boolean DEFAULT false,
    contract_signed boolean DEFAULT false,
    advance_received boolean DEFAULT false,
    advance_amount numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.proposals OWNER TO postgres;

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
-- TOC entry 5281 (class 0 OID 25233)
-- Dependencies: 239
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, tenant_id, user_id, entity_name, entity_id, action, details, ip_address, created_at) FROM stdin;
\.


--
-- TOC entry 5269 (class 0 OID 24862)
-- Dependencies: 227
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, tenant_id, manager_id, branch_name, branch_code, company_name, company_location, country, state, city, address, phone, email, assigned_target, achieved_target, health_score, status, description, created_at, updated_at, deleted_at) FROM stdin;
cccc0000-0000-0000-0000-000000000002	aaaa0000-0000-0000-0000-000000000000	\N	Kosqu Corporate Office	KQ001	Kosqu Software	\N	\N	\N	Pune	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
49bb802c-89b2-44c6-8cda-d97939989f9e	aaaa0000-0000-0000-0000-000000000000	\N	Pune Innovation Center Updated	BR-1782909823685	Kosqu Software Pvt Ltd	\N	\N	\N	Pune	\N	\N	pune.ic@kosqu.com	350000.00	0.00	95	Active	\N	2026-07-01 18:13:43.705222+05:30	2026-07-01 18:13:43.909035+05:30	2026-07-01 18:13:43.909035+05:30
ecb191c4-4ea0-41b1-af65-f65bc9eea4ee	aaaa0000-0000-0000-0000-000000000000	\N	Test Branch Timeout	TBT-1782929294040	\N	Pune	\N	\N	Pune	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-01 23:38:14.245299+05:30	2026-07-01 23:53:54.777557+05:30	2026-07-01 23:53:54.777557+05:30
a3e49e76-620b-4add-9bea-7532ab48c0f4	aaaa0000-0000-0000-0000-000000000000	\N	mumbai accenture	fsgs	Kosqu Software	fsfS	India	SFDSDf	zvdfDsdf	sdfasdfSE	1234567890	test2@gmail.com	32454.00	0.00	0	Active	\N	2026-07-02 00:20:44.350849+05:30	2026-07-02 00:29:34.544089+05:30	2026-07-02 00:29:34.544089+05:30
13c038c2-04eb-46bf-8b82-cf27a717ab62	aaaa0000-0000-0000-0000-000000000000	\N	Test	Testasf	Kosqu Software	Others	India	test	test	Test	1234567890	test@gmail.com	1234.00	0.00	10	Active	\N	2026-07-02 00:00:17.616961+05:30	2026-07-02 00:29:40.16656+05:30	2026-07-02 00:29:40.16656+05:30
246692df-6a9c-4029-830b-388d3ab9e919	aaaa0000-0000-0000-0000-000000000000	\N	test three	asdffsadf	Kosqu Software	asdfasdf	India	asdf	asfd	asdfasdfad	01234567890	test3@gmail.com	0.00	0.00	0	Active	\N	2026-07-02 00:31:06.228651+05:30	2026-07-02 00:31:06.228651+05:30	\N
b23ddc61-0a8e-4c7d-b29d-5309ef3c47d5	aaaa0000-0000-0000-0000-000000000000	\N	test five	asdf23	Kosqu Software	airoli	India	SFDSDf	zvdfDsdf	sdfasdfSE	01234567890	test5@gmail.com	2345.00	0.00	1	Active	\N	2026-07-02 10:10:25.534499+05:30	2026-07-02 10:34:50.226201+05:30	2026-07-02 10:34:50.226201+05:30
866c8979-1931-429f-98ce-6f9d234309fa	aaaa0000-0000-0000-0000-000000000000	\N	tcs	asdfasdf	Kosqu Software	asfasdvadv	India	SDvSDv	sdvasdvXV	sdZV DSVZVS	01234567890	test4@gmail.com	3252.00	0.00	1	Active	\N	2026-07-02 00:54:54.758915+05:30	2026-07-02 10:34:55.194157+05:30	2026-07-02 10:34:55.194157+05:30
a77ce849-ae68-4e8b-9348-c4e1edc62b3b	aaaa0000-0000-0000-0000-000000000000	\N	Test Branch	TEST_67OTE	Test Company	\N	\N	\N	Mumbai	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-02 00:45:49.853256+05:30	2026-07-02 10:35:00.659355+05:30	2026-07-02 10:35:00.659355+05:30
cccc0000-0000-0000-0000-000000000001	aaaa0000-0000-0000-0000-000000000000	bbbb0000-0000-0000-0000-000000000002	Kosque Advertisement	KA004	Kosque Media	\N	\N	\N	Mumbai	\N	\N	\N	0.00	0.00	\N	Active	\N	2026-07-01 16:48:41.545275+05:30	2026-07-02 12:16:20.178259+05:30	2026-07-02 12:16:20.178259+05:30
423f43cf-7038-4945-a33b-7760eba13666	aaaa0000-0000-0000-0000-000000000000	ad7dad47-4ee9-4426-8f2f-480ea872b979	Test6	34qfw	Kosqu Software	Test6 location	India	test	Test	afasfdfsdbdg	9209017621	test@gmail.com	324.00	0.00	10	Active	\N	2026-07-02 10:36:45.135581+05:30	2026-07-02 12:23:13.14697+05:30	2026-07-02 12:23:13.14697+05:30
\.


--
-- TOC entry 5275 (class 0 OID 25041)
-- Dependencies: 233
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communications (id, tenant_id, lead_id, author_id, type, comm_date, comm_time, subject, discussion_summary, client_problem, suggested_solution, success_status, attachment_url, created_at) FROM stdin;
\.


--
-- TOC entry 5272 (class 0 OID 24948)
-- Dependencies: 230
-- Data for Name: developers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.developers (id, tenant_id, user_id, team_id, employee_id, skills, experience_years, joining_date, created_at, updated_at) FROM stdin;
6161ba44-afd5-43f9-936e-4950e9a54d70	aaaa0000-0000-0000-0000-000000000000	bbbb0000-0000-0000-0000-000000000004	dddd0000-0000-0000-0000-000000000001	DEV1001	React, Node.js, PostgreSQL	\N	\N	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30
\.


--
-- TOC entry 5274 (class 0 OID 25012)
-- Dependencies: 232
-- Data for Name: lead_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_notes (id, tenant_id, lead_id, author_id, content, created_at) FROM stdin;
\.


--
-- TOC entry 5273 (class 0 OID 24979)
-- Dependencies: 231
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, tenant_id, branch_id, team_id, assigned_sales_id, name, company_name, contact_person, mobile, email, website, industry, address, country, city, lead_source, campaign, referral_name, advertisement, social_media, website_inquiry, budget, decision_maker, expected_start_date, business_need, project_type, lead_score, priority, expected_revenue, status, next_follow_up_date, reminder_notes, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5268 (class 0 OID 24844)
-- Dependencies: 226
-- Data for Name: login_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at) FROM stdin;
8fb6770b-3a29-4eed-b43b-2d3f3dc2ae36	bbbb0000-0000-0000-0000-000000000004	$2b$10$GT853DonJyasvzu.gK6eKOGaSDw6S/bceoObJa7Rjoz2KLdEWAFwi	::1	node	2026-07-08 16:50:26.041+05:30	2026-07-01 16:50:26.153832+05:30
b368425f-c626-41c8-b9ce-d16a6f0cdaab	bbbb0000-0000-0000-0000-000000000001	$2b$10$NwrMXDmFVMXRv8uxWyt3X.tw.etnOGuFYxB6BpetLdMtjO/Xq7oRq	::1	PostmanRuntime/7.51.1	2026-07-08 17:10:37.533+05:30	2026-07-01 17:10:37.646767+05:30
726dd114-a07d-4850-8004-b09d152a8470	bbbb0000-0000-0000-0000-000000000004	$2b$10$NqRz1/hC9P7wztwJnsxPwOSLCQOEJseohroqhcUS1d6eEKVFDNMKS	::1	PostmanRuntime/7.51.1	2026-07-08 17:10:44.375+05:30	2026-07-01 17:10:44.476992+05:30
a1d25851-dae7-4195-92c0-0ee8f5b307ed	bbbb0000-0000-0000-0000-000000000001	$2b$10$0RiueCY3ghTNsxutazk9L.BxFa61pe9DXw2I3SZM7PDXqHDMg4ZEC	::1	node	2026-07-08 18:13:43.064+05:30	2026-07-01 18:13:43.161357+05:30
ebc71c54-10ce-45e5-93fe-3530588386d5	bbbb0000-0000-0000-0000-000000000004	$2b$10$.aM/vBCDLVoHPR9Kui4Dmu1ClQp57Z7LdluKqHWfiih0sMGpveRqa	::1	node	2026-07-08 18:13:43.3+05:30	2026-07-01 18:13:43.398184+05:30
9932237d-f82f-43a2-8819-79e93ee36678	bbbb0000-0000-0000-0000-000000000003	$2b$10$V6BpBklwPo9R515qaOrZKeICMneXI79SfuiHGRhINrnzosDr4lyu.	::1	node	2026-07-08 18:13:43.524+05:30	2026-07-01 18:13:43.634879+05:30
ca959f85-c7e9-406f-8458-cecfacc43516	bbbb0000-0000-0000-0000-000000000001	$2b$10$6045qYT1CnTLbD57Ra9R9.iqSoLLk44d14hu4JEmieA/AQ/htLOYu	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-08 21:02:53.509+05:30	2026-07-01 21:02:53.611035+05:30
1e049972-cfd0-41a5-9108-3fbf27d6ac23	bbbb0000-0000-0000-0000-000000000001	$2b$10$OO4tdO8oCPD47Ibz0z8lweojoc4ABZoLILsC3aTFM/zQi.R3voHbO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-08 23:00:33.596+05:30	2026-07-01 23:00:33.998158+05:30
5a44f785-e8b0-447b-a741-79bfc944b096	bbbb0000-0000-0000-0000-000000000001	$2b$10$g55sq2zdqb3PEFyaRWMySOJbpYO4X9Nb8kIwPFWySKghhJWakhb3m	::1	node	2026-07-08 23:37:48.296+05:30	2026-07-01 23:37:48.995009+05:30
0e9e16d9-7f8b-4931-b753-6d78118053f7	bbbb0000-0000-0000-0000-000000000001	$2b$10$Be1z8HENy.2o1E8UyRIZ0eoQoZTM9OAbwyFaaQMgR2PDgvZMbFH5u	::1	node	2026-07-08 23:38:13.435+05:30	2026-07-01 23:38:13.924337+05:30
ed5d14f5-f35b-44eb-bca4-7c3b659cd184	bbbb0000-0000-0000-0000-000000000001	$2b$10$ofAblJxsez0GmtiCk2nF/uiwZsQHKrRwJd.fp7.U72RdLrocOD3wu	::1	node	2026-07-08 23:43:41.674+05:30	2026-07-01 23:43:42.127112+05:30
3bb75140-e6da-429c-bc27-502994365fe0	bbbb0000-0000-0000-0000-000000000001	$2b$10$OsVSc38pI4JzDQMb.VlioeOlOITbRO3rRM06DsV08OTvE.5bsnkuS	::1	node	2026-07-09 00:13:38.424+05:30	2026-07-02 00:13:38.860821+05:30
922c2f2c-aca5-409f-bcff-9a32245509a9	bbbb0000-0000-0000-0000-000000000001	$2b$10$cq2BHWuf6Pe/lQSgX0YCJ.7JDNCNi2FcYhcEykXcT/Zjf4ieY7Tnm	::1	node	2026-07-09 00:13:39.608+05:30	2026-07-02 00:13:40.013349+05:30
a81fc0a9-2c94-40a8-87f8-ebbcd2855aa2	bbbb0000-0000-0000-0000-000000000002	$2b$10$QIJGjnUNkHV.2FoXbxIAY.ireAlCcETf9ac7cEvY8g.q4qGtVDzDu	::1	node	2026-07-09 00:13:40.509+05:30	2026-07-02 00:13:41.119212+05:30
e8719930-67ba-4252-bd74-9e87e2f941d2	bbbb0000-0000-0000-0000-000000000003	$2b$10$Z98NumZz6O41X3QeLjhaD.xWzBqAljYen5Bsv9v2NdWqqCv5xizeO	::1	node	2026-07-09 00:13:41.967+05:30	2026-07-02 00:13:42.425839+05:30
87b86d73-3618-4c6c-a91a-ceaf7bfa9548	bbbb0000-0000-0000-0000-000000000004	$2b$10$6fY9ymXlYcJ9sYxiLzVn1uiIV8Rtmhdzt9M74HithRF7VGSXyqek6	::1	node	2026-07-09 00:13:42.848+05:30	2026-07-02 00:13:43.223143+05:30
0c07be70-6f34-40b8-b639-974a708cca80	ad7dad47-4ee9-4426-8f2f-480ea872b979	$2b$10$dhHzTiqzvaMbp6KmUcsBUeEIhR9lwMFxZ6UJcUNm.EflxKGjDT91W	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 10:37:01.836+05:30	2026-07-02 10:37:01.930913+05:30
e18bc2d7-5ea1-4209-9b4a-8c4682cd11e8	bbbb0000-0000-0000-0000-000000000001	$2b$10$4yQ9.POs1oQDAaviOT5UreHYAmTtiIKLrCpKR9JZsliGCfl37Onoi	::1	PostmanRuntime/7.51.1	2026-07-09 11:46:57.634+05:30	2026-07-02 11:46:57.739314+05:30
fe1626c8-2ba2-40c9-9bf4-c3fd26f99d05	bbbb0000-0000-0000-0000-000000000001	$2b$10$yePIr9nxLt2/lQnxqHtZouhfedUSP1TVX7cLtpX8IEssGJ9xyZkGa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 12:05:55.077+05:30	2026-07-02 12:05:55.24228+05:30
05bcd7c4-3ee0-42df-b9aa-b6efbc21372e	bbbb0000-0000-0000-0000-000000000001	$2b$10$OAZNNQDa6gjdEPpy4Cbqru4ef2zjBuaSp.sa2NteXzN7168GWW6CK	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-09 12:22:58.502+05:30	2026-07-02 12:22:58.598282+05:30
\.


--
-- TOC entry 5282 (class 0 OID 25257)
-- Dependencies: 240
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, tenant_id, user_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5265 (class 0 OID 24783)
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
-- TOC entry 5277 (class 0 OID 25104)
-- Dependencies: 235
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, tenant_id, lead_id, project_name, start_date, deadline, technology, status, progress_pct, total_cost, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5276 (class 0 OID 25073)
-- Dependencies: 234
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proposals (id, tenant_id, lead_id, proposal_number, proposal_version, business_analysis, technical_analysis, risk_analysis, scope, timeline, est_hours, quotation_amount, discount, final_cost, currency, status, is_approved, contract_signed, advance_received, advance_amount, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5266 (class 0 OID 24796)
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
-- TOC entry 5264 (class 0 OID 24770)
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
-- TOC entry 5280 (class 0 OID 25203)
-- Dependencies: 238
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_attachments (id, tenant_id, task_id, uploaded_by_id, file_name, file_url, file_size_bytes, mime_type, created_at) FROM stdin;
\.


--
-- TOC entry 5279 (class 0 OID 25174)
-- Dependencies: 237
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_comments (id, tenant_id, task_id, author_id, comment, created_at) FROM stdin;
\.


--
-- TOC entry 5278 (class 0 OID 25133)
-- Dependencies: 236
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, tenant_id, lead_id, assigned_by_id, assigned_to_id, title, description, category, priority, status, assigned_date, due_date, est_hours, hours_worked, progress_pct, blocker_reason, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5271 (class 0 OID 24916)
-- Dependencies: 229
-- Data for Name: team_leaders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_leaders (id, tenant_id, user_id, team_id, employee_id, designation, performance_score, created_at, updated_at) FROM stdin;
f2a93e2b-f0ce-462e-9872-5c35724ca320	aaaa0000-0000-0000-0000-000000000000	7b02aeb2-5ed8-42b7-8e45-6b968aae18b1	2174be67-7333-448d-8a70-738571bdefbf	test@gmail.com	Team Leader	90	2026-07-02 12:24:29.891933+05:30	2026-07-02 12:24:29.891933+05:30
9745ff00-2e47-4782-8930-73eeb48db775	aaaa0000-0000-0000-0000-000000000000	1344cc94-2641-41b7-bc9e-1508de08a9d5	249c05cc-3ab1-42e9-a85b-cf96733e63fb	test	Team Leader	90	2026-07-02 12:36:13.373828+05:30	2026-07-02 12:36:13.373828+05:30
\.


--
-- TOC entry 5270 (class 0 OID 24892)
-- Dependencies: 228
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, tenant_id, branch_id, team_name, department, created_at, updated_at, deleted_at) FROM stdin;
dddd0000-0000-0000-0000-000000000001	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000001	Mumbai Avengers	CRM Development	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
d5911344-f3d7-49fd-9d09-84f51486e2fd	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000002	Guardians_5438	Space	2026-07-02 11:37:27.765034+05:30	2026-07-02 11:37:27.932189+05:30	2026-07-02 11:37:27.932189+05:30
50c04ebb-5758-4aaf-b081-04d7635dda54	aaaa0000-0000-0000-0000-000000000000	cccc0000-0000-0000-0000-000000000002	Guardians_2727	Space	2026-07-02 11:37:48.676782+05:30	2026-07-02 11:37:48.885322+05:30	2026-07-02 11:37:48.885322+05:30
2174be67-7333-448d-8a70-738571bdefbf	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	asdfghj	CRM Development	2026-07-02 12:24:29.891933+05:30	2026-07-02 12:24:29.891933+05:30	\N
249c05cc-3ab1-42e9-a85b-cf96733e63fb	aaaa0000-0000-0000-0000-000000000000	246692df-6a9c-4029-830b-388d3ab9e919	super duper	CRM Development	2026-07-02 12:36:13.373828+05:30	2026-07-02 12:36:13.373828+05:30	\N
\.


--
-- TOC entry 5263 (class 0 OID 24759)
-- Dependencies: 221
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, status, created_at, updated_at, deleted_at) FROM stdin;
aaaa0000-0000-0000-0000-000000000000	Kosqu Corporate Software	Active	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
\.


--
-- TOC entry 5267 (class 0 OID 24814)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, tenant_id, role_id, email, password_hash, first_name, last_name, phone, status, created_at, updated_at, deleted_at) FROM stdin;
bbbb0000-0000-0000-0000-000000000001	aaaa0000-0000-0000-0000-000000000000	11111111-1111-1111-1111-111111111111	admin@antigravity.com	$2b$10$uoNhEr5tKgfCj3S/pzIzX.YmDi6aL2t/GDhkdxq/vUS4.5d6xvhhW	System	Admin	\N	Active	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
bbbb0000-0000-0000-0000-000000000002	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	pooja.hegde@kosqueadv.com	$2b$10$PAw9t24XGGihZcRo9BfZKunsZjhLyJr2gW7uFs5RPb1.RY5AUFGw6	Pooja	Hegde	\N	Active	2026-07-01 16:48:41.545275+05:30	2026-07-01 16:48:41.545275+05:30	\N
bbbb0000-0000-0000-0000-000000000004	aaaa0000-0000-0000-0000-000000000000	44444444-4444-4444-4444-444444444444	aarav.mehta@kosqu.com	$2b$10$F5PIkVgLfMhRXvF9O1YYmO2X9JGzDYGXkcEgwMwTOPjGz8NCCYZqC	Aarav	Mehta	\N	Active	2026-07-01 16:48:41.545275+05:30	2026-07-02 00:12:51.104888+05:30	\N
ad7dad47-4ee9-4426-8f2f-480ea872b979	aaaa0000-0000-0000-0000-000000000000	22222222-2222-2222-2222-222222222222	test6@gmail.com	$2b$10$fUUU4dVa.ZPsU3jvV2nVjO3wpqP2YMkpHLceVziWA2oASEUNg6gqy	Test	six	9209017621	Active	2026-07-02 10:36:45.135581+05:30	2026-07-02 10:36:45.135581+05:30	\N
7cde0dd9-8e11-49bc-b8cc-8b04c70285db	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	starlord_5438@guardians.com	$2b$10$nOuQQQSsVQzS9JQY7nObguBmDihDgZ3jmWcfIGDb29HftMPeo/cUe	Star	Lord	\N	Inactive	2026-07-02 11:37:27.77473+05:30	2026-07-02 11:37:27.922122+05:30	2026-07-02 11:37:27.922122+05:30
af3e2ac7-f302-4cc0-b56c-4f70e2c3dd14	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	starlord_2727@guardians.com	$2b$10$UhS746tVzhJ2HDMOdU6l1uf2xc177.mDwTIvlg182Je7ast1dBbBG	Star	Lord	\N	Inactive	2026-07-02 11:37:48.687362+05:30	2026-07-02 11:37:48.875465+05:30	2026-07-02 11:37:48.875465+05:30
bbbb0000-0000-0000-0000-000000000003	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	rohan.verma@kosqu.com	$2b$10$mWNj2bzDHMSW3vh7mPObnOliekyEi58GRsxVklWQ7hFJwJ.hOjXkK	Rohan	Verma	\N	Inactive	2026-07-01 16:48:41.545275+05:30	2026-07-02 12:23:05.085603+05:30	2026-07-02 12:23:05.085603+05:30
7b02aeb2-5ed8-42b7-8e45-6b968aae18b1	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	leader@gmail.com	$2b$10$DfZtGgscgffelZIob.wwKOFW3uNIzQcaj4S9JO7wjKqks/hHkkLaq	Test	leader	\N	Active	2026-07-02 12:24:29.891933+05:30	2026-07-02 12:24:29.891933+05:30	\N
1344cc94-2641-41b7-bc9e-1508de08a9d5	aaaa0000-0000-0000-0000-000000000000	33333333-3333-3333-3333-333333333333	leader1@gmail.com	$2b$10$00.SyB7J7vX3QkV6Ste8E.BvxCv7HT1e1g7vXjyaYbFNlsY.A2Tf6	test	leader	\N	Active	2026-07-02 12:36:13.373828+05:30	2026-07-02 12:36:13.373828+05:30	\N
\.


--
-- TOC entry 5062 (class 2606 OID 25246)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 2606 OID 24879)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- TOC entry 5041 (class 2606 OID 25057)
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- TOC entry 5027 (class 2606 OID 24961)
-- Name: developers developers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_pkey PRIMARY KEY (id);


--
-- TOC entry 5029 (class 2606 OID 24963)
-- Name: developers developers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_user_id_key UNIQUE (user_id);


--
-- TOC entry 5039 (class 2606 OID 25025)
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 5037 (class 2606 OID 24996)
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- TOC entry 5012 (class 2606 OID 24856)
-- Name: login_sessions login_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 25270)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5000 (class 2606 OID 24795)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 5002 (class 2606 OID 24793)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 25122)
-- Name: projects projects_lead_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_lead_id_key UNIQUE (lead_id);


--
-- TOC entry 5049 (class 2606 OID 25120)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 5045 (class 2606 OID 25093)
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- TOC entry 5004 (class 2606 OID 24803)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 4996 (class 2606 OID 24782)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4998 (class 2606 OID 24780)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5060 (class 2606 OID 25217)
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 25187)
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5056 (class 2606 OID 25153)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5021 (class 2606 OID 24928)
-- Name: team_leaders team_leaders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_pkey PRIMARY KEY (id);


--
-- TOC entry 5023 (class 2606 OID 24932)
-- Name: team_leaders team_leaders_team_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_team_id_key UNIQUE (team_id);


--
-- TOC entry 5025 (class 2606 OID 24930)
-- Name: team_leaders team_leaders_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_user_id_key UNIQUE (user_id);


--
-- TOC entry 5019 (class 2606 OID 24905)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 4994 (class 2606 OID 24769)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 24881)
-- Name: branches unique_tenant_branch_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT unique_tenant_branch_code UNIQUE (tenant_id, branch_code);


--
-- TOC entry 5008 (class 2606 OID 24833)
-- Name: users unique_tenant_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email);


--
-- TOC entry 5010 (class 2606 OID 24831)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 1259 OID 25285)
-- Name: idx_audit_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_tenant ON public.audit_logs USING btree (tenant_id, created_at DESC);


--
-- TOC entry 5015 (class 1259 OID 25282)
-- Name: idx_branches_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_tenant ON public.branches USING btree (tenant_id);


--
-- TOC entry 5042 (class 1259 OID 25296)
-- Name: idx_communications_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communications_lead ON public.communications USING btree (lead_id);


--
-- TOC entry 5030 (class 1259 OID 25287)
-- Name: idx_leads_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_active ON public.leads USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5031 (class 1259 OID 25292)
-- Name: idx_leads_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_branch ON public.leads USING btree (branch_id);


--
-- TOC entry 5032 (class 1259 OID 25290)
-- Name: idx_leads_search_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_search_contact ON public.leads USING gin (contact_person public.gin_trgm_ops);


--
-- TOC entry 5033 (class 1259 OID 25289)
-- Name: idx_leads_search_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_search_name ON public.leads USING gin (company_name public.gin_trgm_ops);


--
-- TOC entry 5034 (class 1259 OID 25293)
-- Name: idx_leads_team; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_team ON public.leads USING btree (team_id);


--
-- TOC entry 5035 (class 1259 OID 25283)
-- Name: idx_leads_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_tenant ON public.leads USING btree (tenant_id);


--
-- TOC entry 5043 (class 1259 OID 25297)
-- Name: idx_proposals_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proposals_lead ON public.proposals USING btree (lead_id);


--
-- TOC entry 5050 (class 1259 OID 25288)
-- Name: idx_tasks_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_active ON public.tasks USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5051 (class 1259 OID 25295)
-- Name: idx_tasks_assignee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_assignee ON public.tasks USING btree (assigned_to_id);


--
-- TOC entry 5052 (class 1259 OID 25294)
-- Name: idx_tasks_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_lead ON public.tasks USING btree (lead_id);


--
-- TOC entry 5053 (class 1259 OID 25291)
-- Name: idx_tasks_search_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_search_title ON public.tasks USING gin (title public.gin_trgm_ops);


--
-- TOC entry 5054 (class 1259 OID 25284)
-- Name: idx_tasks_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_tenant ON public.tasks USING btree (tenant_id);


--
-- TOC entry 5005 (class 1259 OID 25286)
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_active ON public.users USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5006 (class 1259 OID 25281)
-- Name: idx_users_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);


--
-- TOC entry 5110 (class 2620 OID 25301)
-- Name: branches update_branches_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5112 (class 2620 OID 25303)
-- Name: leads update_leads_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5114 (class 2620 OID 25306)
-- Name: projects update_projects_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5113 (class 2620 OID 25305)
-- Name: proposals update_proposals_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_proposals_modtime BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5115 (class 2620 OID 25304)
-- Name: tasks update_tasks_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5111 (class 2620 OID 25302)
-- Name: teams update_teams_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_teams_modtime BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5108 (class 2620 OID 25299)
-- Name: tenants update_tenants_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5109 (class 2620 OID 25300)
-- Name: users update_users_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 5104 (class 2606 OID 25247)
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5105 (class 2606 OID 25252)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5071 (class 2606 OID 24887)
-- Name: branches branches_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5072 (class 2606 OID 24882)
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5087 (class 2606 OID 25068)
-- Name: communications communications_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5088 (class 2606 OID 25063)
-- Name: communications communications_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5089 (class 2606 OID 25058)
-- Name: communications communications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5078 (class 2606 OID 24974)
-- Name: developers developers_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE RESTRICT;


--
-- TOC entry 5079 (class 2606 OID 24964)
-- Name: developers developers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5080 (class 2606 OID 24969)
-- Name: developers developers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5084 (class 2606 OID 25036)
-- Name: lead_notes lead_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5085 (class 2606 OID 25031)
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5086 (class 2606 OID 25026)
-- Name: lead_notes lead_notes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5081 (class 2606 OID 25002)
-- Name: leads leads_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- TOC entry 5082 (class 2606 OID 25007)
-- Name: leads leads_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 5083 (class 2606 OID 24997)
-- Name: leads leads_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5070 (class 2606 OID 24857)
-- Name: login_sessions login_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5106 (class 2606 OID 25271)
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5107 (class 2606 OID 25276)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5092 (class 2606 OID 25128)
-- Name: projects projects_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE RESTRICT;


--
-- TOC entry 5093 (class 2606 OID 25123)
-- Name: projects projects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5090 (class 2606 OID 25099)
-- Name: proposals proposals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5091 (class 2606 OID 25094)
-- Name: proposals proposals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5066 (class 2606 OID 24809)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5067 (class 2606 OID 24804)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5101 (class 2606 OID 25223)
-- Name: task_attachments task_attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5102 (class 2606 OID 25218)
-- Name: task_attachments task_attachments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5103 (class 2606 OID 25228)
-- Name: task_attachments task_attachments_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 25198)
-- Name: task_comments task_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 25193)
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 5100 (class 2606 OID 25188)
-- Name: task_comments task_comments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5094 (class 2606 OID 25164)
-- Name: tasks tasks_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5095 (class 2606 OID 25169)
-- Name: tasks tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.developers(id) ON DELETE SET NULL;


--
-- TOC entry 5096 (class 2606 OID 25159)
-- Name: tasks tasks_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5097 (class 2606 OID 25154)
-- Name: tasks tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5075 (class 2606 OID 24943)
-- Name: team_leaders team_leaders_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE RESTRICT;


--
-- TOC entry 5076 (class 2606 OID 24933)
-- Name: team_leaders team_leaders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5077 (class 2606 OID 24938)
-- Name: team_leaders team_leaders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_leaders
    ADD CONSTRAINT team_leaders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5073 (class 2606 OID 24911)
-- Name: teams teams_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- TOC entry 5074 (class 2606 OID 24906)
-- Name: teams teams_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5068 (class 2606 OID 24839)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- TOC entry 5069 (class 2606 OID 24834)
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


-- Completed on 2026-07-02 14:29:02

--
-- PostgreSQL database dump complete
--

\unrestrict B2W8kOES6j6sveEexgfP2ZSUFQUxRCi8uMCUfhyXhzDg2Yua7VPTKUS4FauOIni


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
