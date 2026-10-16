import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Trash2, Eye, ExternalLink } from 'lucide-react';

export default function ReceiptCard({
  receipt,
  index,
  onRemove,
  onViewImage,
  onSelectForReview,
}) {
  const {
    id,
    fileName,
    dataUrl,
    status, // 'reading' | 'ready' | 'needs_look' | 'failed'
    date,
    expenseItem,
    currency,
    amount,
    amountSgd,
    error,
  } = receipt;

  // Status configuration
  const statusConfig = {
    reading: {
      label: 'Reading...',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />,
      dot: 'bg-blue-500 animate-ping',
    },
    ready: {
      label: 'Ready',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      dot: 'bg-emerald-500',
    },
    needs_look: {
      label: 'Needs a look',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      dot: 'bg-amber-500',
    },
    failed: {
      label: 'Failed',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
      dot: 'bg-rose-500',
    },
  }[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null,
    dot: 'bg-slate-400',
  };

  const isReading = status === 'reading';
  const isFailed = status === 'failed';

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        status === 'needs_look'
          ? 'border-amber-300 ring-2 ring-amber-100'
          : status === 'failed'
          ? 'border-rose-300 bg-rose-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-4 flex gap-3.5 items-start">
        {/* Receipt Thumbnail with Zoom Action */}
        <div
          onClick={() => dataUrl && onViewImage(receipt)}
          className="relative w-18 h-22 sm:w-20 sm:h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 cursor-pointer group/thumb shadow-inner flex items-center justify-center"
          title="Click to view full receipt"
        >
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={fileName || 'Receipt thumbnail'}
              className="w-full h-full object-cover object-top transition-transform duration-200 group-hover/thumb:scale-110"
            />
          ) : (
            <div className="text-slate-400 text-xs text-center px-1">No preview</div>
          )}

          {/* Quick preview hover overlay */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Eye className="w-5 h-5 drop-shadow" />
          </div>

          {/* Line number badge */}
          <div className="absolute top-1 left-1 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
            #{index + 1}
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </span>

            {/* Remove Action */}
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
              title="Remove receipt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Extracted or Reading information */}
          {isReading ? (
            <div className="py-2 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              <p className="text-xs text-slate-400 italic">Reading amount, currency & vendor...</p>
            </div>
          ) : isFailed ? (
            <div className="py-1">
              <p className="text-xs text-rose-700 font-medium">
                {error || 'Could not parse receipt contents.'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{fileName}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 truncate" title={expenseItem}>
                {expenseItem || 'Untitled Expense'}
              </h4>

              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span>{date || 'Date missing'}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{receipt.receiptNo || 'No ref #'}</span>
              </div>

              {/* Amounts summary */}
              <div className="pt-1 flex items-baseline justify-between">
                <span className="text-xs font-mono font-medium text-slate-600">
                  {currency} {amount || '—'}
                </span>

                <div className="text-right">
                  <span className="text-xs text-slate-400 mr-1">SGD</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    ${amountSgd ? Number(amountSgd).toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer bar of card */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 truncate max-w-[150px]">{fileName}</span>

        <button
          type="button"
          onClick={() => onSelectForReview(receipt)}
          className="inline-flex items-center gap-1 font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          <span>Review row</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
