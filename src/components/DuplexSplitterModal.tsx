import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Download,
  RotateCw,
  Info,
  CheckCircle2,
  ArrowRight,
  Layers,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
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
  const [reverseEvenPages, setReverseEvenPages] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showGuide, setShowGuide] = useState<boolean>(true);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Manual Duplex Print Splitter
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-1.5 py-0.2 rounded font-mono font-normal">
                  2-File Split
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* How It Works Banner */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">
                    Perfect for single-sided printers
                  </p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Splits your document into <strong className="text-red-400">Odd Pages (Front)</strong> and{' '}
                    <strong className="text-blue-400">Even Pages (Back)</strong>. Print Part 1 first, re-insert the paper stack, and print Part 2.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 shrink-0 bg-slate-800 px-2 py-1 rounded"
              >
                <span>Guide</span>
                {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Step-by-Step Folding/Feeding Guide */}
            {showGuide && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div
                  onClick={() => setActiveStep(1)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    activeStep === 1
                      ? 'bg-red-950/40 border-red-500/50 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-red-400 mb-0.5">1. Print Part 1</div>
                  <div className="text-[10px] text-slate-400">Print odd pages (1, 3, 5...)</div>
                </div>

                <div
                  onClick={() => setActiveStep(2)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    activeStep === 2
                      ? 'bg-amber-950/40 border-amber-500/50 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-amber-400 mb-0.5">2. Flip Stack</div>
                  <div className="text-[10px] text-slate-400">Place printed pages back in feed tray</div>
                </div>

                <div
                  onClick={() => setActiveStep(3)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    activeStep === 3
                      ? 'bg-blue-950/40 border-blue-500/50 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-blue-400 mb-0.5">3. Print Part 2</div>
                  <div className="text-[10px] text-slate-400">Print even pages (2, 4, 6...)</div>
                </div>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RotateCw className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-xs">Analyzing PDF structure and separating odd/even pages...</p>
            </div>
          ) : error ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950 border border-red-900/40 rounded-xl">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <h3 className="text-sm font-bold text-slate-200">Unable to Split PDF</h3>
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
              {/* Document Overview Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total Pages</span>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">{splitResult.totalPages}</p>
                </div>
                <div className="bg-slate-950 border border-red-900/40 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Odd (Front)</span>
                  <p className="text-lg font-bold text-red-400 mt-0.5">{splitResult.oddCount} <span className="text-xs font-normal text-slate-400">pgs</span></p>
                </div>
                <div className="bg-slate-950 border border-blue-900/40 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] uppercase tracking-wider text-blue-400 font-medium">Even (Back)</span>
                  <p className="text-lg font-bold text-blue-400 mt-0.5">{splitResult.evenCount} <span className="text-xs font-normal text-slate-400">pgs</span></p>
                </div>
              </div>

              {/* Printer Feeding Option: Reverse Order toggle */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <RotateCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <label htmlFor="toggle-reverse-even" className="text-xs font-semibold text-slate-200 cursor-pointer">
                      Reverse Back Pages (Even Pages) Order
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Turn ON if your printer outputs pages face-up or last-page first, so page 2 aligns directly behind page 1.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  id="toggle-reverse-even"
                  checked={reverseEvenPages}
                  onChange={(e) => setReverseEvenPages(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-800 border-slate-700 shrink-0 cursor-pointer"
                />
              </div>

              {/* Two Split File Cards */}
              <div className="space-y-3">
                {/* Part 1: Front Pages (Odd) */}
                <div className="bg-slate-950 border border-red-900/40 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          Part 1: Front Side (Odd Pages)
                          <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-normal">
                            {splitResult.oddCount} Pages
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Pages: {splitResult.oddPagesList.slice(0, 8).join(', ')}
                          {splitResult.oddPagesList.length > 8 && ' ...'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={splitResult.oddPagesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                      title="Preview Part 1 in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Preview</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveStep(2);
                        printPdfBlob(splitResult.oddPagesUrl);
                      }}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Front Pages</span>
                    </button>

                    <button
                      onClick={() =>
                        downloadPdfBlob(splitResult.oddPagesBlob, `${cleanBaseName}_Part1_OddPages.pdf`)
                      }
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                      title="Save Part 1 PDF file"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">Save PDF</span>
                    </button>
                  </div>
                </div>

                {/* Part 2: Back Pages (Even) */}
                <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          Part 2: Back Side (Even Pages)
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-normal">
                            {splitResult.evenCount} Pages
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Pages: {splitResult.evenPagesList.slice(0, 8).join(', ')}
                          {splitResult.evenPagesList.length > 8 && ' ...'}
                          {reverseEvenPages && ' (Reversed)'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={splitResult.evenPagesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                      title="Preview Part 2 in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Preview</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveStep(3);
                        printPdfBlob(splitResult.evenPagesUrl);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Back Pages</span>
                    </button>

                    <button
                      onClick={() =>
                        downloadPdfBlob(splitResult.evenPagesBlob, `${cleanBaseName}_Part2_EvenPages.pdf`)
                      }
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                      title="Save Part 2 PDF file"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">Save PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notice / Tip for odd total page count */}
              {splitResult.totalPages % 2 !== 0 && (
                <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-start gap-2 text-[11px] text-amber-200">
                  <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>Odd total pages ({splitResult.totalPages} pages):</strong> Part 1 has {splitResult.oddCount} pages and Part 2 has {splitResult.evenCount} pages. The final back side will remain blank as expected.
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Processed 100% locally in browser
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
