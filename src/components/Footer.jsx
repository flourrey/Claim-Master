import React from 'react';
import { ShieldCheck, Cpu, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-16 border-t border-slate-200 bg-white/70 backdrop-blur-xs py-6 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 tracking-tight">Claim Smarter</span>
          <span>·</span>
          <span>Approval-ready expense claims for finance teams</span>
        </div>

        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>Data: Frankfurter</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Receipt reading: Google Gemini</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
