import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  PlusCircle, 
  HelpCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, fetchExchangeRate } from '../lib/api';
import { checkExpensePolicy } from '../lib/personnel';

export default function ReviewTable({
  receipts,
  currentUser,
  onUpdateReceipt,
  onDeleteReceipt,
  onAddManualRow,
  onViewImage,
}) {
  const handleFieldChange = (id, field, value) => {
    const target = receipts.find((r) => r.id === id);
    if (!target) return;

    const updated = { ...target, [field]: value };

    // If changing currency:
    if (field === 'currency') {
      const newCurr = (value || '').toUpperCase();
      if (newCurr === 'SGD') {
        updated.rate = 1.0;
        updated.amountSgd = updated.amount ? Number(updated.amount).toFixed(2) : '';
      } else {
        // Clear or trigger rate re-fetch
        updated.rate = '';
        updated.amountSgd = '';
        // Automatically attempt Frankfurter rate lookup
        fetchExchangeRate(newCurr, updated.date).then((res) => {
          if (res.rate) {
            const newAmountSgd = updated.amount ? (Number(updated.amount) * res.rate).toFixed(2) : '';
            onUpdateReceipt(id, {
              currency: newCurr,
              rate: res.rate,
              amountSgd: newAmountSgd,
              status: checkRowCompleteness(updated.date, updated.receiptNo, updated.expenseItem, updated.amount, newAmountSgd)
            });
          }
        });
      }
    }

    // If changing amount:
    if (field === 'amount') {
      const numAmount = parseFloat(value);
      if (updated.currency === 'SGD') {
        updated.rate = 1.0;
        updated.amountSgd = !isNaN(numAmount) ? numAmount.toFixed(2) : '';
      } else if (updated.rate && !isNaN(parseFloat(updated.rate))) {
        updated.amountSgd = !isNaN(numAmount) ? (numAmount * parseFloat(updated.rate)).toFixed(2) : '';
      } else {
        updated.amountSgd = '';
      }
    }

    // If changing rate manually:
    if (field === 'rate') {
      const numRate = parseFloat(value);
      const numAmount = parseFloat(updated.amount);
      if (!isNaN(numRate) && !isNaN(numAmount)) {
        updated.amountSgd = (numAmount * numRate).toFixed(2);
      } else if (!value) {
        updated.amountSgd = '';
      }
    }

    // If user directly edits Amount (SGD)
    if (field === 'amountSgd') {
      const numSgd = parseFloat(value);
      const numAmount = parseFloat(updated.amount);
      if (!isNaN(numSgd) && !isNaN(numAmount) && numAmount > 0 && updated.currency !== 'SGD') {
        updated.rate = (numSgd / numAmount).toFixed(4);
      }
    }

    // Evaluate row completeness
    updated.status = checkRowCompleteness(
      updated.date,
      updated.receiptNo,
      updated.expenseItem,
      updated.amount,
      updated.amountSgd
    );

    onUpdateReceipt(id, updated);
  };

  const handleFetchRateForRow = async (rcpt) => {
    if (!rcpt.currency || rcpt.currency === 'SGD') return;
    try {
      const res = await fetchExchangeRate(rcpt.currency, rcpt.date);
      if (res.rate) {
        const amountSgd = rcpt.amount ? (Number(rcpt.amount) * res.rate).toFixed(2) : '';
        const newStatus = checkRowCompleteness(rcpt.date, rcpt.receiptNo, rcpt.expenseItem, rcpt.amount, amountSgd);
        onUpdateReceipt(rcpt.id, {
          rate: res.rate,
          amountSgd,
          status: newStatus,
        });
      }
    } catch (e) {
      console.warn('Failed to refresh rate:', e);
    }
  };

  const checkRowCompleteness = (date, receiptNo, expenseItem, amount, amountSgd) => {
    const isComplete = Boolean(
      date?.trim() &&
      receiptNo?.trim() &&
      expenseItem?.trim() &&
      amount &&
      !isNaN(parseFloat(amount)) &&
      amountSgd &&
      !isNaN(parseFloat(amountSgd))
    );
    return isComplete ? 'ready' : 'needs_look';
  };

  const totalSgd = receipts.reduce((acc, curr) => {
    const val = parseFloat(curr.amountSgd);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const incompleteRowsCount = receipts.filter((r) => r.status !== 'ready').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-600" />
            <span>Claim Lines Review Table</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Check and edit each row beside its receipt image before generating the claim PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {incompleteRowsCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{incompleteRowsCount} line{incompleteRowsCount > 1 ? 's' : ''} need attention</span>
            </span>
          ) : receipts.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>All claim lines complete</span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={onAddManualRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No claim lines yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Upload receipt images above or click "Add Row" to enter an expense manually.
          </p>
          <button
            type="button"
            onClick={onAddManualRow}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add manual claim line</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-2 w-18">Receipt</th>
                  <th className="py-3 px-3 w-32">Date</th>
                  <th className="py-3 px-3 w-36">Receipt No.</th>
                  <th className="py-3 px-3">Expense Item</th>
                  <th className="py-3 px-2 w-28">Currency</th>
                  <th className="py-3 px-3 w-28 text-right">Amount</th>
                  <th className="py-3 px-2 w-28 text-right">Rate Used</th>
                  <th className="py-3 px-3 w-32 text-right">Amount (SGD)</th>
                  <th className="py-3 px-2 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipts.map((rcpt, index) => {
                  const hasEmptyFields =
                    !rcpt.date ||
                    !rcpt.receiptNo ||
                    !rcpt.expenseItem ||
                    !rcpt.amount ||
                    !rcpt.amountSgd;
                  const isAttentionNeeded = rcpt.status === 'needs_look' || hasEmptyFields;
                  const isSgd = rcpt.currency === 'SGD';

                  return (
                    <tr
                      key={rcpt.id}
                      className={`group transition-colors ${
                        isAttentionNeeded
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Row # */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-500">
                        {index + 1}
                      </td>

                      {/* Receipt Image Thumbnail Beside Row */}
                      <td className="py-2 px-2">
                        <div
                          onClick={() => rcpt.dataUrl && onViewImage(rcpt)}
                          className="relative w-12 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-300 hover:border-sky-500 cursor-pointer shadow-2xs group/img flex items-center justify-center transition-all"
                          title="Click to zoom receipt"
                        >
                          {rcpt.dataUrl ? (
                            <img
                              src={rcpt.dataUrl}
                              alt="Receipt"
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400">None</span>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2 px-2">
                        <input
                          type="date"
                          value={rcpt.date || ''}
                          onChange={(e) => handleFieldChange(rcpt.id, 'date', e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                            !rcpt.date ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
                          }`}
                        />
                      </td>

                      {/* Receipt No */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={rcpt.receiptNo || ''}
                          onChange={(e) => handleFieldChange(rcpt.id, 'receiptNo', e.target.value)}
                          placeholder="e.g. INV-102"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                            !rcpt.receiptNo ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
                          }`}
                        />
                      </td>

                      {/* Expense Item */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={rcpt.expenseItem || ''}
                          onChange={(e) => handleFieldChange(rcpt.id, 'expenseItem', e.target.value)}
                          placeholder="e.g. Client Dinner"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                            !rcpt.expenseItem ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
                          }`}
                        />
                        {currentUser?.department && rcpt.expenseItem && (() => {
                          const check = checkExpensePolicy(currentUser.department, rcpt.expenseItem);
                          return (
                            <div className="mt-1 flex items-center">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                                  check.isCompliant
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                                title={check.reason}
                              >
                                {check.isCompliant ? `✓ Approved: ${check.category}` : `⚠️ ${currentUser.department} policy: ${currentUser.department === 'Sales' ? 'Meals' : 'Materials'} only`}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Currency */}
                      <td className="py-2 px-2">
                        <select
                          value={rcpt.currency || 'SGD'}
                          onChange={(e) => handleFieldChange(rcpt.id, 'currency', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                        >
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Amount */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rcpt.amount || ''}
                          onChange={(e) => handleFieldChange(rcpt.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-right font-mono transition-colors ${
                            !rcpt.amount ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
                          }`}
                        />
                      </td>

                      {/* Rate Used */}
                      <td className="py-2 px-2">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.0001"
                            disabled={isSgd}
                            value={isSgd ? '1.0000' : (rcpt.rate !== undefined && rcpt.rate !== null ? rcpt.rate : '')}
                            onChange={(e) => handleFieldChange(rcpt.id, 'rate', e.target.value)}
                            placeholder={isSgd ? '1.0000' : 'Rate'}
                            className={`w-full pl-2 pr-6 py-1.5 rounded-lg border text-xs text-right font-mono ${
                              isSgd
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                : !rcpt.rate
                                ? 'border-amber-400 bg-amber-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          />
                          {!isSgd && (
                            <button
                              type="button"
                              onClick={() => handleFetchRateForRow(rcpt)}
                              title="Re-fetch rate from Frankfurter"
                              className="absolute right-1 text-slate-400 hover:text-sky-600 p-0.5"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Amount (SGD) */}
                      <td className="py-2 px-2">
                        <div className="relative flex items-center">
                          <span className="absolute left-2 text-[10px] text-slate-400 font-mono">SGD</span>
                          <input
                            type="number"
                            step="0.01"
                            value={rcpt.amountSgd || ''}
                            onChange={(e) => handleFieldChange(rcpt.id, 'amountSgd', e.target.value)}
                            placeholder="0.00"
                            className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-xs text-right font-mono font-bold ${
                              !rcpt.amountSgd
                                ? 'border-amber-400 bg-amber-50 text-amber-900'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteReceipt(rcpt.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Small Screen Card-by-Card Review */}
          <div className="block lg:hidden divide-y divide-slate-200">
            {receipts.map((rcpt, index) => {
              const isSgd = rcpt.currency === 'SGD';
              const hasEmptyFields =
                !rcpt.date ||
                !rcpt.receiptNo ||
                !rcpt.expenseItem ||
                !rcpt.amount ||
                !rcpt.amountSgd;

              return (
                <div
                  key={rcpt.id}
                  className={`p-4 space-y-3 ${
                    hasEmptyFields ? 'bg-amber-50/50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {hasEmptyFields ? '⚠️ Missing details' : '✓ Verified'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteReceipt(rcpt.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail & Expense Item */}
                  <div className="flex gap-3">
                    <div
                      onClick={() => rcpt.dataUrl && onViewImage(rcpt)}
                      className="w-16 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative shadow-inner"
                    >
                      {rcpt.dataUrl ? (
                        <img src={rcpt.dataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[10px] text-slate-400 text-center pt-6">No img</div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center text-white opacity-0 hover:opacity-100">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">Expense Item</label>
                          {currentUser?.department && rcpt.expenseItem && (() => {
                            const check = checkExpensePolicy(currentUser.department, rcpt.expenseItem);
                            return (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                                  check.isCompliant
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                              >
                                {check.isCompliant ? `✓ ${check.category}` : `⚠️ ${currentUser.department === 'Sales' ? 'Meals only' : 'Materials only'}`}
                              </span>
                            );
                          })()}
                        </div>
                        <input
                          type="text"
                          value={rcpt.expenseItem || ''}
                          onChange={(e) => handleFieldChange(rcpt.id, 'expenseItem', e.target.value)}
                          placeholder="e.g. Taxi to Airport"
                          className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white mt-0.5"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">Date</label>
                          <input
                            type="date"
                            value={rcpt.date || ''}
                            onChange={(e) => handleFieldChange(rcpt.id, 'date', e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">Receipt #</label>
                          <input
                            type="text"
                            value={rcpt.receiptNo || ''}
                            onChange={(e) => handleFieldChange(rcpt.id, 'receiptNo', e.target.value)}
                            placeholder="INV-..."
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Currencies and Amounts */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block">Curr & Amount</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <select
                          value={rcpt.currency || 'SGD'}
                          onChange={(e) => handleFieldChange(rcpt.id, 'currency', e.target.value)}
                          className="px-1.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                        >
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={rcpt.amount || ''}
                          onChange={(e) => handleFieldChange(rcpt.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 text-xs text-right font-mono rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block">Rate Used</label>
                      <div className="relative flex items-center mt-0.5">
                        <input
                          type="number"
                          step="0.0001"
                          disabled={isSgd}
                          value={isSgd ? '1.0000' : (rcpt.rate !== undefined && rcpt.rate !== null ? rcpt.rate : '')}
                          onChange={(e) => handleFieldChange(rcpt.id, 'rate', e.target.value)}
                          placeholder={isSgd ? '1.00' : 'Rate'}
                          className={`w-full px-1.5 py-1 text-xs text-right font-mono rounded-lg border ${
                            isSgd ? 'bg-slate-200 text-slate-600' : 'bg-white border-slate-300'
                          }`}
                        />
                        {!isSgd && (
                          <button
                            type="button"
                            onClick={() => handleFetchRateForRow(rcpt)}
                            className="ml-1 text-slate-400 hover:text-sky-600"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block">Amount (SGD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rcpt.amountSgd || ''}
                        onChange={(e) => handleFieldChange(rcpt.id, 'amountSgd', e.target.value)}
                        placeholder="0.00"
                        className="w-full mt-0.5 px-2 py-1 text-xs text-right font-bold font-mono rounded-lg border border-sky-300 bg-sky-50 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Footer with Total */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <span>Exchange rates automatically converted via Frankfurter API.</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Total Claim Amount:
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400">
                SGD ${totalSgd.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
