import React from 'react';
import { User, Building2, Calendar, FileCheck2 } from 'lucide-react';

export default function ClaimDetailsForm({ claimDetails, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...claimDetails,
      [field]: value,
    });
  };

  const isComplete = Boolean(
    claimDetails.staffName?.trim() &&
    claimDetails.department?.trim() &&
    claimDetails.claimPeriod?.trim()
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Claimant & Period Details</h3>
            <p className="text-xs text-slate-500">Stored safely in your browser session for this claim</p>
          </div>
        </div>

        {isComplete ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <FileCheck2 className="w-3 h-3" />
            Completed
          </span>
        ) : (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Required for PDF
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Staff Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Staff Name <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            value={claimDetails.staffName || ''}
            onChange={(e) => handleChange('staffName', e.target.value)}
            placeholder="e.g. Rachel Lim"
            className={`w-full px-3 py-2 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              !claimDetails.staffName?.trim()
                ? 'border-slate-300 focus:border-sky-500 focus:ring-sky-200'
                : 'border-slate-200 focus:border-sky-500 focus:ring-sky-200'
            }`}
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Department <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            value={claimDetails.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="e.g. Sales & Client Success"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-200 transition-all"
          />
        </div>

        {/* Claim Period */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Claim Period <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            value={claimDetails.claimPeriod || ''}
            onChange={(e) => handleChange('claimPeriod', e.target.value)}
            placeholder="e.g. Oct 2026 / Regional Trip"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-200 transition-all"
          />
        </div>

        {/* Submission Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Submission Date</span>
          </label>
          <input
            type="date"
            value={claimDetails.submissionDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => handleChange('submissionDate', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-200 transition-all font-mono"
          />
        </div>
      </div>
    </div>
  );
}
