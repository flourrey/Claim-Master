import React, { useState } from 'react';
import { COMPANY_PERSONNEL } from '../lib/personnel';
import { 
  Receipt, 
  ArrowRight, 
  ShieldCheck, 
  Info, 
  Utensils, 
  Cpu, 
  CheckCircle2, 
  Lock
} from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('joern');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectAndLogin = (personnel) => {
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(personnel);
    }, 250);
  };

  const selectedPerson = COMPANY_PERSONNEL.find((p) => p.id === selectedPersonnelId) || COMPANY_PERSONNEL[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased text-slate-800">
      {/* Brand Header */}
      <div className="max-w-md mx-auto w-full pt-6 pb-2 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20 mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Claim Smarter
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Staff Expense Portal & Policy Compliance
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900">Staff Sign In</h2>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
              Demo Access
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Select a staff profile below to test department-specific receipt claiming rules.
          </p>
        </div>

        {/* Personnel Profiles List */}
        <div className="space-y-3">
          {COMPANY_PERSONNEL.map((person) => {
            const isSelected = selectedPersonnelId === person.id;
            const isSales = person.department === 'Sales';

            return (
              <div
                key={person.id}
                onClick={() => setSelectedPersonnelId(person.id)}
                className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50/40 shadow-sm ring-4 ring-sky-100/70'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                    {person.avatar}
                  </div>

                  {/* Info & Policy Badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{person.name}</h3>
                        <span className="text-xs text-slate-400">({person.fullName})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${person.badgeColor}`}>
                        {person.department}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 truncate">{person.title}</p>

                    {/* Department Guideline Rule Pill */}
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/80">
                      {isSales ? (
                        <>
                          <Utensils className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Claims: <strong className="text-indigo-900">Meals Only</strong></span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Claims: <strong className="text-emerald-900">Materials Only</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Radio selection check */}
                <div className="absolute top-4 right-4">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Company Guidelines Summary Callout */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span>Company Expense Guidelines:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded-xl bg-white border border-indigo-100">
              <span className="font-semibold text-indigo-900 block">Sales (Joern)</span>
              <span className="text-slate-500">Only Meals & Hospitality claims will be approved.</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-emerald-100">
              <span className="font-semibold text-emerald-900 block">R&D (Jiatong)</span>
              <span className="text-slate-500">Only Materials & Hardware claims will be approved.</span>
            </div>
          </div>
        </div>

        {/* Login Action Button */}
        <button
          type="button"
          onClick={() => handleSelectAndLogin(selectedPerson)}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-lg transition-all cursor-pointer ring-4 ring-sky-100"
        >
          <span>Continue as {selectedPerson.name} ({selectedPerson.department})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="max-w-md mx-auto w-full py-4 text-center text-xs text-slate-400">
        <span>Corporate Single Sign-On · Mock Environment</span>
      </div>
    </div>
  );
}
