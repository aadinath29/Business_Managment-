import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, UploadCloud, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportToPDF } from '../../utils/pdfExport';
import { QuotationPrintTemplate } from './QuotationPrintTemplate';

export function NewQuotationModal({ onClose, onSave, initialData, readOnly = false }) {
  const documentRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const [quotationId] = useState(
    initialData?.quotationId || `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  );
  
  const [date, setDate] = useState(
    initialData?.quotationDate || new Date().toISOString().split('T')[0]
  );

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [negotiationStatus, setNegotiationStatus] = useState(initialData?.negotiationStatus || 'Pending Review');

  const [services, setServices] = useState(
    initialData?.items || [
      { id: '1', service: '', desc: '', rate: 0, qty: 1, discount: 0, tax: 18 } // Removed unused HSN/unit from init but left for legacy
    ]
  );

  const [totals, setTotals] = useState({
    subtotal: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, roundOff: 0, grandTotal: 0
  });

  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || 'Due on Receipt');
  const [validity, setValidity] = useState(initialData?.validity || '30 Days');
  const [priority, setPriority] = useState(initialData?.priority || 'Normal');
  const [billTo, setBillTo] = useState(initialData?.billTo || '');
  const [shipTo, setShipTo] = useState(initialData?.shipTo || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [terms, setTerms] = useState(initialData?.terms || '');
  const [shippingAmount, setShippingAmount] = useState(initialData?.shippingAmount || 0);
  const [globalDiscountAmt, setGlobalDiscountAmt] = useState(initialData?.totals?.discount || 0);
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  const [showError, setShowError] = useState(false);

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
    const grand = taxable + taxAmt + (parseFloat(shippingAmount) || 0);
    
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
  }, [services, globalDiscountAmt, shippingAmount]);

  const addService = () => {
    setServices([...services, { id: Date.now().toString(), service: '', desc: '', rate: 0, qty: 1, tax: 18 }]);
  };

  const updateService = (id, field, value) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeService = (id) => {
    if(services.length > 1) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleSave = () => {
    if (!customerName) {
      setShowError(true);
      return;
    }
    
    const newQuotation = {
      ...initialData, // keep any original data if editing
      quotationId: quotationId,
      quotationNumber: quotationId,
      quotationDate: date,
      customerName: customerName,
      negotiationStatus: negotiationStatus,
      totalAmount: totals.grandTotal,
      items: services,
      totals: totals,
      paymentTerms,
      validity,
      priority,
      billTo,
      shipTo,
      notes,
      terms,
      shippingAmount
    };
    
    onSave(newQuotation);
    onClose();
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    try {
      setIsExporting(true);
      const filename = `Quotation_${quotationId || 'Document'}.pdf`;
      await exportToPDF(documentRef.current, filename);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pending Review': return 'bg-amber-100 text-amber-700';
      case 'Under Negotiation': return 'bg-blue-100 text-blue-700';
      case 'Approved & Signed': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
      
      <div className="w-[95vw] h-[95vh] relative flex flex-col overflow-hidden bg-white rounded-md shadow-2xl border border-gray-200">
        <button 
          onClick={onClose} 
          aria-label="Close" 
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12">
          
          {/* Hidden PDF Template */}
          <div className="absolute top-[-9999px] left-[-9999px]">
            <QuotationPrintTemplate 
              ref={documentRef}
              data={{
                quotationNumber: quotationId,
                quotationDate: date,
                paymentTerms,
                validity,
                priority,
                customerName,
                billTo,
                shipTo,
                items: services,
                totals,
                notes,
                terms,
                shippingAmount,
                logoBase64
              }}
            />
          </div>

          {/* Form Area */}
          <div className="bg-white text-slate-800 p-2 sm:p-4">
            
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
                  readOnly={readOnly}
                  placeholder="Who is this from? / Customer Name" 
                  className={`w-full p-2 border ${showError && !customerName ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded outline-none focus:border-blue-500 text-sm`}
                />
                {showError && !customerName && <p className="text-xs text-red-500 mt-1">Required field</p>}
              </div>

              {/* Bill To & Ship To */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="text-sm text-slate-600 block mb-1">Bill To</label>
                  <textarea value={billTo} onChange={(e) => setBillTo(e.target.value)} readOnly={readOnly} rows="3" placeholder="Billing Address..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                </div>
                <div className="flex-1 w-full">
                  <label className="text-sm text-slate-600 block mb-1">Ship To</label>
                  <textarea value={shipTo} onChange={(e) => setShipTo(e.target.value)} readOnly={readOnly} rows="3" placeholder="(optional)" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="w-full md:flex-1 flex flex-col items-start md:items-end">
              <h1 className="text-4xl font-bold text-[#0F172A] tracking-wide mb-6">QUOTATION</h1>
              
              <div className="flex items-center mb-6 w-full">
                <div className="bg-slate-50 border border-r-0 border-slate-300 rounded-l px-3 py-1.5 text-slate-500 font-medium">
                  #
                </div>
                <input type="text" value={quotationId} readOnly className="w-full p-1.5 border border-slate-300 rounded-r outline-none md:text-right font-medium text-sm text-slate-700 bg-white" />
              </div>

              <div className="w-full space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                  <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} readOnly={readOnly} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                  <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Payment Terms</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} disabled={readOnly} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                  <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Validity</label>
                  <select value={validity} onChange={(e) => setValidity(e.target.value)} disabled={readOnly} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                    <option value="30 Days">30 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
                  <label className="text-sm text-slate-600 w-full sm:w-1/2 sm:text-right pr-0 sm:pr-4 mb-1 sm:mb-0">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={readOnly} className="w-full sm:w-1/2 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm sm:text-right bg-white">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
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
                    {s.qty * s.rate * (1 + (s.tax || 0)/100)}
                  const amount = (s.qty * s.rate) * (1 + (s.tax || 0)/100);
                  return (
                    <tr key={s.id} className="group border-b border-slate-100">
                      <td className="py-2 pr-2">
                        <input type="text" value={s.service} onChange={e => updateService(s.id, 'service', e.target.value)} readOnly={readOnly} placeholder="Description of service..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm mb-1 bg-white" />
                        <input type="text" value={s.desc} onChange={e => updateService(s.id, 'desc', e.target.value)} readOnly={readOnly} placeholder="Additional details..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-xs bg-white italic text-slate-600" />
                      </td>
                      <td className="py-2 px-1 relative">
                        <div className="absolute inset-y-2 left-2 flex items-center text-slate-400 pointer-events-none text-sm">₹</div>
                        <input type="number" value={s.rate} onChange={e => updateService(s.id, 'rate', e.target.value)} readOnly={readOnly} className="w-full p-2 pl-6 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" min="1" value={s.qty} onChange={e => updateService(s.id, 'qty', e.target.value)} readOnly={readOnly} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" value={s.tax} onChange={e => updateService(s.id, 'tax', e.target.value)} readOnly={readOnly} className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm text-center bg-white" />
                      </td>
                      <td className="py-2 px-1 relative">
                        <input type="text" value={formatCurrency(amount)} readOnly className="w-full p-2 border-0 bg-transparent text-sm text-right font-medium text-slate-800" />
                      </td>
                      <td className="py-2 pl-2 flex items-center justify-center pt-4">
                        {!readOnly && (
                          <button onClick={() => removeService(s.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!readOnly && (
              <button onClick={addService} className="flex items-center text-[#108A63] border border-[#108A63] bg-white hover:bg-emerald-50 px-3 py-1.5 rounded font-medium text-sm transition-colors shadow-sm mt-2">
                <Plus className="w-4 h-4 mr-1" /> Line Item
              </button>
            )}
          </div>

          {/* Footer Calculation & Notes Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start pt-4 gap-8 w-full">
            {/* Notes & Terms */}
            <div className="w-full lg:flex-1 space-y-6">
              <div>
                <label className="text-sm text-slate-600 block mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Any relevant notes..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
              </div>
              <div>
                <label className="text-sm text-slate-600 block mb-1">Terms</label>
                <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows="2" placeholder="Terms and conditions..." className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-sm resize-none"></textarea>
              </div>
              <div>
                <label className="text-sm text-slate-600 block mb-1">Attachments</label>
                <div className="w-full border border-dashed border-slate-300 rounded p-4 text-center cursor-pointer hover:bg-slate-50 text-slate-500 text-sm flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 mr-2" /> Attach Files
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
                    <input type="number" value={globalDiscountAmt} onChange={(e) => setGlobalDiscountAmt(e.target.value)} disabled={readOnly} className="w-full outline-none text-right text-slate-800 pr-1" />
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

              <div className="flex justify-between items-center text-sm w-full">
                <span className="text-slate-600">Shipping</span>
                <div className="flex items-center w-full sm:w-32 border border-slate-300 rounded bg-white p-1">
                  <span className="text-slate-400 pl-1">₹</span>
                  <input type="number" value={shippingAmount} onChange={(e) => setShippingAmount(e.target.value)} disabled={readOnly} className="w-full outline-none text-right text-slate-800 pr-1" />
                </div>
              </div>
              
              {/* Total */}
              <div className="flex justify-between items-center pt-2 pb-2 w-full">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-bold text-slate-800">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          </div> {/* End Printable Area */}

          {/* Action Buttons at the Bottom */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Negotiation Status</label>
              <select 
                value={negotiationStatus}
                onChange={(e) => setNegotiationStatus(e.target.value)}
                disabled={readOnly}
                className={`py-2 px-3 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-[#108A63] text-sm font-medium transition-colors ${getStatusBadgeColor(negotiationStatus)}`}
              >
                <option value="Pending Review" className="bg-white text-slate-700">Pending Review</option>
                <option value="Under Negotiation" className="bg-white text-slate-700">Under Negotiation</option>
                <option value="Approved & Signed" className="bg-white text-slate-700">Approved & Signed</option>
                <option value="Rejected" className="bg-white text-slate-700">Rejected</option>
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
              <button 
                onClick={handleDownloadPDF} 
                disabled={isExporting}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded shadow-sm hover:bg-slate-50 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </button>
              <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded shadow-sm hover:bg-slate-50 transition-colors text-sm">
                {readOnly ? 'Close' : 'Cancel'}
              </button>
              {!readOnly && (
                <button onClick={handleSave} className="w-full sm:w-auto px-8 py-2.5 bg-[#108A63] text-white font-semibold rounded shadow-md hover:bg-emerald-700 transition-colors text-sm whitespace-nowrap">
                  Save
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
}
