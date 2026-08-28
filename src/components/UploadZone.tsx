import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, HardDrive } from 'lucide-react';
import { formatFileSize } from '../utils/pdfStorage';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onClose?: () => void;
  isCompact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onClose,
  isCompact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF file (.pdf)');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('File size is very large (max 100MB supported)');
      return;
    }
    setSelectedFileName(file.name);
    onFileSelected(file);
    if (onClose) onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        id="pdf-file-input"
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        id="upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-red-500 bg-red-500/10 scale-[0.99]'
            : 'border-slate-700 hover:border-red-500/60 bg-slate-800/60 hover:bg-slate-800'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Upload PDF from Local Storage
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tap to browse files or drag & drop a PDF document
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Select from device storage, downloads, or files</span>
          </div>

          <button
            type="button"
            id="btn-browse-pdf"
            className="mt-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
          >
            Choose PDF File
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {selectedFileName && !errorMessage && (
        <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="truncate">Loaded: {selectedFileName}</span>
        </div>
      )}
    </div>
  );
};
