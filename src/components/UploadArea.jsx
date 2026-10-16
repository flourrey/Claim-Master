import React, { useRef, useState } from 'react';
import { Upload, FileUp, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function UploadArea({ onFilesSelected, onLoadSamples, isProcessing }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFileList = (files) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    const validFiles = [];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.pdf', '.webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const isAcceptedType = validExtensions.includes(ext) || file.type.startsWith('image/') || file.type === 'application/pdf';

      if (isAcceptedType) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Please upload receipt images in JPG, PNG, HEIC, or PDF format.');
      return;
    }

    onFilesSelected(validFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      processFileList(e.target.files);
      // Reset input value so same files can be re-uploaded if needed
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-sky-500 bg-sky-50/70 shadow-lg ring-4 ring-sky-100 scale-[1.01]'
            : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.heic,.pdf,.webp,image/*,application/pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
          <div
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all ${
              isDragOver
                ? 'bg-sky-600 text-white scale-110 shadow-md shadow-sky-200'
                : 'bg-sky-50 text-sky-600 group-hover:bg-sky-100 group-hover:scale-105'
            }`}
          >
            <Upload className="w-7 h-7 md:w-8 md:h-8" />
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold text-slate-800">
              Tap to snap or upload receipts
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Drag & drop multiple files or select from your gallery / files
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>JPG, PNG, HEIC, or PDF · Multi-file supported</span>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-sky-600 font-medium text-sm">
              <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <span>Scanning receipts...</span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick helper action to load samples */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
        <span>No receipts right now?</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLoadSamples();
          }}
          className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium hover:underline bg-sky-50/80 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Load 3 Demo Receipts
        </button>
      </div>
    </div>
  );
}
