import React, { useState, useEffect, useRef } from 'react';
import UploadArea from './components/UploadArea';
import ReceiptList from './components/ReceiptList';
import ClaimDetailsForm from './components/ClaimDetailsForm';
import ReviewTable from './components/ReviewTable';
import ClaimPdfButton from './components/ClaimPdfButton';
import Footer from './components/Footer';
import ReceiptModal from './components/ReceiptModal';
import { 
  parseReceiptImage, 
  getSampleReceipts, 
  generateId, 
  fetchExchangeRate 
} from './lib/api';
import { 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileText, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const LOCAL_STORAGE_KEY_DETAILS = 'claim_smarter_details_v1';
const LOCAL_STORAGE_KEY_RECEIPTS = 'claim_smarter_receipts_v1';

export default function App() {
  // Step / Active Tab state for mobile-friendly navigation
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'review'

  // Claim details stored in browser (staff name, department, claim period, submission date)
  const [claimDetails, setClaimDetails] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DETAILS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read claim details from localStorage');
    }
    return {
      staffName: 'Tan Wei Ming',
      department: 'Client Solutions & Growth',
      claimPeriod: 'October 2026',
      submissionDate: new Date().toISOString().split('T')[0],
    };
  });

  // Receipts list
  const [receipts, setReceipts] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RECEIPTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read receipts from localStorage');
    }
    // Default with high-fidelity sample receipts so app is instantly alive
    return getSampleReceipts();
  });

  // Processing indicator
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);

  // Selected receipt for high-res preview modal
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Save claim details to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DETAILS, JSON.stringify(claimDetails));
    } catch (e) {
      console.warn('Failed to save claim details to localStorage');
    }
  }, [claimDetails]);

  // Save receipts to localStorage (strip heavy blobs if needed, or store dataUrls)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
    } catch (e) {
      console.warn('LocalStorage limit for receipts, keeping in memory state');
    }
  }, [receipts]);

  // Handle uploading files
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;

    setIsProcessingUploads(true);

    // Create immediate placeholder entries in 'reading' status for instant responsive UI
    const pendingReceipts = Array.from(files).map((file) => ({
      id: generateId(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      dataUrl: null,
      status: 'reading',
      date: new Date().toISOString().split('T')[0],
      receiptNo: '',
      expenseItem: '',
      currency: 'SGD',
      amount: '',
      rate: 1.0,
      amountSgd: '',
      confidence: 0,
      error: null,
      _file: file,
    }));

    setReceipts((prev) => [...prev, ...pendingReceipts]);

    // Process each file
    for (const pending of pendingReceipts) {
      try {
        const parsed = await parseReceiptImage(pending._file);
        setReceipts((prev) =>
          prev.map((item) => (item.id === pending.id ? { ...parsed, id: pending.id } : item))
        );
      } catch (err) {
        console.error('Error parsing file:', err);
        setReceipts((prev) =>
          prev.map((item) =>
            item.id === pending.id
              ? {
                  ...item,
                  status: 'failed',
                  error: 'Failed to process receipt image. Please try again.',
                }
              : item
          )
        );
      }
    }

    setIsProcessingUploads(false);
  };

  // Load sample demo receipts
  const handleLoadSamples = () => {
    const samples = getSampleReceipts();
    setReceipts(samples);
  };

  // Clear all receipts
  const handleClearAll = () => {
    if (confirm('Clear all uploaded receipts?')) {
      setReceipts([]);
    }
  };

  // Remove single receipt
  const handleRemoveReceipt = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  // Update receipt fields from table
  const handleUpdateReceipt = (id, updatedFields) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
  };

  // Add manual row
  const handleAddManualRow = () => {
    const newRow = {
      id: generateId(),
      fileName: 'Manual Entry',
      fileSize: 0,
      fileType: 'manual',
      dataUrl: null,
      status: 'needs_look',
      date: new Date().toISOString().split('T')[0],
      receiptNo: '',
      expenseItem: '',
      currency: 'SGD',
      amount: '',
      rate: 1.0,
      amountSgd: '',
      confidence: 1.0,
      error: null,
    };
    setReceipts((prev) => [...prev, newRow]);
    setActiveTab('review');
  };

  // Summary counts
  const totalSgd = receipts.reduce((acc, curr) => {
    const val = parseFloat(curr.amountSgd);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const needsLookCount = receipts.filter((r) => r.status === 'needs_look').length;
  const readyCount = receipts.filter((r) => r.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Claim Smarter
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 tracking-wide uppercase">
                  Step 1 Front End
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Approval-ready expense claims for finance
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Total SGD
              </span>
              <span className="text-base font-bold font-mono text-slate-900">
                ${totalSgd.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
              title="Reset with 3 demo receipts"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Demo Receipts</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Upload & Cards ({receipts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'review'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Review Table & PDF</span>
            {needsLookCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Status Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Claim Processing Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Upload multiple receipts, verify SGD currency conversions, and export an approval-ready PDF form.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 mr-1.5">Receipts:</span>
              <strong className="text-slate-800 font-mono">{receipts.length}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="text-emerald-600 mr-1.5">Ready:</span>
              <strong className="font-mono">{readyCount}</strong>
            </div>

            {needsLookCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <span className="text-amber-600 mr-1.5">Needs look:</span>
                <strong className="font-mono">{needsLookCount}</strong>
              </div>
            )}

            <div className="px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 font-bold">
              <span>Total: </span>
              <span className="font-mono text-sky-700">
                SGD ${totalSgd.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Claim Details Form (Stored in browser) */}
        <ClaimDetailsForm
          claimDetails={claimDetails}
          onChange={setClaimDetails}
        />

        {/* Tab 1: Upload & Receipts Cards */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <UploadArea
              onFilesSelected={handleFilesSelected}
              onLoadSamples={handleLoadSamples}
              isProcessing={isProcessingUploads}
            />

            {/* Receipt Cards List */}
            <ReceiptList
              receipts={receipts}
              onRemoveReceipt={handleRemoveReceipt}
              onClearAll={handleClearAll}
              onViewImage={(rcpt) => setPreviewReceipt(rcpt)}
              onSelectForReview={(rcpt) => {
                setActiveTab('review');
              }}
            />

            {receipts.length > 0 && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <span>Proceed to Review Table</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Review Table & Claim PDF */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {/* Review Table Component */}
            <ReviewTable
              receipts={receipts}
              onUpdateReceipt={handleUpdateReceipt}
              onDeleteReceipt={handleRemoveReceipt}
              onAddManualRow={handleAddManualRow}
              onViewImage={(rcpt) => setPreviewReceipt(rcpt)}
            />

            {/* Claim PDF Download Gate */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
              <div className="text-center max-w-lg mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Generate Approval-Ready Claim PDF
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Produces an official claim document with Page 1 summary lines, SGD totals, sign-off blocks, followed by full voucher receipt attachments.
                </p>
              </div>

              <ClaimPdfButton
                claimDetails={claimDetails}
                receipts={receipts}
              />
            </div>
          </div>
        )}
      </main>

      {/* High-res Image Zoom Modal */}
      {previewReceipt && (
        <ReceiptModal
          receipt={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
