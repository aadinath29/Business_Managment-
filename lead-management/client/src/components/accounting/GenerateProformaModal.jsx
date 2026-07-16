import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Search, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportToPDF } from '../../utils/pdfExport';
import { ProformaInvoicePrintTemplate } from './ProformaInvoicePrintTemplate';
import { accountingApi } from '../../services/api/accountingApi';

export function GenerateProformaModal({ onClose, onSave, initialData, availableQuotations = [], existingProformas = [] }) {
  const documentRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const isEditing = !!initialData;
  const [selectedQuotation, setSelectedQuotation] = useState(isEditing ? { id: initialData.refNo || '' } : null);

  // State for the quotation selection dropdown
  const [selectedQuotationId, setSelectedQuotationId] = useState('');

  const [proformaId, setProformaId] = useState(isEditing ? initialData.proformaId : `PI-2026-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);
  const [proformaNumber, setProformaNumber] = useState(isEditing ? initialData.proformaNumber : '');

  const [services, setServices] = useState(isEditing && initialData.items ? initialData.items : []);
  const [totals, setTotals] = useState(isEditing && initialData.totals ? initialData.totals : {
    subtotal: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, roundOff: 0, grandTotal: 0
  });

  const [customerName, setCustomerName] = useState(isEditing ? initialData.customerName : '');
  const [billTo, setBillTo] = useState(isEditing && initialData.billTo ? initialData.billTo : '');
  const [shipTo, setShipTo] = useState(isEditing && initialData.shipTo ? initialData.shipTo : '');
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

  // New Proforma-specific fields
  const [proformaDate, setProformaDate] = useState(isEditing ? initialData.proformaDate : new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(isEditing ? initialData.validUntil : '');
  const [paymentTerms, setPaymentTerms] = useState(isEditing ? initialData.paymentTerms : 'Due on Receipt');

  const [advanceRequired, setAdvanceRequired] = useState(isEditing ? initialData.advanceRequired : false);
  const [advancePercentage, setAdvancePercentage] = useState(isEditing ? initialData.advancePercentage : 0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(isEditing ? initialData.expectedDeliveryDate : '');
  const [deliveryTerms, setDeliveryTerms] = useState(isEditing ? initialData.deliveryTerms : 'Custom');

  const [bankDetails, setBankDetails] = useState(isEditing && initialData.bankDetails ? initialData.bankDetails : {
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: ''
  });
  const [remarks, setRemarks] = useState(isEditing ? initialData.remarks : '');

  // Filter approved quotations
  const approvedQuotations = availableQuotations.filter(q => q.negotiationStatus === 'Approved & Signed');
  // Check which are already converted
  const convertedQuotationIds = existingProformas.map(p => p.refNo);

  useEffect(() => {
    if (!isEditing) {
      setProformaNumber(proformaId);
    }
  }, [isEditing, proformaId]);

  // When quotation is fetched, populate fields
  const handleFetchQuotation = async () => {
    if (!selectedQuotationId) return;

    try {
      const sourceQuotation = await accountingApi.getQuotationById(selectedQuotationId);
      if (sourceQuotation) {
        setSelectedQuotation({
          id: sourceQuotation.quotationNumber,
          uuid: sourceQuotation.quotationId
        });
        setCustomerName(sourceQuotation.customerName || '');
        setBillTo(sourceQuotation.billTo || '');
        setShipTo(sourceQuotation.shipTo || '');
        setPaymentTerms(sourceQuotation.paymentTerms || 'Due on Receipt');
        
        if (sourceQuotation.items && sourceQuotation.items.length > 0) {
          setServices(sourceQuotation.items);
        }
        if (sourceQuotation.totals) {
          setTotals(sourceQuotation.totals);
        }
        if (sourceQuotation.notes || sourceQuotation.terms) {
          setRemarks(`${sourceQuotation.notes || ''}\n${sourceQuotation.terms || ''}`.trim());
        }
      }
    } catch (error) {
      console.error("Failed to fetch full quotation details", error);
      alert("Failed to fetch quotation details.");
    }
  };

  const updateService = (id, field, value) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Recalculate totals if services are modified (even though we auto-fetch, they might edit a desc)
  useEffect(() => {
    let sub = 0;
    let taxAmt = 0;

    services.forEach(s => {
      const q = parseFloat(s.qty) || 0;
      const r = parseFloat(s.rate) || 0;
      const tPct = parseFloat(s.tax || 18) || 0;

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

  const advanceAmount = advanceRequired ? (totals.grandTotal * (advancePercentage / 100)) : 0;
  const remainingAmount = totals.grandTotal - advanceAmount;

  const handleSave = () => {
    if (!customerName) {
      setShowError(true);
      return;
    }

    const proformaData = {
      proformaId,
      proformaNumber,
      customerName,
      billTo,
      shipTo,
      status: 'Generated', // Default status
      proformaDate,
      validUntil,
      paymentTerms,
      advanceRequired,
      advancePercentage,
      advanceAmount,
      remainingAmount,
      expectedDeliveryDate,
      deliveryTerms,
      bankDetails,
      remarks,
      baseAmount: totals.taxable,
      taxAmount: totals.cgst + totals.sgst,
      totalAmount: totals.grandTotal,
      dueDate: validUntil,
      customerName: customerName,
      refNo: selectedQuotation ? selectedQuotation.id : '',
      quotationId: selectedQuotation ? selectedQuotation.uuid : null,
      items: services,
      totals,
      logoBase64
    };

    if (onSave) {
      onSave(proformaData);
    }
    onClose();
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    try {
      setIsExporting(true);
      const filename = `${proformaNumber || 'Proforma_Invoice'}.pdf`;
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

        {/* Source Quotation Section */}
        {!selectedQuotation && !isEditing && (
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
                Generate Proforma Invoice
              </h3>
              <p className="text-slate-500 mb-8 text-sm">Select an approved quotation to generate a Proforma Invoice.</p>

              <div className="w-full">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Link to Quotation</label>

                {approvedQuotations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-lg">
                    <p className="text-slate-600 font-semibold mb-1">No Approved & Signed Quotations Available</p>
                    <p className="text-slate-500 text-sm">Approve and sign a quotation before generating a proforma.</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <select
                        value={selectedQuotationId}
                        onChange={(e) => setSelectedQuotationId(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#108A63]"
                      >
                        <option value="">Search Approved Quotations...</option>
                        {approvedQuotations.map(q => {
                          const isConverted = convertedQuotationIds.includes(q.quotationNumber);
                          return (
                            <option key={q.quotationId || q.id} value={q.quotationId || q.id} disabled={isConverted}>
                              {q.quotationNumber} - {q.customerName} - {formatCurrency(q.totals?.grandTotal || q.totalAmount)} - {q.quotationDate} {isConverted ? '(Already Converted)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <button
                      onClick={handleFetchQuotation}
                      disabled={!selectedQuotationId}
                      className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-colors shadow-md whitespace-nowrap ${selectedQuotationId
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

        {/* Main Document (A4 style) */}
        {(selectedQuotation || isEditing) && (
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
                <ProformaInvoicePrintTemplate
                  ref={documentRef}
                  data={{
                    proformaNumber,
                    proformaDate,
                    validUntil,
                    refNo: selectedQuotation ? selectedQuotation.id : '',
                    customerName,
                    billTo,
                    shipTo,
                    paymentTerms,
                    expectedDeliveryDate,
                    deliveryTerms,
                    advanceRequired,
                    advancePercentage,
                    advanceAmount,
                    remainingAmount,
                    bankDetails,
                    items: services,
                    totals,
                    remarks,
                    logoBase64
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
                        <textarea value={billTo} onChange={(e) => setBillTo(e.target.value)} rows="3" placeholder="Billing Address..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-sm text-slate-600 block mb-1">Ship To</label>
                        <textarea value={shipTo} onChange={(e) => setShipTo(e.target.value)} rows="3" placeholder="(optional)" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="w-full md:flex-1 flex flex-col items-start md:items-end">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-wide mb-6">PROFORMA INVOICE</h1>

                    <div className="flex items-center mb-6 w-full sm:max-w-xs">
                      <div className="bg-slate-50 border border-r-0 border-slate-300 rounded-l px-3 py-1.5 text-slate-500 font-medium">
                        #
                      </div>
                      <input type="text" value={proformaNumber} readOnly className="w-full p-1.5 border border-slate-300 rounded-r outline-none md:text-right font-medium text-sm text-slate-700 bg-white" />
                    </div>

                    <div className="w-full space-y-3 sm:max-w-xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                        <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0 whitespace-nowrap">Date</label>
                        <input type="date" value={proformaDate} onChange={(e) => setProformaDate(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white" />
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                        <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0 whitespace-nowrap">Validity</label>
                        <select value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                          <option value="">Select Validity...</option>
                          <option value="5 Days">5 Days</option>
                          <option value="10 Days">10 Days</option>
                          <option value="15 Days">15 Days</option>
                          <option value="20 Days">20 Days</option>
                          <option value="30 Days">30 Days</option>
                          <option value="60 Days">60 Days</option>
                        </select>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                        <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0 whitespace-nowrap">Ref Quotation</label>
                        <input type="text" value={selectedQuotation ? selectedQuotation.id : ''} readOnly className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white text-slate-500" />
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                        <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0 whitespace-nowrap">Payment Terms</label>
                        <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 45">Net 45</option>
                          <option value="Net 60">Net 60</option>
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
                        <th className="py-2 px-2 text-center font-semibold text-sm">qty</th>
                        <th className="py-2 px-2 text-center font-semibold text-sm">Tax %</th>
                        <th className="py-2 px-3 text-right font-semibold text-sm rounded-tr-sm">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {services.map((s) => {
                        const amount = (s.qty * s.rate) * (1 + (s.tax || 0) / 100);
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
                              <input type="number" value={s.tax} onChange={e => updateService(s.id, 'tax', e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                            </td>
                            <td className="py-2 px-1 relative">
                              <input type="text" value={formatCurrency(amount)} readOnly className="w-full p-2 border-0 bg-transparent text-sm text-right font-medium text-slate-800" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Extra Details & Calculations */}
                <div className="flex flex-col lg:flex-row justify-between items-start pt-4 gap-8 w-full mb-12">

                  {/* Delivery & Bank Details */}
                  <div className="w-full lg:flex-1 space-y-6">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-600 block mb-1">Expected Delivery</label>
                        <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white" />
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 block mb-1">Delivery Terms</label>
                        <select value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white">
                          <option value="FOB">FOB</option>
                          <option value="Door Delivery">Door Delivery</option>
                          <option value="Pickup">Pickup</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3">Bank Details</h4>
                      <div className="space-y-3">
                        <div>
                          <input type="text" placeholder="Bank Name" value={bankDetails.bankName} onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white" />
                        </div>
                        <div>
                          <input type="text" placeholder="Account Number" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white" />
                        </div>
                        <div className="flex gap-2">
                          <input type="text" placeholder="IFSC Code" value={bankDetails.ifsc} onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })} className="flex-1 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white" />
                          <input type="text" placeholder="UPI ID" value={bankDetails.upiId} onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })} className="flex-1 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-slate-600 block mb-1">Remarks / Notes</label>
                      <textarea rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any relevant remarks..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="w-full lg:flex-1 space-y-4 bg-slate-50/50 p-4 sm:p-6 rounded-lg border border-slate-100">
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
                    <div className="flex justify-between items-center pt-2 pb-2 w-full border-b border-slate-200">
                      <span className="font-bold text-slate-800">Grand Total</span>
                      <span className="font-bold text-slate-800">{formatCurrency(totals.grandTotal)}</span>
                    </div>

                    {/* Advance Required Toggle */}
                    <div className="flex justify-between items-center text-sm w-full pt-2">
                      <span className="text-slate-600 font-medium">Advance Required?</span>
                      <div className="flex items-center space-x-3 bg-white p-1 rounded border border-slate-200">
                        <label className="flex items-center cursor-pointer px-2">
                          <input type="radio" checked={advanceRequired} onChange={() => setAdvanceRequired(true)} className="mr-1.5" />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center cursor-pointer px-2">
                          <input type="radio" checked={!advanceRequired} onChange={() => setAdvanceRequired(false)} className="mr-1.5" />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {advanceRequired && (
                      <>
                        <div className="flex justify-between items-center text-sm w-full">
                          <span className="text-slate-600">Advance Percentage</span>
                          <select
                            value={advancePercentage}
                            onChange={(e) => setAdvancePercentage(Number(e.target.value))}
                            className="w-24 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm bg-white"
                          >
                            <option value={0}>0%</option>
                            <option value={10}>10%</option>
                            <option value={25}>25%</option>
                            <option value={30}>30%</option>
                            <option value={50}>50%</option>
                            <option value={75}>75%</option>
                            <option value={100}>100%</option>
                          </select>
                        </div>

                        <div className="flex justify-between items-center text-sm w-full">
                          <span className="text-slate-600">Advance Amount</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(advanceAmount)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm w-full border-t border-slate-200 pt-3 mt-3">
                          <span className="font-semibold text-slate-800">Remaining Amount</span>
                          <span className="font-bold text-slate-800">{formatCurrency(remainingAmount)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="w-full text-center py-4 border-t border-slate-200 mt-auto">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    "This is a Proforma Invoice and not a GST Tax Invoice."
                  </p>
                </div>

              </div> {/* End Printable Area */}

              {/* Action Buttons at the Bottom */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-4 w-full">
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
