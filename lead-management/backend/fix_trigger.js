require('dotenv').config();
const db = require('./src/database');
const sql = `
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
`;
db.query(sql).then(() => { console.log('Fixed Trigger'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
