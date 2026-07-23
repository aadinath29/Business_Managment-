import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Edit2, Trash2, Check, X, Eye } from 'lucide-react';
import { NewQuotationModal } from '../../components/accounting/NewQuotationModal';
import { GenerateInvoiceModal } from '../../components/accounting/GenerateInvoiceModal';
import { GenerateProformaModal } from '../../components/accounting/GenerateProformaModal';
import { accountingApi } from '../../services/api/accountingApi';
import { leadsApi } from '../../services/api/leadsApi';
import { useBranch } from '../../context/BranchContext';

export function AccountingLeadDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Quotations');
  const { branches } = useBranch();
  
  // Lead info
  const [leadInfo, setLeadInfo] = useState(null);

  // States
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [proformas, setProformas] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expandedQuotations, setExpandedQuotations] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isProformaModalOpen, setIsProformaModalOpen] = useState(false);
  
  // Edit & Inline State
  const [editingQuotationData, setEditingQuotationData] = useState(null);
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);
  const [viewOnlyModal, setViewOnlyModal] = useState(false);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineStatusValue, setInlineStatusValue] = useState('');

  const [inlineProformaEditId, setInlineProformaEditId] = useState(null);
  const [inlineProformaStatusValue, setInlineProformaStatusValue] = useState('');

  const [inlinePaymentEditId, setInlinePaymentEditId] = useState(null);
  const [inlinePaymentData, setInlinePaymentData] = useState({});

  const [editingInvoiceData, setEditingInvoiceData] = useState(null);
  const [editingProformaData, setEditingProformaData] = useState(null);

  // Toasts
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // =====================================================================
  // DATA FETCHING
  // =====================================================================

  const fetchAllData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [quotationData, proformaData, invoiceData, leadData] = await Promise.allSettled([
        accountingApi.getQuotationsByLead(id),
        accountingApi.getProformasByLead(id),
        accountingApi.getInvoicesByLead(id),
        leadsApi.getById(id),
      ]);

      if (quotationData.status === 'fulfilled') setQuotations(quotationData.value);
      if (proformaData.status === 'fulfilled') setProformas(proformaData.value);
      if (invoiceData.status === 'fulfilled') setInvoices(invoiceData.value);
      if (leadData.status === 'fulfilled') setLeadInfo(leadData.value);

      // Fetch payments for all invoices
      if (invoiceData.status === 'fulfilled' && invoiceData.value.length > 0) {
        const allPayments = [];
        for (const inv of invoiceData.value) {
          try {
            const invPayments = await accountingApi.getPaymentsByInvoice(inv.invoiceId);
            allPayments.push(...invPayments);
          } catch (e) {
            // skip failed payment fetches
          }
        }
        setPayments(allPayments);
      }
    } catch (err) {
      console.error('Error fetching accounting data:', err);
      showToast('Failed to load accounting data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // --- Automatic Expiry Logic ---
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quotesUpdated = false;
    const newQuotes = quotations.map(q => {
      if (q.negotiationStatus === 'Expired' || !q.validity || !q.quotationDate) return q;
      const days = parseInt(q.validity) || 30;
      const quoteDate = new Date(q.quotationDate);
      quoteDate.setDate(quoteDate.getDate() + days);
      
      if (today > quoteDate) {
        quotesUpdated = true;
        return { ...q, negotiationStatus: 'Expired' };
      }
      return q;
    });

    let proformasUpdated = false;
    const newProformas = proformas.map(p => {
      if (p.status === 'Expired' || !p.validUntil) return p;
      const validDate = new Date(p.validUntil);
      if (today > validDate) {
        proformasUpdated = true;
        return { ...p, status: 'Expired' };
      }
      return p;
    });

    if (quotesUpdated) setQuotations(newQuotes);
    if (proformasUpdated) setProformas(newProformas);
  }, [quotations.length, proformas.length]);

  // --- Dynamic Calculations ---
  const acceptedPipeline = proformas.reduce((sum, p) => {
    if (['Cancelled', 'Rejected', 'Expired'].includes(p.status)) return sum;
    return sum + (p.totals?.grandTotal || p.totalAmount || 0);
  }, 0);

  const outstandingAmount = (() => {
    if (invoices.length === 0) return acceptedPipeline;
    // Group invoices by their linked proforma (refNo = proforma UUID).
    // For each proforma group take only the MIN balanceDue (most-paid invoice)
    // so multiple invoices against the same proforma don't double-count.
    const proformaGroups = {};
    const unlinked = [];
    invoices.forEach(inv => {
      if (inv.refNo) {
        if (!proformaGroups[inv.refNo]) proformaGroups[inv.refNo] = [];
        proformaGroups[inv.refNo].push(inv);
      } else {
        unlinked.push(inv);
      }
    });
    let total = unlinked.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
    Object.values(proformaGroups).forEach(group => {
      const minBalance = Math.min(...group.map(inv => inv.balanceDue || 0));
      total += minBalance;
    });
    return total;
  })();

  // --- Document Upload Handler ---
  // Converts the file to a Base64 data URL and persists it to the DB via the API
  // so the document link survives a page refresh.
  const handleFileUpload = async (e, recordId, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (limit to 5MB to avoid backend 413 Payload Too Large)
    // Base64 encoding adds ~33% overhead, so a 5MB file becomes ~6.6MB, safely under the 10MB limit.
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds 5MB limit. Please upload a smaller document.");
      e.target.value = ''; // Reset input
      return;
    }

    const toBase64 = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

    try {
      const documentUrl = await toBase64(file);

      if (type === 'quotation') {
        await accountingApi.uploadQuotationDocument(recordId, documentUrl);
        setQuotations(prev => prev.map(q => q.quotationId === recordId ? { ...q, document: documentUrl } : q));
      } else if (type === 'proforma') {
        await accountingApi.uploadProformaDocument(recordId, documentUrl);
        setProformas(prev => prev.map(p => p.proformaId === recordId ? { ...p, document: documentUrl } : p));
      } else if (type === 'invoice') {
        await accountingApi.uploadInvoiceDocument(recordId, documentUrl);
        setInvoices(prev => prev.map(i => i.invoiceId === recordId ? { ...i, document: documentUrl } : i));
      } else if (type === 'payment') {
        await accountingApi.uploadPaymentDocument(recordId, documentUrl);
        setPayments(prev => prev.map(p => p.id === recordId ? { ...p, document: documentUrl } : p));
      }
    } catch (err) {
      console.error('Document upload failed:', err);
      alert('Failed to save document. Please try again.');
    }
  };

  // --- Document View Handler ---
  // Safely opens base64 data URLs in a new tab to bypass browser security restrictions
  // on top-level navigation to data URIs (which results in blank pages).
  const handleViewDocument = (base64Url) => {
    if (!base64Url) return;
    
    if (base64Url.startsWith('data:')) {
      try {
        const arr = base64Url.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        
        // Optionally revoke URL after some time to free memory, though for a new tab it's tricky.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch (e) {
        console.error("Error displaying document:", e);
        window.open(base64Url, '_blank'); // Fallback
      }
    } else {
      window.open(base64Url, '_blank');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      // Quotation
      case 'Expired': return 'bg-red-100 text-red-700';
      case 'Pending Review': return 'bg-amber-100 text-amber-700';
      case 'Under Negotiation': return 'bg-blue-100 text-blue-700';
      case 'Approved & Signed': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      
      // Invoice
      case 'Paid': return 'bg-slate-800 text-slate-100';
      case 'Partially Paid': return 'bg-blue-100 text-blue-700';
      case 'Pending': 
      case 'Unpaid': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatCurrencyINR = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  // --- Quotation Handlers ---
  const toggleExpand = (parentId) => {
    setExpandedQuotations(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  const handleOpenNewQuotation = () => {
    setEditingQuotationData(null);
    setIsCreatingRevision(false);
    setViewOnlyModal(false);
    setIsQuotationModalOpen(true);
  };

  const handleEditQuotation = async (quotation) => {
    try {
      const fullQuotation = await accountingApi.getQuotationById(quotation.quotationId);
      setEditingQuotationData(fullQuotation);
      setIsCreatingRevision(false);
      setViewOnlyModal(!quotation.isLatestRevision);
      setIsQuotationModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to load quotation details', 'error');
    }
  };

  const handleCreateRevision = async (quotation) => {
    try {
      const fullQuotation = await accountingApi.getQuotationById(quotation.quotationId);
      
      const parentId = quotation.isParent ? quotation.quotationId : quotation.parentQuotationId;
      const allRevisions = quotations.filter(q => (q.isParent ? q.quotationId : q.parentQuotationId) === parentId);
      
      const maxRevNumber = Math.max(0, ...allRevisions.map(q => q.revisionNumber || 0));
      const nextRevNumber = maxRevNumber + 1;
      
      const parentQuotation = allRevisions.find(q => q.isParent) || quotation;
      const baseNumber = parentQuotation.quotationNumber;
      const newQuotationId = `${baseNumber}-R${nextRevNumber}`;
      
      const newRevisionData = {
        ...fullQuotation,
        quotationId: newQuotationId,
        quotationNumber: newQuotationId,
        parentQuotationId: parentId,
        revisionNumber: nextRevNumber,
        revisionLabel: `Rev ${nextRevNumber}`,
        isParent: false,
        isLatestRevision: true,
        createdFromRevisionId: quotation.quotationId
      };
      
      setEditingQuotationData(newRevisionData);
      setIsCreatingRevision(true);
      setViewOnlyModal(false);
      setIsQuotationModalOpen(true);
      
      // Automatically expand parent so they see the new revision
      setExpandedQuotations(prev => ({ ...prev, [parentId]: true }));
    } catch (err) {
      console.error(err);
      showToast('Failed to load quotation details for revision', 'error');
    }
  };

  const handleSaveQuotation = async (savedData) => {
    try {
      if (isCreatingRevision) {
        // Call backend revise endpoint using the ORIGINAL quotation's backend ID
        const originalQuotation = quotations.find(q => q.quotationId === savedData.createdFromRevisionId);
        if (originalQuotation) {
          await accountingApi.reviseQuotation(originalQuotation.quotationId, savedData);
        }
        showToast(`Revision ${savedData.quotationNumber} created successfully!`);
      } else if (editingQuotationData && !isCreatingRevision) {
        // Update existing quotation
        await accountingApi.updateQuotation(editingQuotationData.quotationId, savedData);
        showToast(`Quotation ${savedData.quotationNumber} updated successfully!`);
      } else {
        // Create new quotation
        await accountingApi.createQuotation(id, savedData);
        showToast(`Quotation ${savedData.quotationNumber} created successfully!`);
      }
      // Re-fetch all data to ensure consistency
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save quotation:', error);
      showToast(error.response?.data?.message || 'Failed to save quotation', 'error');
    }
  };

  const handleDeleteQuotation = async (quotation) => {
    if (!quotation.isLatestRevision) return; // safety
    
    if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      try {
        await accountingApi.deleteQuotation(quotation.quotationId);
        showToast('Quotation deleted successfully!');
        await fetchAllData();
      } catch (error) {
        console.error('Failed to delete quotation:', error);
        showToast(error.response?.data?.message || 'Failed to delete quotation', 'error');
      }
    }
  };

  const handleInlineEditStart = (quotation) => {
    setInlineEditId(quotation.quotationId);
    setInlineStatusValue(quotation.negotiationStatus);
  };

  const handleInlineEditSave = async (quotationId) => {
    try {
      await accountingApi.updateQuotationStatus(quotationId, inlineStatusValue);
      setQuotations(prev => prev.map(q => 
        q.quotationId === quotationId ? { ...q, negotiationStatus: inlineStatusValue } : q
      ));
      setInlineEditId(null);
      showToast('Negotiation status updated successfully!');
    } catch (error) {
      console.error('Failed to update quotation status:', error);
      showToast('Failed to update status', 'error');
      setInlineEditId(null);
    }
  };

  const handleInlineEditCancel = () => {
    setInlineEditId(null);
  };

  // --- Invoice Handlers ---
  const handleOpenNewInvoice = () => {
    setEditingInvoiceData(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceData(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoiceData) {
        await accountingApi.updateInvoice(editingInvoiceData.invoiceId, invoiceData);
        showToast('Invoice updated successfully!');
      } else {
        const createdInvoice = await accountingApi.createInvoice({ ...invoiceData, leadId: id });
        
        if (parseFloat(invoiceData.amountPaid) > 0) {
          await accountingApi.recordPayment(createdInvoice.invoiceId, {
            paymentDate: invoiceData.paymentDate,
            paymentMode: invoiceData.paymentMode || 'Bank Transfer',
            transactionNumber: invoiceData.transactionNumber || invoiceData.chequeNumber,
            amountPaid: invoiceData.amountPaid,
            bankName: invoiceData.bankName,
            receivedBy: invoiceData.receivedBy,
            notes: 'Initial Payment / Advance'
          });
        }
        
        showToast('Invoice generated successfully!');
      }
      setIsInvoiceModalOpen(false);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      showToast(error.response?.data?.message || 'Failed to save invoice', 'error');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await accountingApi.deleteInvoice(invoiceId);
        showToast('Invoice deleted successfully!');
        await fetchAllData();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        showToast(error.response?.data?.message || 'Failed to delete invoice', 'error');
      }
    }
  };

  // --- Proforma Handlers ---
  const handleOpenNewProforma = () => {
    setEditingProformaData(null);
    setIsProformaModalOpen(true);
  };

  const handleInlineProformaEditStart = (proforma) => {
    setInlineProformaEditId(proforma.proformaId);
    setInlineProformaStatusValue(proforma.status || 'Unpaid');
  };

  const handleInlineProformaEditSave = async (proformaId) => {
    try {
      await accountingApi.updateProformaStatus(proformaId, inlineProformaStatusValue);
      setProformas(prev => prev.map(p => 
        p.proformaId === proformaId ? { ...p, status: inlineProformaStatusValue } : p
      ));
      setInlineProformaEditId(null);
      showToast('Proforma status updated successfully!');
    } catch (error) {
      console.error('Failed to update proforma status:', error);
      showToast('Failed to update proforma status', 'error');
      setInlineProformaEditId(null);
    }
  };

  const handleInlineProformaEditCancel = () => {
    setInlineProformaEditId(null);
  };

  const handleInlinePaymentEditStart = (payment) => {
    setInlinePaymentEditId(payment.id);
    setInlinePaymentData({
      paymentDate: payment.paymentDate,
      transactionNumber: payment.transactionNumber || '',
      paymentMode: payment.paymentMode,
      amountPaid: payment.amountPaid
    });
  };

  const handleInlinePaymentEditSave = async (paymentId) => {
    try {
      await accountingApi.updatePayment(paymentId, inlinePaymentData);
      showToast('Payment updated successfully!');
      setInlinePaymentEditId(null);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to update payment:', error);
      showToast(error.response?.data?.message || 'Failed to update payment', 'error');
    }
  };

  const handleInlinePaymentEditCancel = () => {
    setInlinePaymentEditId(null);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        await accountingApi.deletePayment(paymentId);
        showToast('Payment deleted successfully!');
        await fetchAllData();
      } catch (error) {
        console.error('Failed to delete payment:', error);
        showToast(error.response?.data?.message || 'Failed to delete payment', 'error');
      }
    }
  };

  const handleEditProforma = (proforma) => {
    setEditingProformaData(proforma);
    setIsProformaModalOpen(true);
  };

  const handleSaveProforma = async (proformaData) => {
    try {
      if (editingProformaData) {
        await accountingApi.updateProforma(editingProformaData.proformaId, proformaData);
        showToast('Proforma updated successfully!');
      } else {
        await accountingApi.createProforma(id, proformaData);
        showToast('Proforma generated successfully!');
      }
      setIsProformaModalOpen(false);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save proforma:', error);
      showToast(error.response?.data?.message || 'Failed to save proforma', 'error');
    }
  };

  const handleDeleteProforma = async (proformaId) => {
    if (window.confirm('Are you sure you want to delete this Proforma Invoice? This action cannot be undone.')) {
      try {
        await accountingApi.deleteProforma(proformaId);
        showToast('Proforma Invoice deleted successfully!');
        await fetchAllData();
      } catch (error) {
        console.error('Failed to delete proforma:', error);
        showToast(error.response?.data?.message || 'Failed to delete proforma', 'error');
      }
    }
  };

  // Lead display info
  const leadName = leadInfo?.company_name || leadInfo?.name || 'Lead';
  const leadStatus = leadInfo?.status || 'Active';
  const documentBranch = branches?.find(b => b.id === leadInfo?.branch_id) || null;

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-8 px-6 pb-20 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-medium">Loading accounting data...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-8 px-6 pb-20 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 px-6 py-3 rounded shadow-lg z-[9999] text-white flex items-center font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} transition-opacity duration-300`}>
          <Check className="w-5 h-5 mr-2" />
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* Top Header Card */}
        <Card className="bg-white border border-slate-200 mb-8 rounded-lg shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold flex items-center text-slate-900 tracking-tight">
                {leadName}
                <span className="ml-4 text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full">
                  {leadStatus}
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-3 font-medium">
                Lead ID: L-{id || '0000'}
              </p>
            </div>
            <div className="flex items-center space-x-12">
              <div className="text-right">
                <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">Accepted Pipeline</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrencyINR(acceptedPipeline)}</p>
              </div>
              <div className="text-right border-l border-slate-200 pl-12">
                <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrencyINR(outstandingAmount)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Horizontal Tabs */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="flex space-x-8">
            {['Quotations', 'Proforma Invoices', 'Tax Invoices & Payments'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 pt-1 font-bold text-sm transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                style={{ marginBottom: '-1px' }}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'Quotations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-slate-800">Issued Quotations</h2>
              <button
                onClick={handleOpenNewQuotation}
                className="inline-flex items-center px-6 py-2.5 bg-black text-white text-sm font-semibold rounded hover:bg-slate-800 transition-colors"
              >
                New Quotation
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Quote #</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Date</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/4">Negotiation Status</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Amount</th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-slate-600 w-32">Document</th>
                      <th className="px-6 py-5 text-right text-xs font-bold text-slate-600 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {quotations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-sm">
                          No quotations found. Create a new quotation to get started.
                        </td>
                      </tr>
                    ) : (
                      quotations.filter(q => q.isParent).map(parent => {
                        const isExpanded = expandedQuotations[parent.quotationId];
                        const revisions = quotations.filter(q => q.parentQuotationId === parent.quotationId && !q.isParent).sort((a,b) => a.revisionNumber - b.revisionNumber);
                        const hasRevisions = revisions.length > 0;
                        const latestRecord = hasRevisions ? revisions[revisions.length - 1] : parent;
                        
                        return (
                          <React.Fragment key={parent.quotationId}>
                            {/* Parent Row */}
                            <tr className="hover:bg-slate-50/50 transition-colors bg-white">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 border-b border-slate-100/50">
                                <div className="flex items-center">
                                  <button 
                                    onClick={() => toggleExpand(parent.quotationId)}
                                    className="mr-3 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors focus:outline-none"
                                  >
                                    <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                  </button>
                                  {parent.quotationNumber}
                                  {hasRevisions && !isExpanded && (
                                    <span className="ml-2 text-[10px] font-semibold tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                                      Latest: {latestRecord.revisionLabel}
                                    </span>
                                  )}
                                  {proformas.some(p => p.refNo === latestRecord.quotationNumber) && (
                                    <span className="ml-2 text-[10px] font-bold tracking-wide text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full uppercase shadow-sm">
                                      Converted to Proforma
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-b border-slate-100/50">
                                {latestRecord.quotationDate}
                              </td>
                              <td 
                                className="px-6 py-4 whitespace-nowrap border-b border-slate-100/50 cursor-pointer"
                                onDoubleClick={() => handleInlineEditStart(latestRecord)}
                                title="Double-click to edit status"
                              >
                                {inlineEditId === latestRecord.quotationId ? (
                                  <div className="flex items-center space-x-2">
                                    <select
                                      autoFocus
                                      value={inlineStatusValue}
                                      onChange={(e) => setInlineStatusValue(e.target.value)}
                                      className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white shadow-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleInlineEditSave(latestRecord.quotationId);
                                        if (e.key === 'Escape') handleInlineEditCancel();
                                      }}
                                      onBlur={() => handleInlineEditSave(latestRecord.quotationId)}
                                    >
                                      <option value="Pending Review">Pending Review</option>
                                      <option value="Under Negotiation">Under Negotiation</option>
                                      <option value="Approved & Signed">Approved & Signed</option>
                                      <option value="Rejected">Rejected</option>
                                      <option value="Expired">Expired</option>
                                    </select>
                                  </div>
                                ) : (
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${getStatusBadgeColor(latestRecord.negotiationStatus)}`}>
                                    {latestRecord.negotiationStatus}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 border-b border-slate-100/50">
                                {formatCurrencyINR(latestRecord.totals?.grandTotal || latestRecord.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center border-b border-slate-100/50">
                                {latestRecord.document ? (
                                  <button onClick={() => handleViewDocument(latestRecord.document)} className="text-blue-600 hover:underline text-xs font-medium flex items-center justify-center">
                                    📄 View
                                  </button>
                                ) : (
                                  <label className="text-[#108A63] hover:underline cursor-pointer text-xs font-medium flex items-center justify-center">
                                    ⬆ Upload
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, latestRecord.quotationId, 'quotation')} />
                                  </label>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right border-b border-slate-100/50">
                                {!isExpanded && (
                                  <div className="flex items-center justify-end space-x-3">
                                    <button 
                                      onClick={() => handleCreateRevision(latestRecord)}
                                      disabled={proformas.some(p => p.refNo === parent.quotationNumber)}
                                      className={`px-1 font-bold text-lg transition-colors ${proformas.some(p => p.refNo === parent.quotationNumber) ? 'text-slate-300 cursor-not-allowed' : 'text-[#108A63] hover:text-emerald-700'}`}
                                      title={proformas.some(p => p.refNo === parent.quotationNumber) ? "Locked: Converted to Proforma" : "Create New Revision"}
                                    >
                                      +
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (proformas.some(p => p.refNo === parent.quotationNumber)) {
                                          setEditingQuotationData(latestRecord);
                                          setIsCreatingRevision(false);
                                          setViewOnlyModal(true);
                                          setIsQuotationModalOpen(true);
                                        } else {
                                          handleEditQuotation(latestRecord);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-blue-600 transition-colors px-1"
                                      title={proformas.some(p => p.refNo === parent.quotationNumber) ? "View Quotation (Read Only)" : "Edit Quotation"}
                                    >
                                        {proformas.some(p => p.refNo === parent.quotationNumber) ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteQuotation(latestRecord)}
                                      disabled={proformas.some(p => p.refNo === parent.quotationNumber)}
                                      className={`px-1 transition-colors ${!proformas.some(p => p.refNo === parent.quotationNumber) ? 'text-slate-400 hover:text-red-600' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
                                      title={proformas.some(p => p.refNo === parent.quotationNumber) ? "Locked" : "Delete Quotation"}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            
                            {/* Revisions only */}
                            {isExpanded && (
                              <>
                                {revisions.map(q => (
                                  <tr key={q.quotationId} className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-700 pl-14">
                                      {q.revisionLabel}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                                      {q.quotationDate}
                                    </td>
                                    <td 
                                      className={`px-6 py-3 whitespace-nowrap ${q.isLatestRevision ? 'cursor-pointer' : 'opacity-75'}`}
                                      onDoubleClick={() => q.isLatestRevision && handleInlineEditStart(q)}
                                      title={q.isLatestRevision ? "Double-click to edit status" : "Status of historical revision"}
                                    >
                                      {inlineEditId === q.quotationId ? (
                                        <div className="flex items-center space-x-2">
                                          <select
                                            autoFocus
                                            value={inlineStatusValue}
                                            onChange={(e) => setInlineStatusValue(e.target.value)}
                                            className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white shadow-sm"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleInlineEditSave(q.quotationId);
                                              if (e.key === 'Escape') handleInlineEditCancel();
                                            }}
                                            onBlur={() => handleInlineEditSave(q.quotationId)}
                                          >
                                            <option value="Pending Review">Pending Review</option>
                                            <option value="Under Negotiation">Under Negotiation</option>
                                            <option value="Approved & Signed">Approved & Signed</option>
                                            <option value="Rejected">Rejected</option>
                                          </select>
                                        </div>
                                      ) : (
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${getStatusBadgeColor(q.negotiationStatus)}`}>
                                          {q.negotiationStatus}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                      {formatCurrencyINR(q.totals?.grandTotal || q.totalAmount)}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                      <div className="flex items-center justify-end space-x-3">
                                        <button 
                                          onClick={() => handleCreateRevision(q)}
                                          disabled={proformas.some(p => p.refNo === parent.quotationNumber)}
                                          className={`px-1 font-bold text-lg transition-colors ${proformas.some(p => p.refNo === parent.quotationNumber) ? 'text-slate-300 cursor-not-allowed' : 'text-[#108A63] hover:text-emerald-700'}`}
                                          title={proformas.some(p => p.refNo === parent.quotationNumber) ? "Locked: Converted to Proforma" : "Create New Revision from this"}
                                        >
                                          +
                                        </button>
                                        <button 
                                          onClick={() => {
                                            if (proformas.some(p => p.refNo === parent.quotationNumber)) {
                                              setEditingQuotationData(q);
                                              setIsCreatingRevision(false);
                                              setViewOnlyModal(true);
                                              setIsQuotationModalOpen(true);
                                            } else {
                                              handleEditQuotation(q);
                                            }
                                          }}
                                          className="text-slate-400 hover:text-blue-600 transition-colors px-1"
                                          title={proformas.some(p => p.refNo === parent.quotationNumber) || !q.isLatestRevision ? "View Quotation (Read Only)" : "Edit Quotation"}
                                        >
                                        {proformas.some(p => p.refNo === parent.quotationNumber) || !q.isLatestRevision ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                      </button>
                                        <button 
                                          onClick={() => q.isLatestRevision ? handleDeleteQuotation(q) : null}
                                          disabled={!q.isLatestRevision || proformas.some(p => p.refNo === parent.quotationNumber)}
                                          className={`px-1 transition-colors ${q.isLatestRevision && !proformas.some(p => p.refNo === parent.quotationNumber) ? 'text-slate-400 hover:text-red-600' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
                                          title={proformas.some(p => p.refNo === parent.quotationNumber) ? "Locked" : q.isLatestRevision ? "Delete Quotation" : "Historical revisions cannot be deleted."}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Proforma Invoices' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-slate-800">Proforma Invoices</h2>
              <button
                onClick={handleOpenNewProforma}
                className="inline-flex items-center px-6 py-2.5 bg-[#108A63] text-white text-sm font-semibold rounded hover:bg-emerald-700 transition-colors"
              >
                Generate Proforma
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Proforma #</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Date</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/5">Ref Quote #</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Amount</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Due Date</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/6">Status</th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-slate-600 w-32">Document</th>
                      <th className="px-6 py-5 text-right text-xs font-bold text-slate-600 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {proformas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-sm">
                          No Proforma Invoices found.
                        </td>
                      </tr>
                    ) : (
                      proformas.map(p => (
                        <tr key={p.proformaId} className="hover:bg-slate-50/50 transition-colors bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 border-b border-slate-100/50">
                            {p.proformaNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-b border-slate-100/50">
                            {p.proformaDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-b border-slate-100/50">
                            {p.refNo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 border-b border-slate-100/50">
                            {formatCurrencyINR(p.totals?.grandTotal || p.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-b border-slate-100/50">
                            {p.dueDate || p.proformaDate}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap border-b border-slate-100/50 cursor-pointer"
                            onDoubleClick={() => handleInlineProformaEditStart(p)}
                            title="Double-click to edit status"
                          >
                            {inlineProformaEditId === p.proformaId ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  autoFocus
                                  value={inlineProformaStatusValue}
                                  onChange={(e) => setInlineProformaStatusValue(e.target.value)}
                                  className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white shadow-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleInlineProformaEditSave(p.proformaId);
                                    if (e.key === 'Escape') handleInlineProformaEditCancel();
                                  }}
                                  onBlur={() => handleInlineProformaEditSave(p.proformaId)}
                                >
                                  <option value="Unpaid">Unpaid</option>
                                  <option value="Partially Paid">Partially Paid</option>
                                  <option value="Paid">Paid</option>
                                </select>
                              </div>
                            ) : (
                              <span className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${getStatusBadgeColor(p.status || 'Unpaid')}`}>
                                {p.status || 'Unpaid'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center border-b border-slate-100/50">
                            {p.document ? (
                              <button onClick={() => handleViewDocument(p.document)} className="text-blue-600 hover:underline text-xs font-medium flex items-center justify-center">
                                📄 View
                              </button>
                            ) : (
                              <label className="text-[#108A63] hover:underline cursor-pointer text-xs font-medium flex items-center justify-center">
                                ⬆ Upload
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, p.proformaId, 'proforma')} />
                              </label>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right border-b border-slate-100/50">
                            <div className="flex items-center justify-end space-x-3">
                              <button 
                                onClick={() => handleEditProforma(p)}
                                className="text-slate-400 hover:text-blue-600 transition-colors px-1"
                                title="Edit Proforma"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProforma(p.proformaId)}
                                className="text-slate-400 hover:text-red-600 transition-colors px-1"
                                title="Delete Proforma"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Tax Invoices & Payments' && (
          <div className="space-y-10">
            
            {/* Tax Invoices Section */}
            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[17px] font-bold text-slate-800">Tax Invoices</h2>
                <button 
                  onClick={handleOpenNewInvoice}
                  className="inline-flex items-center px-5 py-2 bg-black text-white text-[13px] font-semibold rounded hover:bg-slate-800 transition-colors"
                >
                  Generate Invoice
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600">Inv #</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600">Linked Proforma Invoice</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600">Status</th>
                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-600">Amount Paid</th>
                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-600">Outstanding</th>
                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-600">Grand Total</th>
                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-600 w-32">Document</th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-600 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-sm">
                            No invoices found. Generate a new invoice to get started.
                          </td>
                        </tr>
                      ) : (
                        invoices.map(invoice => (
                          <tr key={invoice.invoiceId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5 whitespace-nowrap text-xs font-medium text-slate-700">{invoice.invoiceNumber}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-600">{invoice.refNo || '-'}</td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-xs text-emerald-600 font-medium text-center">{formatCurrencyINR(invoice.amountPaid)}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-xs text-red-600 font-medium text-center">{formatCurrencyINR(invoice.balanceDue)}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-900 font-medium text-center">{formatCurrencyINR(invoice.totalAmount)}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-center border-b border-slate-100/50">
                              {invoice.document ? (
                                <button onClick={() => handleViewDocument(invoice.document)} className="text-blue-600 hover:underline text-xs font-medium flex items-center justify-center">
                                  📄 View
                                </button>
                              ) : (
                                <label className="text-[#108A63] hover:underline cursor-pointer text-xs font-medium flex items-center justify-center">
                                  ⬆ Upload
                                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, invoice.invoiceId, 'invoice')} />
                                </label>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-4">
                                <button 
                                  onClick={() => handleEditInvoice(invoice)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Edit Invoice"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteInvoice(invoice.invoiceId)}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payment Ledger Section */}
            <div>
              <div className="mb-5">
                <h2 className="text-[17px] font-bold text-slate-800">Payment Ledger</h2>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-12">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/5">Date</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/4">Txn ID / Ref</th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 w-1/5">Mode</th>
                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-600 w-32">Document</th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-600 w-1/5">Amount Received</th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-600 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
                            No payment entries found.
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                            {inlinePaymentEditId === payment.id ? (
                              <>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <input type="date" value={inlinePaymentData.paymentDate} onChange={(e) => setInlinePaymentData({...inlinePaymentData, paymentDate: e.target.value})} className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white w-full" />
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <input type="text" value={inlinePaymentData.transactionNumber} onChange={(e) => setInlinePaymentData({...inlinePaymentData, transactionNumber: e.target.value})} className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white w-full" placeholder="Txn ID" />
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <select value={inlinePaymentData.paymentMode} onChange={(e) => setInlinePaymentData({...inlinePaymentData, paymentMode: e.target.value})} className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white w-full">
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                  </select>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-center text-slate-400 text-xs">-</td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <input type="number" value={inlinePaymentData.amountPaid} onChange={(e) => setInlinePaymentData({...inlinePaymentData, amountPaid: e.target.value})} className="text-xs font-medium border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white w-full text-right" />
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button onClick={() => handleInlinePaymentEditSave(payment.id)} className="text-emerald-600 hover:text-emerald-700" title="Save"><Check className="w-4 h-4" /></button>
                                    <button onClick={handleInlinePaymentEditCancel} className="text-red-500 hover:text-red-600" title="Cancel"><X className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-600 font-medium">{payment.paymentDate}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-600">{payment.transactionNumber || '-'}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-600">{payment.paymentMode}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                  {payment.document ? (
                                    <button onClick={() => handleViewDocument(payment.document)} className="text-blue-600 hover:underline text-xs font-medium flex items-center justify-center">
                                      📄 View
                                    </button>
                                  ) : (
                                    <label className="text-[#108A63] hover:underline cursor-pointer text-xs font-medium flex items-center justify-center">
                                      ⬆ Upload
                                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, payment.id, 'payment')} />
                                    </label>
                                  )}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-xs font-medium text-slate-900 text-right">{formatCurrencyINR(payment.amountPaid)}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end space-x-3">
                                    <button 
                                      onClick={() => handleInlinePaymentEditStart(payment)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors px-1"
                                      title="Edit Payment"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePayment(payment.id)}
                                      className="text-slate-400 hover:text-red-600 transition-colors px-1"
                                      title="Delete Payment"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="bg-white px-8 py-8 border-t border-slate-100 flex justify-end items-center space-x-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Outstanding Balance</span>
                    <span className="text-2xl font-semibold text-red-600 tracking-tight">{formatCurrencyINR(outstandingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Modals */}
      {isQuotationModalOpen && (
        <NewQuotationModal 
          onClose={() => setIsQuotationModalOpen(false)} 
          onSave={handleSaveQuotation}
          initialData={editingQuotationData}
          readOnly={viewOnlyModal}
          documentBranch={documentBranch}
        />
      )}

      {isInvoiceModalOpen && (
        <GenerateInvoiceModal 
          onClose={() => setIsInvoiceModalOpen(false)} 
          onSave={handleSaveInvoice}
          initialData={editingInvoiceData}
          availableProformas={proformas}
          existingInvoices={invoices}
          documentBranch={documentBranch}
        />
      )}

      {isProformaModalOpen && (
        <GenerateProformaModal
          onClose={() => setIsProformaModalOpen(false)}
          onSave={handleSaveProforma}
          initialData={editingProformaData}
          availableQuotations={quotations.filter(q => q.negotiationStatus === 'Approved & Signed' && !proformas.some(p => p.refNo === q.quotationNumber))}
          documentBranch={documentBranch}
        />
      )}
    </div>
  );
}
