import apiClient from './apiClient';

// =====================================================================
// DATA MAPPERS: Frontend ↔ Backend shape translation
// These keep modal components and UI code completely untouched.
// =====================================================================

// --- Quotation Mappers ---

const mapQuotationItemToBackend = (item) => ({
  service_name: (item.service || '').trim() || 'Service Item',
  description: (item.desc || '').trim() || null,
  hsn_sac: (item.hsn || '').trim() || null,
  quantity: parseFloat(item.qty) || 1,
  unit: (item.unit || '').trim() || 'Nos',
  rate: parseFloat(item.rate) || 0,
  discount_percentage: parseFloat(item.discount) || 0,
  tax_percentage: parseFloat(item.tax) || 18,
});

const processItemsForBackend = (items) => {
  const mapped = (items || []).map(mapQuotationItemToBackend);
  if (mapped.length === 0) {
    mapped.push(mapQuotationItemToBackend({}));
  }
  return mapped;
};

const mapQuotationItemToFrontend = (item) => ({
  id: item.id,
  service: item.service_name || '',
  desc: item.description || '',
  hsn: item.hsn_sac || '',
  qty: parseFloat(item.quantity) || 1,
  unit: item.unit || 'Nos',
  rate: parseFloat(item.rate) || 0,
  discount: parseFloat(item.discount_percentage) || 0,
  tax: parseFloat(item.tax_percentage) || 18,
});

const mapQuotationToFrontend = (q) => {
  const grandTotal = parseFloat(q.grand_total) || 0;
  const subtotal = parseFloat(q.subtotal) || 0;
  const discountTotal = parseFloat(q.discount_total) || 0;
  const taxTotal = parseFloat(q.tax_total) || 0;
  const taxable = subtotal;

  return {
    // IDs
    quotationId: q.id,
    parentQuotationId: q.parent_quotation_id || q.id,
    quotationNumber: q.quotation_number,
    // Revision metadata
    revisionNumber: q.parent_quotation_id ? 1 : 0, // will be corrected in grouping
    revisionLabel: q.parent_quotation_id ? 'Revision' : 'Original',
    isParent: !q.parent_quotation_id,
    isLatestRevision: q.is_latest_revision,
    createdFromRevisionId: q.parent_quotation_id || null,
    // Data
    quotationDate: q.quotation_date ? new Date(q.quotation_date).toISOString().split('T')[0] : '',
    customerName: q.customer_name || '',
    billTo: q.bill_to || '',
    shipTo: q.ship_to || '',
    paymentTerms: q.payment_terms || 'Due on Receipt',
    priority: q.priority || 'Normal',
    shippingAmount: parseFloat(q.shipping_amount) || 0,
    terms: q.terms || '',
    negotiationStatus: mapBackendStatusToFrontendNegotiation(q.status),
    totalAmount: grandTotal,
    validity: q.validity_days ? `${q.validity_days} Days` : '30 Days',
    notes: q.notes || '',
    document: q.document_url || null,
    // Items will be attached separately on detail fetch
    items: (q.items || []).map(mapQuotationItemToFrontend),
    totals: {
      subtotal: subtotal + discountTotal, // gross before discount
      discount: discountTotal,
      taxable: taxable,
      cgst: taxTotal / 2,
      sgst: taxTotal / 2,
      grandTotal: grandTotal,
    },
  };
};

const mapBackendStatusToFrontendNegotiation = (status) => {
  const map = {
    'Draft': 'Pending Review',
    'Sent': 'Pending Review',
    'In Negotiation': 'Under Negotiation',
    'Accepted': 'Approved & Signed',
    'Rejected': 'Rejected',
    'Expired': 'Expired',
  };
  return map[status] || status || 'Pending Review';
};

const mapFrontendNegotiationToBackendStatus = (negotiation) => {
  const map = {
    'Pending Review': 'Draft',
    'Under Negotiation': 'In Negotiation',
    'Approved & Signed': 'Accepted',
    'Rejected': 'Rejected',
    'Expired': 'Expired',
  };
  return map[negotiation] || 'Draft';
};


// --- Proforma Mappers ---

const mapProformaToFrontend = (p) => {
  const grandTotal = parseFloat(p.grand_total) || 0;
  const subtotal = parseFloat(p.subtotal) || 0;
  const discountTotal = parseFloat(p.discount_total) || 0;
  const taxTotal = parseFloat(p.tax_total) || 0;

  return {
    proformaId: p.id,
    proformaNumber: p.proforma_number,
    customerName: p.customer_name || '',
    proformaDate: p.proforma_date ? new Date(p.proforma_date).toISOString().split('T')[0] : '',
    dueDate: p.due_date ? new Date(p.due_date).toISOString().split('T')[0] : '',
    validUntil: p.due_date ? new Date(p.due_date).toISOString().split('T')[0] : '',
    status: p.status || 'Unpaid',
    refNo: p.quotation_id || '',
    totalAmount: grandTotal,
    baseAmount: subtotal,
    taxAmount: taxTotal,
    notes: p.notes || '',
    document: p.document_url || null,
    items: (p.items || []).map(mapQuotationItemToFrontend),
    totals: {
      subtotal: subtotal + discountTotal,
      discount: discountTotal,
      taxable: subtotal,
      cgst: taxTotal / 2,
      sgst: taxTotal / 2,
      grandTotal: grandTotal,
    },
  };
};


// --- Invoice Mappers ---

const mapInvoiceToFrontend = (inv) => {
  const grandTotal = parseFloat(inv.grand_total) || 0;
  const subtotal = parseFloat(inv.subtotal) || 0;
  const discountTotal = parseFloat(inv.discount_total) || 0;
  const taxTotal = parseFloat(inv.tax_total) || 0;
  const amountPaid = parseFloat(inv.amount_paid) || 0;
  const balanceDue = parseFloat(inv.balance_due) || grandTotal;

  return {
    invoiceId: inv.id,
    invoiceNumber: inv.invoice_number,
    customerName: inv.customer_name || '',
    invoiceDate: inv.invoice_date ? new Date(inv.invoice_date).toISOString().split('T')[0] : '',
    dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
    status: inv.status || 'Pending',
    invoiceType: inv.invoice_type || 'GST Invoice',
    placeOfSupply: inv.place_of_supply || '',
    currency: inv.currency || 'INR',
    refNo: inv.proforma_id || '',
    baseAmount: subtotal,
    taxAmount: taxTotal,
    totalAmount: grandTotal,
    amountPaid: amountPaid,
    balanceDue: balanceDue,
    notes: inv.notes || '',
    document: inv.document_url || null,
    items: (inv.items || []).map(mapQuotationItemToFrontend),
    totals: {
      subtotal: subtotal + discountTotal,
      discount: discountTotal,
      taxable: subtotal,
      cgst: taxTotal / 2,
      sgst: taxTotal / 2,
      grandTotal: grandTotal,
    },
  };
};


// --- Payment Mappers ---

const mapPaymentToFrontend = (p) => ({
  id: p.id,
  invoiceId: p.invoice_id,
  paymentDate: p.payment_date ? new Date(p.payment_date).toISOString().split('T')[0] : '',
  transactionNumber: p.transaction_number || '',
  paymentMode: p.payment_mode || '',
  amountPaid: parseFloat(p.amount_received) || 0,
  bankName: p.bank_name || '',
  receivedBy: p.received_by || '',
  document: p.document_url || null,
  notes: p.notes || '',
});


// =====================================================================
// API CALLS
// =====================================================================

export const accountingApi = {

  // --- Quotations ---

  getQuotationsByLead: async (leadId) => {
    const response = await apiClient.get(`/accounting/quotations`, { params: { lead_id: leadId, limit: 100 } });
    const quotations = (response.data?.data || []).map(mapQuotationToFrontend);
    // Assign revision numbers based on parent grouping
    return assignRevisionNumbers(quotations);
  },

  getQuotationById: async (quotationId) => {
    const response = await apiClient.get(`/accounting/quotations/${quotationId}`);
    return mapQuotationToFrontend(response.data?.data);
  },

  createQuotation: async (leadId, frontendData) => {
    const payload = {
      lead_id: leadId,
      quotation_number: frontendData.quotationNumber || frontendData.quotationId,
      quotation_date: frontendData.quotationDate || new Date().toISOString().split('T')[0],
      validity_days: parseInt(frontendData.validity) || 30,
      status: mapFrontendNegotiationToBackendStatus(frontendData.negotiationStatus),
      notes: frontendData.notes || null,
      customer_name: frontendData.customerName || null,
      bill_to: frontendData.billTo || null,
      ship_to: frontendData.shipTo || null,
      payment_terms: frontendData.paymentTerms || null,
      priority: frontendData.priority || null,
      shipping_amount: parseFloat(frontendData.shippingAmount) || 0,
      terms: frontendData.terms || null,
      items: processItemsForBackend(frontendData.items),
    };
    const response = await apiClient.post('/accounting/quotations', payload);
    return mapQuotationToFrontend(response.data?.data);
  },

  updateQuotation: async (quotationId, frontendData) => {
    const payload = {
      validity_days: parseInt(frontendData.validity) || undefined,
      status: frontendData.negotiationStatus
        ? mapFrontendNegotiationToBackendStatus(frontendData.negotiationStatus)
        : undefined,
      notes: frontendData.notes !== undefined ? frontendData.notes : undefined,
      customer_name: frontendData.customerName !== undefined ? frontendData.customerName : undefined,
      bill_to: frontendData.billTo !== undefined ? frontendData.billTo : undefined,
      ship_to: frontendData.shipTo !== undefined ? frontendData.shipTo : undefined,
      payment_terms: frontendData.paymentTerms !== undefined ? frontendData.paymentTerms : undefined,
      priority: frontendData.priority !== undefined ? frontendData.priority : undefined,
      shipping_amount: frontendData.shippingAmount !== undefined ? parseFloat(frontendData.shippingAmount) : undefined,
      terms: frontendData.terms !== undefined ? frontendData.terms : undefined,
      items: frontendData.items ? processItemsForBackend(frontendData.items) : undefined,
    };
    // Remove undefined keys
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const response = await apiClient.put(`/accounting/quotations/${quotationId}`, payload);
    return mapQuotationToFrontend(response.data?.data);
  },

  updateQuotationStatus: async (quotationId, negotiationStatus) => {
    const payload = {
      status: mapFrontendNegotiationToBackendStatus(negotiationStatus),
    };
    const response = await apiClient.put(`/accounting/quotations/${quotationId}`, payload);
    return mapQuotationToFrontend(response.data?.data);
  },

  reviseQuotation: async (quotationId, frontendData) => {
    const payload = {
      quotation_number: frontendData.quotationNumber,
      quotation_date: frontendData.quotationDate || new Date().toISOString().split('T')[0],
      customer_name: frontendData.customerName,
      bill_to: frontendData.billTo,
      ship_to: frontendData.shipTo,
      payment_terms: frontendData.paymentTerms,
      priority: frontendData.priority,
      shipping_amount: frontendData.shippingAmount !== undefined ? parseFloat(frontendData.shippingAmount) : undefined,
      terms: frontendData.terms,
      items: frontendData.items ? processItemsForBackend(frontendData.items) : undefined,
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const response = await apiClient.post(`/accounting/quotations/${quotationId}/revise`, payload);
    return mapQuotationToFrontend(response.data?.data);
  },

  deleteQuotation: async (quotationId) => {
    await apiClient.delete(`/accounting/quotations/${quotationId}`);
  },

  // --- Proformas ---

  getProformasByLead: async (leadId) => {
    const response = await apiClient.get('/accounting/proformas', { params: { lead_id: leadId, limit: 100 } });
    return (response.data?.data || []).map(mapProformaToFrontend);
  },

  getProformaById: async (proformaId) => {
    const response = await apiClient.get(`/accounting/proformas/${proformaId}`);
    return mapProformaToFrontend(response.data?.data);
  },

  createProforma: async (leadId, frontendData) => {
    const payload = {
      lead_id: leadId,
      quotation_id: frontendData.quotationId || null, // the quotation UUID
      proforma_number: frontendData.proformaNumber || frontendData.proformaId,
      proforma_date: frontendData.proformaDate || new Date().toISOString().split('T')[0],
      due_date: frontendData.validUntil || frontendData.dueDate || null,
      status: 'Unpaid',
      notes: frontendData.remarks || frontendData.notes || null,
      items: processItemsForBackend(frontendData.items),
    };
    const response = await apiClient.post('/accounting/proformas', payload);
    return mapProformaToFrontend(response.data?.data);
  },

  updateProformaStatus: async (proformaId, status) => {
    const response = await apiClient.put(`/accounting/proformas/${proformaId}/status`, { status });
    return mapProformaToFrontend(response.data?.data);
  },

  updateProforma: async (proformaId, frontendData) => {
    const payload = {
      proforma_number: frontendData.proformaNumber,
      proforma_date: frontendData.proformaDate,
      due_date: frontendData.dueDate || null,
      status: frontendData.status,
      notes: frontendData.notes || null,
      items: frontendData.items.map(item => ({
        service_name: item.serviceName?.trim() || 'Service/Product',
        description: item.description?.trim() || null,
        hsn_sac: item.hsnSac?.trim() || null,
        quantity: parseFloat(item.qty) || 1,
        unit: item.unit?.trim() || 'Nos',
        rate: parseFloat(item.rate) || 0,
        discount_percentage: parseFloat(item.discount) || 0,
        tax_percentage: parseFloat(item.tax) || 0
      }))
    };
    const response = await apiClient.put(`/accounting/proformas/${proformaId}`, payload);
    return mapProformaToFrontend(response.data?.data);
  },

  deleteProforma: async (proformaId) => {
    await apiClient.delete(`/accounting/proformas/${proformaId}`);
  },

  // --- Invoices ---

  getInvoicesByLead: async (leadId) => {
    const response = await apiClient.get('/accounting/invoices', { params: { lead_id: leadId, limit: 100 } });
    return (response.data?.data || []).map(mapInvoiceToFrontend);
  },

  getInvoiceById: async (invoiceId) => {
    const response = await apiClient.get(`/accounting/invoices/${invoiceId}`);
    return mapInvoiceToFrontend(response.data?.data);
  },

  createInvoice: async (frontendData) => {
    const payload = {
      lead_id: frontendData.leadId,
      proforma_id: frontendData.proformaId || null,
      invoice_number: frontendData.invoiceNumber,
      invoice_date: frontendData.invoiceDate,
      due_date: frontendData.dueDate || null,
      invoice_type: frontendData.invoiceType,
      place_of_supply: frontendData.placeOfSupply || null,
      currency: frontendData.currency,
      status: frontendData.status,
      items: frontendData.items.map(item => ({
        service_name: item.serviceName?.trim() || 'Service/Product',
        description: item.description?.trim() || null,
        hsn_sac: item.hsnSac?.trim() || null,
        quantity: parseFloat(item.qty) || 1,
        unit: item.unit?.trim() || 'Nos',
        rate: parseFloat(item.rate) || 0,
        discount_percentage: parseFloat(item.discount) || 0,
        tax_percentage: parseFloat(item.tax) || 0
      }))
    };

    const response = await apiClient.post('/accounting/invoices', payload);
    return mapInvoiceToFrontend(response.data?.data);
  },

  updateInvoice: async (invoiceId, frontendData) => {
    const payload = {
      invoice_number: frontendData.invoiceNumber,
      invoice_date: frontendData.invoiceDate,
      due_date: frontendData.dueDate || null,
      invoice_type: frontendData.invoiceType,
      place_of_supply: frontendData.placeOfSupply || null,
      currency: frontendData.currency,
      status: frontendData.status,
      items: frontendData.items.map(item => ({
        service_name: item.serviceName?.trim() || 'Service/Product',
        description: item.description?.trim() || null,
        hsn_sac: item.hsnSac?.trim() || null,
        quantity: parseFloat(item.qty) || 1,
        unit: item.unit?.trim() || 'Nos',
        rate: parseFloat(item.rate) || 0,
        discount_percentage: parseFloat(item.discount) || 0,
        tax_percentage: parseFloat(item.tax) || 0
      }))
    };

    const response = await apiClient.put(`/accounting/invoices/${invoiceId}`, payload);
    return mapInvoiceToFrontend(response.data?.data);
  },

  deleteInvoice: async (invoiceId) => {
    await apiClient.delete(`/accounting/invoices/${invoiceId}`);
  },

  // --- Payments ---

  getPaymentsByInvoice: async (invoiceId) => {
    const response = await apiClient.get(`/accounting/invoices/${invoiceId}/payments`);
    return (response.data?.data || []).map(mapPaymentToFrontend);
  },

  recordPayment: async (invoiceId, frontendData) => {
    const payload = {
      payment_date: frontendData.paymentDate || new Date().toISOString().split('T')[0],
      payment_mode: mapPaymentMode(frontendData.paymentMode),
      transaction_number: frontendData.transactionNumber || null,
      amount_received: parseFloat(frontendData.amountPaid) || 0,
      bank_name: frontendData.bankName || null,
      received_by: frontendData.receivedBy || null,
      notes: frontendData.notes || null,
    };
    const response = await apiClient.post(`/accounting/invoices/${invoiceId}/payments`, payload);
    return mapPaymentToFrontend(response.data?.data);
  },

  deletePayment: async (paymentId) => {
    await apiClient.delete(`/accounting/payments/${paymentId}`);
  },

  updatePayment: async (paymentId, frontendData) => {
    const payload = {};
    if (frontendData.paymentDate) payload.payment_date = frontendData.paymentDate;
    if (frontendData.paymentMode) payload.payment_mode = mapPaymentMode(frontendData.paymentMode);
    if (frontendData.transactionNumber !== undefined) payload.transaction_number = frontendData.transactionNumber;
    if (frontendData.amountPaid !== undefined) payload.amount_received = parseFloat(frontendData.amountPaid);
    if (frontendData.bankName !== undefined) payload.bank_name = frontendData.bankName;
    if (frontendData.receivedBy !== undefined) payload.received_by = frontendData.receivedBy;
    if (frontendData.notes !== undefined) payload.notes = frontendData.notes;

    const response = await apiClient.put(`/accounting/payments/${paymentId}`, payload);
    return mapPaymentToFrontend(response.data?.data);
  },

  // --- Document Upload (persists document_url to DB so it survives refresh) ---

  uploadQuotationDocument: async (quotationId, documentUrl) => {
    const response = await apiClient.put(`/accounting/quotations/${quotationId}`, { document_url: documentUrl });
    return mapQuotationToFrontend(response.data?.data);
  },

  uploadProformaDocument: async (proformaId, documentUrl) => {
    const response = await apiClient.put(`/accounting/proformas/${proformaId}`, { document_url: documentUrl });
    return mapProformaToFrontend(response.data?.data);
  },

  uploadInvoiceDocument: async (invoiceId, documentUrl) => {
    const response = await apiClient.put(`/accounting/invoices/${invoiceId}`, { document_url: documentUrl });
    return mapInvoiceToFrontend(response.data?.data);
  },

  uploadPaymentDocument: async (paymentId, documentUrl) => {
    const response = await apiClient.put(`/accounting/payments/${paymentId}`, { document_url: documentUrl });
    return mapPaymentToFrontend(response.data?.data);
  },
};


// =====================================================================
// HELPERS
// =====================================================================

const mapPaymentMode = (mode) => {
  const validModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];
  const modeMap = {
    'Wire Transfer': 'Bank Transfer',
    'wire transfer': 'Bank Transfer',
    'Cheque': 'Cheque',
    'Cash': 'Cash',
    'UPI': 'UPI',
    'Card': 'Card',
    'Bank Transfer': 'Bank Transfer',
  };
  return modeMap[mode] || (validModes.includes(mode) ? mode : 'Bank Transfer');
};

/**
 * Assigns proper revision numbers and labels to quotations based on parent grouping.
 * This ensures the UI displays the correct revision hierarchy.
 */
const assignRevisionNumbers = (quotations) => {
  // Group by parent
  const parents = quotations.filter(q => q.isParent);
  const children = quotations.filter(q => !q.isParent);

  // Sort children by creation date (quotationDate) for each parent
  const result = [];

  for (const parent of parents) {
    result.push(parent);
    const revisions = children
      .filter(c => c.parentQuotationId === parent.quotationId)
      .sort((a, b) => new Date(a.quotationDate) - new Date(b.quotationDate));

    revisions.forEach((rev, idx) => {
      rev.revisionNumber = idx + 1;
      rev.revisionLabel = `Rev ${idx + 1}`;
      result.push(rev);
    });
  }

  // Also include orphan children (whose parent might not be in the current page)
  const assignedIds = new Set(result.map(r => r.quotationId));
  for (const child of children) {
    if (!assignedIds.has(child.quotationId)) {
      result.push(child);
    }
  }

  return result;
};

export default accountingApi;
