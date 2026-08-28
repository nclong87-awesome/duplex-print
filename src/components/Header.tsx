import React from 'react';
import { FileUp, FolderOpen, FileText, Printer, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentFileName?: string;
  pdfCount: number;
  hasActiveDoc: boolean;
  onOpenUpload: () => void;
  onOpenLibrary: () => void;
  onOpenDuplexModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFileName,
  pdfCount,
  hasActiveDoc,
  onOpenUpload,
  onOpenLibrary,
  onOpenDuplexModal,
}) => {
  return (
    <header id="mobile-app-header" className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Branding & Primary Nav Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Left: App Logo & Catchy Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-gradient-to-br from-red-600 via-amber-600 to-amber-500 p-2 rounded-xl text-white shrink-0 shadow-md flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-slate-100 tracking-tight truncate">
                DuplexPrint
              </h1>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                2-Sided
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Double-Sided Print Helper
            </p>
          </div>
        </div>

        {/* Right Header Navigation Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-open-library"
            onClick={onOpenLibrary}
            className="relative flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium rounded-xl transition-all border border-slate-700/80"
            title="Stored Documents"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden xs:inline">Files</span>
            {pdfCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center -mr-0.5 shadow-sm">
                {pdfCount}
              </span>
            )}
          </button>

          <button
            id="btn-upload-header"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Active Document Sub-Bar with Direct Duplex Printing Action */}
      {hasActiveDoc && (
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-4 h-4 text-red-400 shrink-0" />
            <span
              className="font-medium text-slate-200 truncate max-w-[170px] xs:max-w-[210px]"
              title={currentFileName}
            >
              {currentFileName || 'Loaded Document'}
            </span>
          </div>

          <button
            id="btn-open-duplex-header"
            onClick={onOpenDuplexModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 border border-amber-400/40 shrink-0"
            title="Split PDF into Odd & Even pages for double-sided printing"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Duplex Split</span>
          </button>
        </div>
      )}
    </header>
  );
};


