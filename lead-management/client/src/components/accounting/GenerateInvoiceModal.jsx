import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Search, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportToPDF } from '../../utils/pdfExport';
import { TaxInvoicePrintTemplate } from './TaxInvoicePrintTemplate';
import { accountingApi } from '../../services/api/accountingApi';

export function GenerateInvoiceModal({ onClose, onSave, initialData, availableProformas = [], existingInvoices = [], documentBranch }) {
  const documentRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const isEditing = !!initialData;
  const [selectedProforma, setSelectedProforma] = useState(isEditing ? { id: initialData.refNo || '' } : null);
  
  // State for the proforma selection dropdown
  const [selectedProformaId, setSelectedProformaId] = useState('');

  const [invoiceId, setInvoiceId] = useState(isEditing ? initialData.invoiceId : `INV-2026-${Math.floor(Math.random() * 10000)}`);
  const [invoiceNumber, setInvoiceNumber] = useState(isEditing ? initialData.invoiceNumber : '');
  
  const [services, setServices] = useState(isEditing && initialData.items ? initialData.items : [
    { id: '1', service: '', desc: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, tax: 18 }
  ]);

  const [totals, setTotals] = useState(isEditing && initialData.totals ? initialData.totals : {
    subtotal: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, roundOff: 0, grandTotal: 0
  });

  const [customerName, setCustomerName] = useState(isEditing ? initialData.customerName : '');
  const [amountPaid, setAmountPaid] = useState(isEditing ? (initialData.amountPaid || 0) : 0);
  const [status, setStatus] = useState(isEditing ? initialData.status : 'Pending');
  const [showError, setShowError] = useState(false);

  const [globalDiscountAmt, setGlobalDiscountAmt] = useState(isEditing && initialData.totals?.discount ? initialData.totals.discount : 0);
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [placeOfSupply, setPlaceOfSupply] = useState(isEditing ? (initialData.placeOfSupply || 'Local') : 'Local');
  const [invoiceType, setInvoiceType] = useState(isEditing ? (initialData.invoiceType || 'GST Invoice') : 'GST Invoice');
  const [currency, setCurrency] = useState(isEditing ? (initialData.currency || 'INR (₹)') : 'INR (₹)');
  const [dueDate, setDueDate] = useState(isEditing ? (initialData.dueDate || '') : '');
  const [invoiceDate, setInvoiceDate] = useState(isEditing ? (initialData.invoiceDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);

  const [advanceRequired, setAdvanceRequired] = useState(isEditing ? (initialData.advanceRequired || false) : false);
  const [advancePercentage, setAdvancePercentage] = useState(isEditing ? (initialData.advancePercentage || 0) : 0);
  const [advanceAmount, setAdvanceAmount] = useState(isEditing ? (initialData.advanceAmount || 0) : 0);
  const [advancePaymentReceived, setAdvancePaymentReceived] = useState(isEditing ? (initialData.advancePaymentReceived || false) : false);

  const [paymentMode, setPaymentMode] = useState(isEditing ? (initialData.paymentMode || 'Cash') : 'Cash');
  const [transactionNumber, setTransactionNumber] = useState(isEditing ? (initialData.transactionNumber || '') : '');
  const [bankName, setBankName] = useState(isEditing ? (initialData.bankName || '') : '');
  const [chequeNumber, setChequeNumber] = useState(isEditing ? (initialData.chequeNumber || '') : '');
  const [receivedBy, setReceivedBy] = useState(isEditing ? (initialData.receivedBy || '') : '');
  const [paymentDate, setPaymentDate] = useState(isEditing ? (initialData.paymentDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);
  
  const [notes, setNotes] = useState(isEditing ? (initialData.notes || '') : '');
  const [billingAddress, setBillingAddress] = useState(isEditing ? (initialData.billingAddress || '') : '');
  const [shippingAddress, setShippingAddress] = useState(isEditing ? (initialData.shippingAddress || '') : '');

  useEffect(() => {
    if (!isEditing) {
      setInvoiceNumber(invoiceId);
    }
  }, [isEditing, invoiceId]);

  // When proforma is fetched, populate fields
  const handleFetchProforma = async () => {
    if (!selectedProformaId) return;

    try {
      const sourceProforma = await accountingApi.getProformaById(selectedProformaId);
      if (sourceProforma) {
        setSelectedProforma({ 
          id: sourceProforma.proformaNumber,
          uuid: sourceProforma.proformaId
        });
        setCustomerName(sourceProforma.customerName || '');
        if (sourceProforma.items && sourceProforma.items.length > 0) {
          setServices(sourceProforma.items);
        }
        if (sourceProforma.totals) {
          setTotals(sourceProforma.totals);
        }
        
        setBillingAddress(sourceProforma.billTo || sourceProforma.companyAddress || '');
        setDueDate(sourceProforma.dueDate || '');
        setNotes(sourceProforma.notes || '');
        
        setAdvanceRequired(sourceProforma.advanceRequired || false);
        setAdvancePercentage(sourceProforma.advancePercentage || 0);

        // Calculate already-paid amount from existing invoices linked to this proforma
        // inv.refNo stores the proforma UUID (from proforma_id column), so match against proformaId
        const alreadyPaidFromLinkedInvoices = existingInvoices
          .filter(inv => inv.refNo === sourceProforma.proformaId)
          .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        if (alreadyPaidFromLinkedInvoices > 0) {
          setAdvanceAmount(alreadyPaidFromLinkedInvoices);
          setAdvancePaymentReceived(true);
        } else {
          setAdvanceAmount(sourceProforma.advanceAmount || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch full proforma details", error);
      alert("Failed to fetch proforma details.");
    }
  };

  useEffect(() => {
    let sub = 0;
    let taxAmt = 0;
    
    services.forEach(s => {
      const q = parseFloat(s.qty) || 0;
      const r = parseFloat(s.rate) || 0;
      const tPct = parseFloat(s.tax) || 0;
      
      const lineTotal = q * r;
      const lineTax = lineTotal * (tPct / 100);
      
      sub += lineTotal;
      taxAmt += lineTax;
    });

    const disc = parseFloat(globalDiscountAmt) || 0;
    const taxable = sub - disc;
    const cgst = taxAmt / 2;
    const sgst = taxAmt / 2;
    const grand = taxable + taxAmt;
    
    setTotals({
      subtotal: sub,
      discount: disc,
      taxable: taxable,
      cgst: cgst,
      sgst: sgst,
      igst: 0,
      roundOff: 0,
      grandTotal: grand
    });
  }, [services, globalDiscountAmt]);

  const addService = () => {
    setServices([...services, { id: Date.now().toString(), service: '', desc: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, tax: 18 }]);
  };

  const updateService = (id, field, value) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeService = (id) => {
    if(services.length > 1) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const actualAdvancePaid = advancePaymentReceived ? (parseFloat(advanceAmount) || 0) : 0;
  const remainingBeforePayment = totals.grandTotal - actualAdvancePaid;
  const currentPayment = parseFloat(amountPaid) || 0;
  const balanceDue = remainingBeforePayment - currentPayment;

  const determineStatus = () => {
    if (balanceDue <= 0 && totals.grandTotal > 0) return 'Paid';
    if (balanceDue < totals.grandTotal) return 'Partially Paid';
    return 'Pending';
  };

  const handleSave = () => {
    if (!customerName) {
      setShowError(true);
      return;
    }
    
    const invoiceData = {
      invoiceId,
      invoiceNumber,
      customerName,
      status: determineStatus(),
      baseAmount: totals.taxable,
      taxAmount: totals.cgst + totals.sgst,
      totalAmount: totals.grandTotal,
      amountPaid: currentPayment + actualAdvancePaid,
      balanceDue,
      items: services,
      totals,
      refNo: selectedProforma ? selectedProforma.id : '',
      proformaId: selectedProforma ? selectedProforma.uuid : null,
      placeOfSupply,
      invoiceType,
      currency,
      invoiceDate,
      dueDate,
      advanceRequired,
      advancePercentage,
      advanceAmount,
      advancePaymentReceived,
      paymentMode,
      transactionNumber,
      bankName,
      chequeNumber,
      receivedBy,
      paymentDate,
      notes,
      billingAddress,
      shippingAddress,
      logoBase64
    };

    if (onSave) {
      onSave(invoiceData);
    }
    onClose();
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    try {
      setIsExporting(true);
      const filename = `Invoice_${invoiceNumber || 'Document'}.pdf`;
      await exportToPDF(documentRef.current, filename);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm font-sans p-4">
      
      <div className="w-[95vw] h-[95vh] relative flex flex-col overflow-hidden">
        
        {/* Source Proforma Section - Only shown before fetching and not editing */}
        {!selectedProforma && !isEditing && (
          <div className="w-full h-full flex flex-col justify-center items-center">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl border border-gray-200 relative">
              <button 
                onClick={onClose} 
                aria-label="Close" 
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-50"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Generate Tax Invoice
              </h3>
              <p className="text-slate-500 mb-8 text-sm">Select a generated Proforma Invoice to automatically populate the invoice details.</p>
              
              <div className="w-full">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Link to Proforma Invoice</label>
                
                {availableProformas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-lg">
                    <p className="text-slate-600 font-semibold mb-1">No Proforma Invoices Available</p>
                    <p className="text-slate-500 text-sm">Generate a Proforma Invoice before creating a Tax Invoice.</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <select 
                        value={selectedProformaId}
                        onChange={(e) => setSelectedProformaId(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#108A63]"
                      >
                        <option value="">Search Proforma Invoices...</option>
                        {availableProformas.map(p => (
                          <option key={p.proformaId} value={p.proformaId}>
                            {p.proformaNumber} - {p.customerName} - {formatCurrency(p.totals?.grandTotal || p.totalAmount)} - {p.proformaDate}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleFetchProforma}
                      disabled={!selectedProformaId}
                      className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-colors shadow-md whitespace-nowrap ${
                        selectedProformaId 
                          ? 'bg-[#108A63] text-white hover:bg-emerald-700' 
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      Fetch Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Document (A4 style) - Only shown AFTER fetching or editing */}
        {(selectedProforma || isEditing) && (
          <div className="bg-white rounded-md shadow-2xl w-full h-full border border-gray-200 flex flex-col overflow-hidden relative">
            <button 
              onClick={onClose} 
              aria-label="Close" 
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12">
              
              {/* Hidden PDF Template */}
              <div className="absolute top-[-9999px] left-[-9999px]">
                <TaxInvoicePrintTemplate 
                  ref={documentRef}
                  data={{
                    invoiceNumber,
                    refNo: selectedProforma ? selectedProforma.id : '',
                    customerName,
                    invoiceDate,
                    dueDate,
                    placeOfSupply,
                    invoiceType,
                    currency,
                    billingAddress,
                    shippingAddress,
                    items: services,
                    totals,
                    advanceRequired,
                    advancePercentage,
                    advanceAmount,
                    advancePaymentReceived,
                    amountPaid: currentPayment,
                    balanceDue,
                    status: determineStatus(),
                    paymentMode,
                    transactionNumber,
                    bankName,
                    chequeNumber,
                    paymentDate,
                    receivedBy,
                    notes,
                  }}
                />
              </div>

              {/* Form Area */}
              <div className="bg-white text-slate-800 p-2 sm:p-4 relative">

              {/* Top Section */}
              <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                
                {/* Left Side */}
                <div className="w-full md:flex-1 space-y-6">
                  {/* Logo Area */}
                  <label className="w-full sm:w-[200px] h-[120px] bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Logo" className="object-contain w-full h-full p-2" />
                    ) : (
                      <div className="flex items-center">
                        <Plus className="w-4 h-4 mr-1 text-slate-400" />
                        <span className="text-sm font-medium">Add Your Logo</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>

                  {/* Customer Input */}
                  <div className="w-full">
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Who is this from? / Customer Name" 
                      className={`w-full p-2 border ${showError && !customerName ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded outline-none focus:border-blue-500 text-sm`}
                    />
                    {showError && !customerName && <p className="text-xs text-red-500 mt-1">Required field</p>}
                  </div>

                  {/* Bill To & Ship To */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <div className="flex-1 w-full">
                      <label className="text-sm text-slate-600 block mb-1">Bill To</label>
                      <textarea rows="3" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Billing Address..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-sm text-slate-600 block mb-1">Ship To</label>
                      <textarea rows="3" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="(optional)" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="w-full md:flex-1 flex flex-col items-start md:items-end">
                  <h1 className="text-4xl font-bold text-[#0F172A] tracking-wide mb-6">INVOICE</h1>
                  
                  <div className="flex items-center mb-6 w-full">
                    <div className="bg-slate-50 border border-r-0 border-slate-300 rounded-l px-3 py-1.5 text-slate-500 font-medium">
                      #
                    </div>
                    <input type="text" value={invoiceNumber} readOnly className="w-full p-1.5 border border-slate-300 rounded-r outline-none md:text-right font-medium text-sm text-slate-700 bg-white" />
                  </div>

                  <div className="w-full space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                      <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Invoice Date</label>
                      <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                      <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Due Date</label>
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                      <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Reference No</label>
                      <input type="text" value={selectedProforma ? selectedProforma.id : ''} onChange={(e) => setSelectedProforma({ id: e.target.value })} placeholder="e.g. PO-9921" className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                      <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Place of Supply</label>
                      <select value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                        <option value="Local">Local</option>
                        <option value="Inter-State">Inter-State</option>
                        <option value="Export">Export</option>
                      </select>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                      <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Invoice Type</label>
                      <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                        <option value="GST Invoice">GST Invoice</option>
                        <option value="Export Invoice">Export Invoice</option>
                        <option value="SEZ Invoice">SEZ Invoice</option>
                      </select>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                      <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Currency</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                        <option value="INR (₹)">INR (₹)</option>
                        <option value="INR (₹)">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="mb-8 overflow-x-auto w-full">
                <table className="w-full min-w-[800px] border-collapse mb-3">
                  <thead>
                    <tr className="bg-[#1E2530] text-white">
                      <th className="py-2 px-3 text-left font-semibold text-sm rounded-tl-sm w-1/3">Item</th>
                      <th className="py-2 px-2 text-center font-semibold text-sm">Rate/item</th>
                      <th className="py-2 px-2 text-center font-semibold text-sm">qty(quantity)</th>
                      <th className="py-2 px-2 text-center font-semibold text-sm">Tax %</th>
                      <th className="py-2 px-3 text-right font-semibold text-sm rounded-tr-sm">Amount</th>
                      <th className="py-2 px-1 bg-white"></th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {services.map((s, index) => {
                      const amount = (s.qty * s.rate) * (1 + (s.tax||0)/100);
                      return (
                        <tr key={s.id} className="group border-b border-slate-100">
                          <td className="py-2 pr-2">
                            <input type="text" value={s.service} onChange={e => updateService(s.id, 'service', e.target.value)} placeholder="Description of service..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm mb-1 bg-white" />
                            <input type="text" value={s.desc} onChange={e => updateService(s.id, 'desc', e.target.value)} placeholder="Additional details..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-xs bg-white italic text-slate-600" />
                          </td>
                          <td className="py-2 px-1 relative">
                            <div className="absolute inset-y-2 left-2 flex items-center text-slate-400 pointer-events-none text-sm">₹</div>
                            <input type="number" value={s.rate} onChange={e => updateService(s.id, 'rate', e.target.value)} className="w-full p-2 pl-6 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" min="1" value={s.qty} onChange={e => updateService(s.id, 'qty', e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" value={s.discount} onChange={e => updateService(s.id, 'discount', e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                          </td>
                          <td className="py-2 px-1 relative">
                            <input type="text" value={formatCurrency(amount)} readOnly className="w-full p-2 border-0 bg-transparent text-sm text-right font-medium text-slate-800" />
                          </td>
                          <td className="py-2 pl-2 flex items-center justify-center pt-4">
                            <button onClick={() => removeService(s.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <button onClick={addService} className="flex items-center text-[#108A63] border border-[#108A63] bg-white hover:bg-emerald-50 px-3 py-1.5 rounded font-medium text-sm transition-colors shadow-sm mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Line Item
                </button>
              </div>

              {/* Footer Calculation & Notes Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start pt-4 gap-8 w-full">
                
                <div className="w-full lg:flex-1 space-y-6">
                  <div>
                    <label className="text-sm text-slate-600 block mb-1">Notes</label>
                    <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant notes..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                  </div>

                  {/* Advance Payment Section */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm flex justify-between items-center">
                      Advance Payment
                      {advanceRequired && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{advancePercentage}% Required</span>}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Advance Amount Required:</span>
                        <span className="font-medium text-slate-800">{formatCurrency(advanceAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3">
                        <span className="font-medium text-slate-700">Advance Payment Received?</span>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input type="radio" checked={advancePaymentReceived} onChange={() => setAdvancePaymentReceived(true)} className="text-blue-600" />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input type="radio" checked={!advancePaymentReceived} onChange={() => setAdvancePaymentReceived(false)} className="text-blue-600" />
                            <span>No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div className="bg-white p-4 rounded border border-emerald-200">
                    <h4 className="font-bold text-emerald-800 mb-3 text-sm">Payment Details</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Payment Mode</label>
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white">
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Payment Date</label>
                        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white" />
                      </div>
                    </div>
                    
                    {(paymentMode === 'Bank Transfer' || paymentMode === 'UPI' || paymentMode === 'Card') && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Transaction / UTR No.</label>
                          <input type="text" value={transactionNumber} onChange={(e) => setTransactionNumber(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Bank Name</label>
                          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white" />
                        </div>
                      </div>
                    )}
                    
                    {paymentMode === 'Cheque' && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Cheque Number</label>
                          <input type="text" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Bank Name</label>
                          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-slate-600 block mb-1">Received By</label>
                      <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-xs bg-white" />
                    </div>
                  </div>
                </div>

                {/* Calculations */}
                <div className="w-full lg:flex-1 space-y-3">
                  <div className="flex justify-between items-center text-sm w-full">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {showGlobalDiscount || globalDiscountAmt > 0 ? (
                    <div className="flex justify-between items-center text-sm w-full">
                      <span className="text-slate-600">Discount</span>
                      <div className="flex items-center w-full sm:w-32 border border-slate-300 rounded bg-white p-1">
                        <span className="text-slate-400 pl-1">₹</span>
                        <input type="number" value={globalDiscountAmt} onChange={(e) => setGlobalDiscountAmt(e.target.value)} className="w-full outline-none text-right text-slate-800 pr-1" />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <button onClick={() => setShowGlobalDiscount(true)} className="text-[#108A63] text-sm font-medium flex items-center hover:underline">
                        <Plus className="w-4 h-4 mr-1" /> Discount
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm w-full pt-1 border-t border-slate-100">
                    <span className="text-slate-600">Taxable Amount</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totals.taxable)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm w-full">
                    <span className="text-slate-600">CGST</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm w-full">
                    <span className="text-slate-600">SGST</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totals.sgst)}</span>
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 pb-2 w-full">
                    <span className="font-bold text-slate-800">Invoice Total</span>
                    <span className="font-bold text-slate-800">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                  
                  {/* Advance Paid */}
                  <div className="flex justify-between items-center text-sm w-full">
                    <span className="text-slate-600">Advance Paid</span>
                    <span className="font-medium text-slate-800">{formatCurrency(actualAdvancePaid)}</span>
                  </div>

                  {/* Remaining Before Payment */}
                  <div className="flex justify-between items-center text-sm w-full">
                    <span className="text-slate-600">Remaining Before Payment</span>
                    <span className="font-medium text-slate-800">{formatCurrency(remainingBeforePayment)}</span>
                  </div>

                  {/* Amount Paid */}
                  <div className="flex justify-between items-center text-sm w-full pt-2 border-t border-slate-100">
                    <span className="font-bold text-emerald-700">Current Payment Amount</span>
                    <div className="flex items-center w-full sm:w-32 border border-emerald-300 rounded bg-emerald-50 p-1">
                      <span className="text-emerald-600 pl-1">₹</span>
                      <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full outline-none text-right text-emerald-800 pr-1 bg-transparent font-bold" />
                    </div>
                  </div>

                  {/* Outstanding Balance */}
                  <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-4 w-full">
                    <span className="font-bold text-red-600">Outstanding Balance</span>
                    <span className="font-bold text-red-600">{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              </div>

              </div> {/* End Printable Area */}

              {/* Action Buttons at the Bottom */}
              <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-4 w-full">
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isExporting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded shadow-sm hover:bg-slate-50 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Download PDF'}
                </button>
                <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded shadow-sm hover:bg-slate-50 transition-colors text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} className="w-full sm:w-auto px-8 py-2.5 bg-[#108A63] text-white font-semibold rounded shadow-md hover:bg-emerald-700 transition-colors text-sm whitespace-nowrap">
                  Save
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
