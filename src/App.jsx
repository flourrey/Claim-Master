import React, { useState, useEffect } from 'react';
import UploadArea from './components/UploadArea';
import ReceiptList from './components/ReceiptList';
import ClaimDetailsForm from './components/ClaimDetailsForm';
import ReviewTable from './components/ReviewTable';
import ClaimPdfButton from './components/ClaimPdfButton';
import Footer from './components/Footer';
import ReceiptModal from './components/ReceiptModal';
import LoginPage from './components/LoginPage';
import TalkToUs from './components/TalkToUs';
import { COMPANY_PERSONNEL } from './lib/personnel';
import { 
  parseReceiptImage, 
  getSampleReceipts, 
  generateId, 
} from './lib/api';
import { 
  Receipt, 
  Layers, 
  FileText, 
  ArrowRight, 
  RotateCcw,
  LogOut,
  UserCheck,
  Utensils,
  Cpu,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

const LOCAL_STORAGE_KEY_DETAILS = 'claim_smarter_details_v1';
const LOCAL_STORAGE_KEY_RECEIPTS = 'claim_smarter_receipts_v1';
const LOCAL_STORAGE_KEY_USER = 'claim_smarter_user_v1';

export default function App() {
  // Current logged in user (null = show login page)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read user from localStorage');
    }
    // Default logged in as Joern (Sales) for quick access
    return COMPANY_PERSONNEL[0];
  });

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
      staffName: 'Joern',
      department: 'Sales',
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
    return getSampleReceipts();
  });

  // Processing indicator
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);

  // Selected receipt for high-res preview modal
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Quick switch dropdown toggle
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  // Save current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
      }
    } catch (e) {
      console.warn('Failed to save user to localStorage');
    }
  }, [currentUser]);

  // Sync claim details when switching user
  const handleUserLogin = (user) => {
    setCurrentUser(user);
    setClaimDetails((prev) => ({
      ...prev,
      staffName: user.name,
      department: user.department,
    }));
    setShowSwitchMenu(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowSwitchMenu(false);
  };

  // Save claim details to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DETAILS, JSON.stringify(claimDetails));
    } catch (e) {
      console.warn('Failed to save claim details to localStorage');
    }
  }, [claimDetails]);

  // Save receipts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
    } catch (e) {
      console.warn('LocalStorage limit for receipts');
    }
  }, [receipts]);

  // Handle uploading files
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;

    setIsProcessingUploads(true);

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

  const handleLoadSamples = () => {
    const samples = getSampleReceipts();
    setReceipts(samples);
  };

  const handleClearAll = () => {
    if (confirm('Clear all uploaded receipts?')) {
      setReceipts([]);
    }
  };

  const handleRemoveReceipt = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateReceipt = (id, updatedFields) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
  };

  const handleAddManualRow = () => {
    const defaultItem = currentUser?.department === 'Sales' ? 'Client Business Lunch' : 'Electronic Components & Hardware';
    const newRow = {
      id: generateId(),
      fileName: 'Manual Entry',
      fileSize: 0,
      fileType: 'manual',
      dataUrl: null,
      status: 'needs_look',
      date: new Date().toISOString().split('T')[0],
      receiptNo: '',
      expenseItem: defaultItem,
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

  // If not logged in, render the sleek login screen
  if (!currentUser) {
    return <LoginPage onLogin={handleUserLogin} />;
  }

  const isSales = currentUser.department === 'Sales';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Claim Smarter
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 tracking-wide uppercase">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Approval-ready expense claims for finance
              </p>
            </div>
          </div>

          {/* User Profile & Policy Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Switch Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
                title="Switch staff account"
              >
                <span className="text-base">{currentUser.avatar}</span>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-slate-900 block leading-tight">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal block leading-tight">
                    {currentUser.department} ({isSales ? 'Meals' : 'Materials'})
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Company Personnel List
                    </span>
                  </div>
                  <div className="py-1 space-y-1">
                    {COMPANY_PERSONNEL.map((person) => {
                      const isActive = person.id === currentUser.id;
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => handleUserLogin(person)}
                          className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                            isActive ? 'bg-sky-50 text-sky-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{person.avatar}</span>
                            <div>
                              <span className="block font-semibold">{person.name}</span>
                              <span className="text-[10px] text-slate-500">
                                {person.department} · {person.department === 'Sales' ? 'Claims Meals' : 'Claims Materials'}
                              </span>
                            </div>
                          </div>
                          {isActive && <UserCheck className="w-4 h-4 text-sky-600" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1 border-t border-slate-100 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full p-2 text-left rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out to Login Page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Demo Reset */}
            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              title="Reset with 3 demo receipts"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Reset Demo</span>
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

          <button
            type="button"
            onClick={() => setActiveTab('talk')}
            className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'talk'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>3. Talk to Us</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {activeTab !== 'talk' && (
          <>
            {/* Department Policy Guideline Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${
                  isSales ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  {isSales ? <Utensils className="w-5 h-5 text-indigo-600" /> : <Cpu className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Department Guideline:</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentUser.badgeColor}`}>
                      {currentUser.department}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                    {isSales ? (
                      <><strong>{currentUser.name}</strong> can only claim <span className="text-indigo-600 underline">Meals & Hospitality</span>.</>
                    ) : (
                      <><strong>{currentUser.name}</strong> can only claim <span className="text-emerald-600 underline">Materials & Hardware</span>.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Switch persona:</span>
                <button
                  type="button"
                  onClick={() => handleUserLogin(isSales ? COMPANY_PERSONNEL[1] : COMPANY_PERSONNEL[0])}
                  className="font-semibold text-sky-600 hover:text-sky-700 hover:underline bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200"
                >
                  Test as {isSales ? 'Jiatong (R&D)' : 'Joern (Sales)'}
                </button>
              </div>
            </div>

            {/* Claim Details Form */}
            <ClaimDetailsForm
              claimDetails={claimDetails}
              onChange={setClaimDetails}
            />
          </>
        )}

        {/* Tab 1: Upload & Receipts Cards */}
        {activeTab === 'upload' && (
          <div className="space-y-5">
            {/* Upload Area */}
            <UploadArea
              onFilesSelected={handleFilesSelected}
              onLoadSamples={handleLoadSamples}
              isProcessing={isProcessingUploads}
            />

            {/* Receipt Cards List with policy check */}
            <ReceiptList
              receipts={receipts}
              currentUser={currentUser}
              onRemoveReceipt={handleRemoveReceipt}
              onClearAll={handleClearAll}
              onViewImage={(rcpt) => setPreviewReceipt(rcpt)}
              onSelectForReview={() => setActiveTab('review')}
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
          <div className="space-y-5">
            {/* Review Table Component with policy check */}
            <ReviewTable
              receipts={receipts}
              currentUser={currentUser}
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
                  Produces an official claim document with Page 1 summary lines for claimant <strong>{currentUser.name} ({currentUser.department})</strong> followed by voucher receipts.
                </p>
              </div>

              <ClaimPdfButton
                claimDetails={claimDetails}
                receipts={receipts}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Talk to Us (Disqus Community Forum) */}
        {activeTab === 'talk' && (
          <TalkToUs currentUser={currentUser} />
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
