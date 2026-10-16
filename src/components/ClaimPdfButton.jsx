import React, { useState } from 'react';
import { FileDown, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { generateClaimPdf } from '../lib/pdf';

export default function ClaimPdfButton({ claimDetails, receipts }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Validation rules
  const hasReceipts = receipts && receipts.length > 0;
  
  const incompleteDetails = [];
  if (!claimDetails.staffName?.trim()) incompleteDetails.push('Staff Name');
  if (!claimDetails.department?.trim()) incompleteDetails.push('Department');
  if (!claimDetails.claimPeriod?.trim()) incompleteDetails.push('Claim Period');

  const incompleteRows = receipts.filter((r) => {
    return (
      !r.date?.trim() ||
      !r.receiptNo?.trim() ||
      !r.expenseItem?.trim() ||
      !r.amount ||
      isNaN(parseFloat(r.amount)) ||
      !r.amountSgd ||
      isNaN(parseFloat(r.amountSgd))
    );
  });

  const isReadingRows = receipts.some((r) => r.status === 'reading');

  // Button disabled conditions
  const isReady = hasReceipts && incompleteDetails.length === 0 && incompleteRows.length === 0 && !isReadingRows;

  const handleGeneratePdf = async () => {
    if (!isReady || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await generateClaimPdf({
        claimDetails,
        receipts,
      });
      setSuccessMessage('Claim PDF downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setErrorMessage(err?.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col items-center space-y-2">
        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={!isReady || isGenerating}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md ${
            isReady && !isGenerating
              ? 'bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white shadow-sky-200 hover:shadow-lg cursor-pointer ring-4 ring-sky-100'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Building Claim PDF...</span>
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5" />
              <span>Create Claim PDF</span>
            </>
          )}
        </button>

        {/* Validation reason hints if disabled */}
        {!isReady && (
          <div className="text-center text-xs text-slate-500 flex items-start justify-center gap-1.5 px-4">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              {!hasReceipts ? (
                'Upload at least one receipt to create a claim.'
              ) : isReadingRows ? (
                'Please wait for receipt reading to complete.'
              ) : incompleteDetails.length > 0 ? (
                <>Missing claim details: <strong className="text-slate-700">{incompleteDetails.join(', ')}</strong>.</>
              ) : incompleteRows.length > 0 ? (
                <>Complete all fields in <strong className="text-amber-700">{incompleteRows.length} receipt line{incompleteRows.length > 1 ? 's' : ''}</strong> above.</>
              ) : null}
            </span>
          </div>
        )}

        {/* Success toast */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error toast */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
