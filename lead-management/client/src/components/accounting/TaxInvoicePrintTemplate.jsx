import React, { forwardRef } from 'react';
import { formatCurrency, numberToWords } from '../../utils/currency';

export const TaxInvoicePrintTemplate = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const {
    invoiceNumber,
    refNo, // Linked Proforma Invoice
    customerName,
    invoiceDate,
    dueDate,
    placeOfSupply,
    invoiceType,
    currency,
    billingAddress,
    shippingAddress,
    items = [],
    totals = {},
    advanceRequired,
    advancePercentage,
    advanceAmount,
    advancePaymentReceived,
    amountPaid,
    balanceDue,
    status,
    paymentMode,
    transactionNumber,
    bankName,
    chequeNumber,
    paymentDate,
    receivedBy,
    notes,
    logoBase64,
    branch
  } = data;

  const actualAdvancePaid = advancePaymentReceived ? (parseFloat(advanceAmount) || 0) : 0;
  const currentPayment = parseFloat(amountPaid) || 0;
  const totalAmountPaid = currentPayment + actualAdvancePaid;

  // Pagination Logic
  const ITEMS_PER_PAGE_NO_FOOTER = 16;
  const ITEMS_PER_PAGE_WITH_FOOTER = 8;
  
  let pages = [];
  let remainingItems = [...items];

  if (remainingItems.length <= ITEMS_PER_PAGE_WITH_FOOTER) {
    pages.push({ pageItems: remainingItems, isLastPage: true });
  } else {
    pages.push({ pageItems: remainingItems.splice(0, ITEMS_PER_PAGE_NO_FOOTER), isLastPage: false });
    while (remainingItems.length > ITEMS_PER_PAGE_WITH_FOOTER) {
      pages.push({ pageItems: remainingItems.splice(0, ITEMS_PER_PAGE_NO_FOOTER), isLastPage: false });
    }
    pages.push({ pageItems: remainingItems, isLastPage: true });
  }

  // Common Header Component to repeat on each page
  const PageHeader = () => (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Logo Space */}
          <div className="w-32 h-12 mb-4 flex items-center justify-start">
            {logoBase64 ? (
              <img src={logoBase64} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-400">
                LOGO
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{branch?.branch_name || 'Branch Name'}</h2>
          <p className="text-slate-600 mt-1">{branch?.address || 'Branch Address'}</p>
          <p className="text-slate-600">{[branch?.city, branch?.state].filter(Boolean).join(', ') || 'City, State'}</p>
          {(branch?.gstin || branch?.gst_number) && (
            <p className="text-slate-600 mt-1">
              <span className="font-semibold">GSTIN:</span> {branch.gstin || branch.gst_number}
            </p>
          )}
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
          <h1 className="text-3xl font-bold tracking-wider text-blue-900 mb-4 uppercase">TAX INVOICE</h1>
          
          <table className="ml-auto text-sm">
            <tbody>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Invoice #:</td>
                <td className="text-slate-800 font-semibold">{invoiceNumber}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Invoice Date:</td>
                <td className="text-slate-800">{invoiceDate}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Due Date:</td>
                <td className="text-slate-800">{dueDate}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Type:</td>
                <td className="text-slate-800">{invoiceType}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Place of Supply:</td>
                <td className="text-slate-800">{placeOfSupply}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Currency:</td>
                <td className="text-slate-800">{currency}</td>
              </tr>
              {refNo && (
                <tr>
                  <td className="text-slate-500 pr-4 py-1 text-right font-semibold">Ref Proforma #:</td>
                  <td className="text-slate-800">{refNo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between mb-6">
        <div className="w-[48%] border border-blue-100 p-3 rounded bg-blue-50/30">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">Bill To</h3>
          <p className="font-bold text-slate-800 text-sm mb-1">{customerName}</p>
          {billingAddress ? (
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{billingAddress}</p>
          ) : (
            <p className="text-slate-400 italic">No billing address provided.</p>
          )}
        </div>
        
        <div className="w-[48%] border border-blue-100 p-3 rounded bg-blue-50/30">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">Ship To</h3>
          <p className="font-bold text-slate-800 text-sm mb-1">{customerName}</p>
          {shippingAddress ? (
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{shippingAddress}</p>
          ) : (
            <p className="text-slate-500 italic">Same as Billing Address</p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div ref={ref} className="bg-white">
      {pages.map((page, pageIndex) => (
        <div 
          key={pageIndex}
          className="text-black font-sans relative overflow-hidden"
          style={{
            width: '210mm',
            height: '297mm',
            padding: '15mm 15mm 15mm 15mm', // Professional margins
            boxSizing: 'border-box',
            fontSize: '11px',
            lineHeight: '1.4'
          }}
        >
          <PageHeader />

          {/* Table */}
          <div className="mb-4">
            <table className="w-full border-collapse border border-blue-200">
              <thead>
                <tr className="bg-blue-100/50 text-blue-900 text-xs uppercase tracking-wider">
                  <th className="py-2 px-2 text-left font-semibold border-r border-b border-blue-200 w-10">#</th>
                  <th className="py-2 px-2 text-left font-semibold border-r border-b border-blue-200">Item Description</th>
                  <th className="py-2 px-2 text-left font-semibold border-r border-b border-blue-200 w-20">HSN/SAC</th>
                  <th className="py-2 px-2 text-center font-semibold border-r border-b border-blue-200 w-12">Qty</th>
                  <th className="py-2 px-2 text-center font-semibold border-r border-b border-blue-200 w-12">Unit</th>
                  <th className="py-2 px-2 text-right font-semibold border-r border-b border-blue-200 w-20">Rate</th>
                  <th className="py-2 px-2 text-center font-semibold border-r border-b border-blue-200 w-14">Tax %</th>
                  <th className="py-2 px-2 text-right font-semibold border-b border-blue-200 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {page.pageItems.map((item, idx) => {
                  const qty = parseFloat(item.qty) || 0;
                  const rate = parseFloat(item.rate) || 0;
                  const taxPct = parseFloat(item.tax) || 0;
                  const lineTotal = qty * rate * (1 + taxPct / 100);
                  
                  // Absolute index across pages
                  const absoluteIndex = items.findIndex(i => i === item) + 1;

                  return (
                    <tr key={idx} className={`text-slate-800 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-2 px-2 text-left border-r border-b border-blue-100">{absoluteIndex}</td>
                      <td className="py-2 px-2 text-left border-r border-b border-blue-100 whitespace-pre-wrap align-top">
                        <span className="font-medium">{item.service}</span>
                        {item.desc && <div className="text-slate-500 text-[10px] mt-0.5">{item.desc}</div>}
                      </td>
                      <td className="py-2 px-2 text-left border-r border-b border-blue-100 text-[10px] text-slate-500 align-top">{item.hsn}</td>
                      <td className="py-2 px-2 text-center border-r border-b border-blue-100 align-top">{qty}</td>
                      <td className="py-2 px-2 text-center border-r border-b border-blue-100 align-top text-[10px]">{item.unit}</td>
                      <td className="py-2 px-2 text-right border-r border-b border-blue-100 align-top">{formatCurrency(rate).replace('₹', '')}</td>
                      <td className="py-2 px-2 text-center border-r border-b border-blue-100 align-top text-[10px]">{taxPct}%</td>
                      <td className="py-2 px-2 text-right border-b border-blue-100 font-medium align-top">
                        {formatCurrency(lineTotal).replace('₹', '')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer content only renders on the last page */}
          {page.isLastPage && (
            <div className="w-full">
              
              {/* Totals & Payments Row */}
              <div className="flex justify-between items-start mb-6 gap-6">
                
                {/* Payment Info */}
                <div className="flex-1 space-y-4">
                  {advancePaymentReceived && advanceRequired && (
                    <div className="border border-blue-100 p-2 rounded">
                      <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Advance Payment Received</h4>
                      <div className="text-[11px] text-slate-700 flex justify-between">
                        <span>Advance Amount:</span>
                        <span className="font-semibold">{formatCurrency(advanceAmount).replace('₹', '')}</span>
                      </div>
                    </div>
                  )}

                  <div className="border border-blue-100 p-2 rounded">
                     <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Payment Details</h4>
                     <table className="w-full text-[11px]">
                        <tbody>
                          <tr>
                            <td className="py-0.5 text-slate-500 w-28">Payment Mode:</td>
                            <td className="py-0.5 text-slate-800 font-medium">{paymentMode || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 text-slate-500">Transaction No:</td>
                            <td className="py-0.5 text-slate-800 font-medium">{transactionNumber || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 text-slate-500">Bank Name:</td>
                            <td className="py-0.5 text-slate-800 font-medium">{bankName || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 text-slate-500">Payment Date:</td>
                            <td className="py-0.5 text-slate-800 font-medium">{paymentDate || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 text-slate-500">Received By:</td>
                            <td className="py-0.5 text-slate-800 font-medium">{receivedBy || '-'}</td>
                          </tr>
                        </tbody>
                     </table>
                  </div>

                  <div className="border border-blue-100 p-2 rounded">
                     <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Payment Summary</h4>
                     <table className="w-full text-[11px]">
                        <tbody>
                          <tr>
                            <td className="py-0.5 text-slate-500">Amount Paid:</td>
                            <td className="py-0.5 text-slate-800 font-bold text-right">{formatCurrency(totalAmountPaid).replace('₹', '')}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 text-slate-500">Outstanding Balance:</td>
                            <td className="py-0.5 text-red-600 font-bold text-right">{formatCurrency(balanceDue || 0).replace('₹', '')}</td>
                          </tr>
                        </tbody>
                     </table>
                  </div>

                </div>

                {/* Financial Summary */}
                <div className="w-[300px] border border-blue-200 rounded overflow-hidden">
                  <div className="bg-blue-50/50 p-3">
                    <table className="w-full text-[11px]">
                      <tbody>
                        <tr>
                          <td className="py-1 text-slate-600">Subtotal:</td>
                          <td className="py-1 text-slate-800 text-right font-semibold">{formatCurrency(totals.subtotal || 0).replace('₹', '')}</td>
                        </tr>
                        {(totals.discount > 0) && (
                          <tr>
                            <td className="py-1 text-slate-600">Discount:</td>
                            <td className="py-1 text-red-600 text-right font-semibold">-{formatCurrency(totals.discount).replace('₹', '')}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-1 text-slate-600">Taxable Amount:</td>
                          <td className="py-1 text-slate-800 text-right font-semibold">{formatCurrency(totals.taxable || 0).replace('₹', '')}</td>
                        </tr>
                        {(totals.cgst > 0) && (
                          <tr>
                            <td className="py-1 text-slate-600">CGST:</td>
                            <td className="py-1 text-slate-800 text-right">{formatCurrency(totals.cgst).replace('₹', '')}</td>
                          </tr>
                        )}
                        {(totals.sgst > 0) && (
                          <tr>
                            <td className="py-1 text-slate-600">SGST:</td>
                            <td className="py-1 text-slate-800 text-right">{formatCurrency(totals.sgst).replace('₹', '')}</td>
                          </tr>
                        )}
                        {(totals.igst > 0) && (
                          <tr>
                            <td className="py-1 text-slate-600">IGST:</td>
                            <td className="py-1 text-slate-800 text-right">{formatCurrency(totals.igst).replace('₹', '')}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-1 text-slate-600 pb-2">Round Off:</td>
                          <td className="py-1 text-slate-800 text-right pb-2">{formatCurrency(totals.roundOff || 0).replace('₹', '')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-blue-100/50 p-3 border-t border-blue-200 flex justify-between items-center">
                    <span className="font-bold text-blue-900 uppercase">Grand Total:</span>
                    <span className="font-bold text-blue-900 text-lg">
                      {formatCurrency(totals.grandTotal || 0).replace('₹', '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mb-6">
                <span className="text-[11px] font-bold text-slate-700">Amount in Words: </span>
                <span className="text-[11px] text-slate-600 italic font-medium">{numberToWords(totals.grandTotal || 0)}</span>
              </div>

              {/* Notes */}
              {notes && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes & Remarks</h3>
                  <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{notes}</p>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between mt-12 pt-8">
                <div className="w-48 text-center">
                  <div className="border-t border-slate-400 pt-1">
                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Receiver Signature</p>
                  </div>
                </div>
                <div className="w-48 text-center">
                  <div className="border-t border-slate-400 pt-1">
                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Authorized Signatory</p>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* Absolute Footer line for every page */}
          <div className="absolute bottom-[10mm] left-[15mm] right-[15mm] flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
            <span>This is a computer generated Tax Invoice.</span>
            <span>Page {pageIndex + 1} of {pages.length}</span>
          </div>

        </div>
      ))}
    </div>
  );
});

TaxInvoicePrintTemplate.displayName = 'TaxInvoicePrintTemplate';
