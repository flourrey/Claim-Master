import React, { useState } from 'react';
import ReceiptCard from './ReceiptCard';
import { Layers, AlertTriangle, CheckCircle2, FileText, Trash } from 'lucide-react';

export default function ReceiptList({
  receipts,
  onRemoveReceipt,
  onClearAll,
  onViewImage,
  onSelectForReview,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'needs_look' | 'ready' | 'failed'

  if (!receipts || receipts.length === 0) {
    return null;
  }

  const counts = {
    all: receipts.length,
    needs_look: receipts.filter((r) => r.status === 'needs_look').length,
    ready: receipts.filter((r) => r.status === 'ready').length,
    reading: receipts.filter((r) => r.status === 'reading').length,
    failed: receipts.filter((r) => r.status === 'failed').length,
  };

  const filteredReceipts = receipts.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="w-full space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <span>Uploaded Receipts ({receipts.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.needs_look > 0 ? (
              <span className="text-amber-700 font-medium">
                ⚠️ {counts.needs_look} receipt{counts.needs_look > 1 ? 's' : ''} require attention before claim PDF can be generated.
              </span>
            ) : counts.reading > 0 ? (
              <span className="text-blue-600 font-medium">
                Scanning in progress ({counts.reading} remaining)...
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">
                ✓ All {counts.ready} receipts verified and ready.
              </span>
            )}
          </p>
        </div>

        {/* Filters and Batch Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              All ({counts.all})
            </button>

            {counts.needs_look > 0 && (
              <button
                type="button"
                onClick={() => setFilter('needs_look')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filter === 'needs_look'
                    ? 'bg-amber-100 text-amber-900 shadow-xs font-semibold'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Needs look ({counts.needs_look})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilter('ready')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === 'ready'
                  ? 'bg-emerald-100 text-emerald-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Ready ({counts.ready})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear all receipts"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Receipt Cards */}
      {filteredReceipts.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No receipts matching this filter</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-2 text-xs text-sky-600 hover:underline"
          >
            Show all {receipts.length} receipts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredReceipts.map((receipt) => {
            const originalIndex = receipts.findIndex((r) => r.id === receipt.id);
            return (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                index={originalIndex >= 0 ? originalIndex : 0}
                onRemove={onRemoveReceipt}
                onViewImage={onViewImage}
                onSelectForReview={onSelectForReview}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
