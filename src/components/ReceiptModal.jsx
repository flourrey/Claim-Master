import React, { useEffect } from 'react';
import { X, ZoomIn, Calendar, Tag, CreditCard, DollarSign } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  // Allow closing with ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!receipt) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with guaranteed visible Close button */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 break-words line-clamp-2 leading-tight">
              {receipt.expenseItem || receipt.fileName || 'Receipt Preview'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-mono truncate mt-0.5">
              {receipt.receiptNo ? `Ref: ${receipt.receiptNo} · ` : ''}{receipt.fileName}
            </p>
          </div>

          {/* Guaranteed Close Button (shrink-0 prevents squash or displacement) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt preview"
            className="shrink-0 p-2 text-slate-600 hover:text-slate-900 bg-slate-200/90 hover:bg-slate-300 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Image Display */}
        <div className="flex-1 overflow-auto p-4 bg-slate-900/5 flex items-center justify-center min-h-[200px]">
          {receipt.dataUrl ? (
            <img
              src={receipt.dataUrl}
              alt={receipt.fileName || 'Receipt image'}
              className="max-h-[58vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200/60 bg-white"
            />
          ) : (
            <div className="text-slate-400 text-sm">No image available</div>
          )}
        </div>

        {/* Footer with key extracted values */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs shrink-0">
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Date</span>
            <span className="font-semibold text-slate-800 font-mono text-xs">{receipt.date || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Receipt #</span>
            <span className="font-semibold text-slate-800 font-mono text-xs truncate block">{receipt.receiptNo || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Original Amount</span>
            <span className="font-bold text-slate-900 font-mono text-xs truncate block">
              {receipt.currency} {receipt.amount || '0.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">SGD Converted</span>
            <span className="font-bold text-sky-600 font-mono text-xs truncate block">
              SGD ${receipt.amountSgd || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
