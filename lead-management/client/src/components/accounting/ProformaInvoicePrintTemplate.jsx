import React, { forwardRef } from 'react';
import { formatCurrency } from '../../utils/currency';

export const ProformaInvoicePrintTemplate = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const {
    proformaNumber,
    proformaDate,
    validUntil,
    refNo, // Quotation Number
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
    bankDetails = {},
    items = [],
    totals = {},
    remarks,
    logoBase64,
    branch,
  } = data;

  const totalTax = (totals.cgst || 0) + (totals.sgst || 0) + (totals.igst || 0);

  // Extract terms if remarks contain terms (assuming standard string splitting or just showing remarks as is)
  // For simplicity, we just display the full remarks since it merged Notes and Terms.

  return (
    <div 
      ref={ref} 
      // Force A4 size styling for html2canvas
      className="bg-white text-black font-sans"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        boxSizing: 'border-box',
        fontSize: '12px'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Logo Space */}
          <div className="w-32 h-12 mb-4 flex items-center justify-start">
            {logoBase64 ? (
              <img src={logoBase64} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                LOGO
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{branch?.branch_name || 'Branch Name'}</h2>
          <p className="text-slate-600 mt-1">{branch?.address || 'Branch Address'}</p>
          <p className="text-slate-600">{[branch?.city, branch?.state].filter(Boolean).join(', ') || 'City, State'}</p>
          {(branch?.gstin || branch?.gst_number) && <p className="text-slate-600 mt-1">GSTIN: {branch.gstin || branch.gst_number}</p>}
          {(branch?.phone || branch?.email) && (
            <p className="text-slate-600 mt-1">
              {[
                branch?.phone ? `Phone: ${branch.phone}` : null,
                branch?.email ? `Email: ${branch.email}` : null
              ].filter(Boolean).join(' | ')}
            </p>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-wider text-slate-800 mb-4 uppercase">PROFORMA INVOICE</h1>
          
          <table className="ml-auto text-sm">
            <tbody>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-medium">Proforma #:</td>
                <td className="text-slate-800 font-medium">{proformaNumber}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-medium">Date:</td>
                <td className="text-slate-800">{proformaDate}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-medium">Valid Until:</td>
                <td className="text-slate-800">{validUntil}</td>
              </tr>
              {refNo && (
                <tr>
                  <td className="text-slate-500 pr-4 py-1 text-right font-medium">Ref Quote #:</td>
                  <td className="text-slate-800">{refNo}</td>
                </tr>
              )}
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-medium">Payment Terms:</td>
                <td className="text-slate-800">{paymentTerms}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice */}
      <div className="mb-8 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-center rounded text-sm">
        <span className="font-bold">THIS IS A PROFORMA INVOICE</span><br />
        This document is issued for customer approval and commercial reference only. This is NOT a GST Tax Invoice.
      </div>

      {/* Customer Info */}
      <div className="flex justify-between mb-8">
        <div className="w-[45%]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Bill To</h3>
          <p className="font-bold text-slate-800 text-sm">{customerName}</p>
          {billTo ? (
            <p className="text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{billTo}</p>
          ) : (
            <p className="text-slate-400 italic mt-1">No billing address provided.</p>
          )}
        </div>
        
        {shipTo && (
          <div className="w-[45%]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Ship To</h3>
            <p className="font-bold text-slate-800 text-sm">{customerName}</p>
            <p className="text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{shipTo}</p>
          </div>
        )}
      </div>

      {/* Commercial Details */}
      <div className="mb-8 flex gap-8">
        {expectedDeliveryDate && (
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Delivery</span>
            <span className="text-slate-800">{expectedDeliveryDate}</span>
          </div>
        )}
        {deliveryTerms && (
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Delivery Terms</span>
            <span className="text-slate-800">{deliveryTerms}</span>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
              <th className="py-2 px-3 text-left font-semibold border border-slate-200 w-12">#</th>
              <th className="py-2 px-3 text-left font-semibold border border-slate-200">Item / Service</th>
              <th className="py-2 px-3 text-center font-semibold border border-slate-200 w-16">Qty</th>
              <th className="py-2 px-3 text-right font-semibold border border-slate-200 w-24">Rate</th>
              <th className="py-2 px-3 text-center font-semibold border border-slate-200 w-20">Tax %</th>
              <th className="py-2 px-3 text-right font-semibold border border-slate-200 w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const qty = parseFloat(item.qty) || 0;
              const rate = parseFloat(item.rate) || 0;
              const taxPct = parseFloat(item.tax) || 0;
              const lineTotal = qty * rate * (1 + taxPct / 100);

              return (
                <tr key={index} className="text-slate-800 border-b border-slate-200">
                  <td className="py-3 px-3 text-left border-x border-slate-200">{index + 1}</td>
                  <td className="py-3 px-3 text-left border-x border-slate-200 whitespace-pre-wrap">
                    {item.service}
                    {item.desc && <div className="text-slate-500 text-xs mt-1">{item.desc}</div>}
                  </td>
                  <td className="py-3 px-3 text-center border-x border-slate-200">{qty}</td>
                  <td className="py-3 px-3 text-right border-x border-slate-200">{formatCurrency(rate)}</td>
                  <td className="py-3 px-3 text-center border-x border-slate-200">{taxPct}%</td>
                  <td className="py-3 px-3 text-right border-x border-slate-200 font-medium">
                    {formatCurrency(lineTotal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Details Split Section */}
      <div className="flex justify-between mb-10">
        
        {/* Left Side: Bank & Advance Details */}
        <div className="w-1/2 pr-8 space-y-6">
          
          {/* Advance Payment section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Advance Payment</h3>
            <table className="w-full text-sm mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-slate-600">Advance Required:</td>
                  <td className="py-1 text-slate-800 font-medium">{advanceRequired ? 'Yes' : 'No'}</td>
                </tr>
                {advanceRequired && (
                  <>
                    <tr>
                      <td className="py-1 text-slate-600">Advance Percentage:</td>
                      <td className="py-1 text-slate-800 font-medium">{advancePercentage}%</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600">Advance Amount:</td>
                      <td className="py-1 text-slate-800 font-medium">{formatCurrency(advanceAmount)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600">Remaining Amount:</td>
                      <td className="py-1 text-slate-800 font-medium">{formatCurrency(remainingAmount)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Bank Details section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Bank Details</h3>
            <table className="w-full text-sm mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-slate-600 w-32">Bank Name:</td>
                  <td className="py-1 text-slate-800 font-medium">{bankDetails.bankName || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Account Number:</td>
                  <td className="py-1 text-slate-800 font-medium">{bankDetails.accountNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">IFSC Code:</td>
                  <td className="py-1 text-slate-800 font-medium">{bankDetails.ifsc || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">UPI ID:</td>
                  <td className="py-1 text-slate-800 font-medium">{bankDetails.upiId || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Side: Financial Summary Box */}
        <div className="w-72 mt-2">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-slate-600 text-right pr-4">Subtotal:</td>
                <td className="py-1 text-slate-800 text-right font-medium">{formatCurrency(totals.subtotal || 0)}</td>
              </tr>
              {(totals.discount > 0) && (
                <tr>
                  <td className="py-1 text-slate-600 text-right pr-4">Discount:</td>
                  <td className="py-1 text-red-600 text-right font-medium">-{formatCurrency(totals.discount)}</td>
                </tr>
              )}
              {totals.taxable > 0 && totals.discount > 0 && (
                <tr>
                  <td className="py-1 text-slate-600 text-right pr-4">Taxable Amount:</td>
                  <td className="py-1 text-slate-800 text-right font-medium">{formatCurrency(totals.taxable || 0)}</td>
                </tr>
              )}
              {totals.cgst > 0 && (
                <tr>
                  <td className="py-1 text-slate-600 text-right pr-4">CGST:</td>
                  <td className="py-1 text-slate-800 text-right font-medium">{formatCurrency(totals.cgst)}</td>
                </tr>
              )}
              {totals.sgst > 0 && (
                <tr>
                  <td className="py-1 text-slate-600 text-right pr-4">SGST:</td>
                  <td className="py-1 text-slate-800 text-right font-medium">{formatCurrency(totals.sgst)}</td>
                </tr>
              )}
              {totals.igst > 0 && (
                <tr>
                  <td className="py-1 text-slate-600 text-right pr-4">IGST:</td>
                  <td className="py-1 text-slate-800 text-right font-medium">{formatCurrency(totals.igst)}</td>
                </tr>
              )}
              {totalTax > 0 && (
                <tr>
                  <td className="py-1 text-slate-600 text-right pr-4">Tax Amount:</td>
                  <td className="py-1 text-slate-800 text-right font-medium">{formatCurrency(totalTax)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-800">
                <td className="py-2 text-slate-800 text-right pr-4 font-bold uppercase">Grand Total:</td>
                <td className="py-2 text-slate-800 text-right font-bold text-lg">
                  {formatCurrency(totals.grandTotal || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks */}
      <div className="mb-12">
        {remarks && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks & Terms</h3>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{remarks}</p>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-20 pt-10 border-t border-slate-200">
        <div className="w-48 text-center">
          <div className="border-b border-slate-800 mb-2 h-8"></div>
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Prepared By</p>
        </div>
        <div className="w-48 text-center">
          <div className="border-b border-slate-800 mb-2 h-8"></div>
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Authorized Signature</p>
        </div>
        <div className="w-48 text-center">
          <div className="border-b border-slate-800 mb-2 h-8"></div>
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Customer Acceptance</p>
        </div>
      </div>

    </div>
  );
});

ProformaInvoicePrintTemplate.displayName = 'ProformaInvoicePrintTemplate';
