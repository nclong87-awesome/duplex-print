import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Download,
  RotateCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import {
  splitPdfForDuplex,
  printPdfBlob,
  downloadPdfBlob,
  DuplexSplitResult
} from '../utils/pdfDuplexSplitter';

interface DuplexSplitterModalProps {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  onClose: () => void;
}

export const DuplexSplitterModal: React.FC<DuplexSplitterModalProps> = ({
  arrayBuffer,
  fileName,
  onClose,
}) => {
  const [splitResult, setSplitResult] = useState<DuplexSplitResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reverseEvenPages, setReverseEvenPages] = useState<boolean>(true); // Default enabled
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const cleanBaseName = fileName.replace(/\.pdf$/i, '');

  // Process PDF split whenever reverse option changes
  useEffect(() => {
    let active = true;
    setIsProcessing(true);
    setError(null);

    splitPdfForDuplex(arrayBuffer, fileName, { reverseEvenPages })
      .then((res) => {
        if (!active) return;
        setSplitResult(res);
        setIsProcessing(false);
      })
      .catch((err: any) => {
        if (!active) return;
        console.error('Failed to split PDF for duplex:', err);
        setError(err?.message || 'Failed to split PDF document.');
        setIsProcessing(false);
      });

    return () => {
      active = false;
    };
  }, [arrayBuffer, fileName, reverseEvenPages]);

  // Clean up object URLs when unmounting
  useEffect(() => {
    return () => {
      if (splitResult) {
        URL.revokeObjectURL(splitResult.oddPagesUrl);
        URL.revokeObjectURL(splitResult.evenPagesUrl);
      }
    };
  }, [splitResult]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800/90 w-full max-w-lg rounded-2xl flex flex-col shadow-2xl overflow-hidden my-auto transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Manual Duplex Printing
                <span className="text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  2-Step Print
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[280px]" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Workflow Guide Bar */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium text-slate-200">How Manual Duplex Works</span>
              </div>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg transition-colors"
              >
                <span>{showGuide ? 'Hide Instructions' : 'View Instructions'}</span>
                {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showGuide && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-indigo-400">Step 1: Fronts</div>
                  <div className="text-slate-400 leading-snug">Print Part 1 (Odd Pages: 1, 3, 5...).</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-amber-400">Step 2: Flip Stack</div>
                  <div className="text-slate-400 leading-snug">Place printed paper directly back into feed tray.</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400">Step 3: Backs</div>
                  <div className="text-slate-400 leading-snug">Print Part 2 (Even Pages: 2, 4, 6...).</div>
                </div>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RotateCw className="w-7 h-7 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">Splitting PDF into odd and even pages...</p>
            </div>
          ) : error ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950 border border-rose-500/20 rounded-xl">
              <AlertCircle className="w-9 h-9 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-200">Unable to Split PDF</h3>
              <p className="text-xs text-slate-400 max-w-xs">{error}</p>
              <button
                onClick={() => {
                  setIsProcessing(true);
                  setError(null);
                  splitPdfForDuplex(arrayBuffer, fileName, { reverseEvenPages })
                    .then((res) => {
                      setSplitResult(res);
                      setIsProcessing(false);
                    })
                    .catch((err: any) => {
                      setError(err?.message || 'Failed to split PDF document.');
                      setIsProcessing(false);
                    });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
              >
                Retry Splitting
              </button>
            </div>
          ) : splitResult ? (
            <>
              {/* Document Summary Stats Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Total Pages: <strong className="text-slate-100">{splitResult.totalPages}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>Fronts: <strong className="text-indigo-400 font-sans">{splitResult.oddCount}</strong></span>
                  <span>•</span>
                  <span>Backs: <strong className="text-emerald-400 font-sans">{splitResult.evenCount}</strong></span>
                </div>
              </div>

              {/* Printer Feeding Setting: Reverse Back Pages Toggle */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-amber-400 shrink-0" />
                    <label htmlFor="toggle-reverse-even" className="text-xs font-semibold text-slate-200 cursor-pointer">
                      Reverse Back Pages Order
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                    Ensures page 2 prints directly behind page 1 when re-feeding the printed stack face-up into standard printers.
                  </p>
                </div>

                {/* Sleek Toggle Switch */}
                <button
                  type="button"
                  id="toggle-reverse-even"
                  role="switch"
                  aria-checked={reverseEvenPages}
                  onClick={() => setReverseEvenPages(!reverseEvenPages)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 mt-0.5 ${
                    reverseEvenPages ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      reverseEvenPages ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Print Action Cards */}
              <div className="space-y-3">
                {/* Part 1: Front Pages (Odd) */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">
                          Part 1: Front Side (Odd Pages)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {splitResult.oddCount} {splitResult.oddCount === 1 ? 'page' : 'pages'} ({splitResult.oddPagesList.slice(0, 6).join(', ')}{splitResult.oddPagesList.length > 6 ? '...' : ''})
                        </p>
                      </div>
                    </div>

                    <a
                      href={splitResult.oddPagesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-all"
                      title="Preview Part 1 in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Preview</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => printPdfBlob(splitResult.oddPagesUrl)}
                      className="flex-1 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Front Pages</span>
                    </button>

                    <button
                      onClick={() =>
                        downloadPdfBlob(splitResult.oddPagesBlob, `${cleanBaseName}_Part1_OddPages.pdf`)
                      }
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-slate-100 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                      title="Download Part 1 PDF"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline text-xs">Save PDF</span>
                    </button>
                  </div>
                </div>

                {/* Part 2: Back Pages (Even) */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">
                          Part 2: Back Side (Even Pages)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {splitResult.evenCount} {splitResult.evenCount === 1 ? 'page' : 'pages'} ({splitResult.evenPagesList.slice(0, 6).join(', ')}{splitResult.evenPagesList.length > 6 ? '...' : ''})
                          {reverseEvenPages && ' • Reversed'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={splitResult.evenPagesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-all"
                      title="Preview Part 2 in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Preview</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => printPdfBlob(splitResult.evenPagesUrl)}
                      className="flex-1 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Back Pages</span>
                    </button>

                    <button
                      onClick={() =>
                        downloadPdfBlob(splitResult.evenPagesBlob, `${cleanBaseName}_Part2_EvenPages.pdf`)
                      }
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-slate-100 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                      title="Download Part 2 PDF"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline text-xs">Save PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Odd page warning */}
              {splitResult.totalPages % 2 !== 0 && (
                <div className="p-3 bg-slate-950/60 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Document has an odd number of pages ({splitResult.totalPages}). Part 1 has {splitResult.oddCount} pages and Part 2 has {splitResult.evenCount} pages. The final back page will remain blank as expected.
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Processed locally in browser
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-xl font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

