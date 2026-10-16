import React from 'react';
import { X, ZoomIn, Calendar, Tag, CreditCard, DollarSign } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 truncate">
              {receipt.expenseItem || receipt.fileName || 'Receipt Preview'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {receipt.receiptNo ? `Ref: ${receipt.receiptNo} · ` : ''}{receipt.fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Image Display */}
        <div className="flex-1 overflow-auto p-4 bg-slate-900/5 flex items-center justify-center min-h-[250px]">
          {receipt.dataUrl ? (
            <img
              src={receipt.dataUrl}
              alt={receipt.fileName || 'Receipt image'}
              className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200/60 bg-white"
            />
          ) : (
            <div className="text-slate-400 text-sm">No image available</div>
          )}
        </div>

        {/* Footer with key extracted values */}
        <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Date</span>
            <span className="font-semibold text-slate-800 font-mono">{receipt.date || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Receipt #</span>
            <span className="font-semibold text-slate-800 font-mono truncate block">{receipt.receiptNo || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Original Amount</span>
            <span className="font-bold text-slate-900 font-mono">
              {receipt.currency} {receipt.amount || '0.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">SGD Converted</span>
            <span className="font-bold text-sky-600 font-mono">
              SGD ${receipt.amountSgd || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
