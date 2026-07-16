-- migration_v9.sql
-- Add missing fields to accounting_quotations to support NewQuotationModal

ALTER TABLE public.accounting_quotations
ADD COLUMN customer_name character varying(255),
ADD COLUMN bill_to text,
ADD COLUMN ship_to text,
ADD COLUMN payment_terms character varying(100) DEFAULT 'Due on Receipt',
ADD COLUMN priority character varying(50) DEFAULT 'Normal',
ADD COLUMN shipping_amount numeric(15,2) DEFAULT 0 CHECK (shipping_amount >= 0),
ADD COLUMN terms text;

COMMENT ON COLUMN public.accounting_quotations.customer_name IS 'Customer name for the quotation';
COMMENT ON COLUMN public.accounting_quotations.bill_to IS 'Billing address';
COMMENT ON COLUMN public.accounting_quotations.ship_to IS 'Shipping address';
COMMENT ON COLUMN public.accounting_quotations.payment_terms IS 'Payment terms (e.g., Due on Receipt, Net 15)';
COMMENT ON COLUMN public.accounting_quotations.priority IS 'Priority of the quotation (Normal, High)';
COMMENT ON COLUMN public.accounting_quotations.shipping_amount IS 'Shipping cost added to the quotation';
COMMENT ON COLUMN public.accounting_quotations.terms IS 'Terms and conditions for the quotation';
