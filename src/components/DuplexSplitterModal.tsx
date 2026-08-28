import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Download,
  RotateCw,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import {
  splitPdfForDuplex,
  printPdfBlob,
  openPdfInNewTab,
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
  const [isPrintingFront, setIsPrintingFront] = useState<boolean>(false);
  const [isPrintingBack, setIsPrintingBack] = useState<boolean>(false);
  const [isOpeningTabFront, setIsOpeningTabFront] = useState<boolean>(false);
  const [isOpeningTabBack, setIsOpeningTabBack] = useState<boolean>(false);

  const cleanBaseName = fileName.replace(/\.pdf$/i, '');

  const handlePrintFront = async () => {
    if (!splitResult) return;
    setIsPrintingFront(true);
    try {
      await printPdfBlob(
        splitResult.oddPagesUrl,
        splitResult.oddPagesBlob,
        `${cleanBaseName} - Part 1 (Odd Pages)`
      );
    } catch (err) {
      console.error('Print Front Pages error:', err);
    } finally {
      setIsPrintingFront(false);
    }
  };

  const handlePrintBack = async () => {
    if (!splitResult) return;
    setIsPrintingBack(true);
    try {
      await printPdfBlob(
        splitResult.evenPagesUrl,
        splitResult.evenPagesBlob,
        `${cleanBaseName} - Part 2 (Even Pages)`
      );
    } catch (err) {
      console.error('Print Back Pages error:', err);
    } finally {
      setIsPrintingBack(false);
    }
  };

  const handleOpenTabFront = async () => {
    if (!splitResult) return;
    setIsOpeningTabFront(true);
    try {
      await openPdfInNewTab(
        splitResult.oddPagesUrl,
        splitResult.oddPagesBlob,
        `${cleanBaseName} - Part 1 (Odd Pages)`
      );
    } catch (err) {
      console.error('Open Tab Front error:', err);
    } finally {
      setIsOpeningTabFront(false);
    }
  };

  const handleOpenTabBack = async () => {
    if (!splitResult) return;
    setIsOpeningTabBack(true);
    try {
      await openPdfInNewTab(
        splitResult.evenPagesUrl,
        splitResult.evenPagesBlob,
        `${cleanBaseName} - Part 2 (Even Pages)`
      );
    } catch (err) {
      console.error('Open Tab Back error:', err);
    } finally {
      setIsOpeningTabBack(false);
    }
  };

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <Printer className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100 truncate">
                Manual Duplex Print
              </h2>
              <p className="text-[11px] text-slate-400 truncate" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3">
          {/* Loading state */}
          {isProcessing ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RotateCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">Splitting PDF into odd and even pages...</p>
            </div>
          ) : error ? (
            <div className="py-6 px-3 flex flex-col items-center justify-center text-center space-y-2 bg-slate-950 border border-rose-500/20 rounded-xl">
              <AlertCircle className="w-7 h-7 text-rose-400" />
              <h3 className="text-xs font-semibold text-slate-200">Unable to Split PDF</h3>
              <p className="text-[11px] text-slate-400 max-w-xs">{error}</p>
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-all"
              >
                Retry
              </button>
            </div>
          ) : splitResult ? (
            <>
              {/* Document Summary & 100% Original Quality Guarantee */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Total: <strong className="text-slate-100">{splitResult.totalPages} pg</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span>Front (Odd): <strong className="text-indigo-400">{splitResult.oddCount}</strong></span>
                    <span>•</span>
                    <span>Back (Even): <strong className="text-emerald-400">{splitResult.evenCount}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-1 border-t border-slate-800/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>100% Original Vector & Image Quality Preserved (Zero Loss / No Re-encoding)</span>
                </div>
              </div>

              {/* Printer Feeding Setting: Compact Reverse Toggle */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">
                    Reverse back pages order
                  </span>
                </div>

                <button
                  type="button"
                  id="toggle-reverse-even"
                  role="switch"
                  aria-checked={reverseEvenPages}
                  onClick={() => setReverseEvenPages(!reverseEvenPages)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-0.5 ${
                    reverseEvenPages ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      reverseEvenPages ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Print Action Cards */}
              <div className="space-y-2">
                {/* Part 1: Front Pages (Odd) */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[11px] font-bold">
                        1
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        Part 1: Odd Pages ({splitResult.oddCount})
                      </span>
                    </div>
                    <button
                      onClick={handleOpenTabFront}
                      disabled={isOpeningTabFront}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                      title="Open Part 1 in new tab with print controls"
                    >
                      {isOpeningTabFront ? (
                        <RotateCw className="w-3 h-3 animate-spin text-indigo-400" />
                      ) : (
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                      )}
                      <span className="text-[11px]">{isOpeningTabFront ? 'Opening...' : 'Open Tab'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintFront}
                      disabled={isPrintingFront}
                      className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      {isPrintingFront ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening Printer...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Front Pages</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        downloadPdfBlob(splitResult.oddPagesBlob, `${cleanBaseName}_Part1_OddPages.pdf`)
                      }
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-slate-100 text-xs font-medium rounded-lg flex items-center gap-1 transition-all active:scale-95"
                      title="Download Part 1 PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">Save</span>
                    </button>
                  </div>
                </div>

                {/* Part 2: Back Pages (Even) */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">
                        2
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        Part 2: Even Pages ({splitResult.evenCount})
                        {reverseEvenPages && <span className="text-[10px] text-slate-400 font-normal ml-1">(Reversed)</span>}
                      </span>
                    </div>
                    <button
                      onClick={handleOpenTabBack}
                      disabled={isOpeningTabBack}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                      title="Open Part 2 in new tab with print controls"
                    >
                      {isOpeningTabBack ? (
                        <RotateCw className="w-3 h-3 animate-spin text-emerald-400" />
                      ) : (
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="text-[11px]">{isOpeningTabBack ? 'Opening...' : 'Open Tab'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintBack}
                      disabled={isPrintingBack}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      {isPrintingBack ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening Printer...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Back Pages</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        downloadPdfBlob(splitResult.evenPagesBlob, `${cleanBaseName}_Part2_EvenPages.pdf`)
                      }
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-slate-100 text-xs font-medium rounded-lg flex items-center gap-1 transition-all active:scale-95"
                      title="Download Part 2 PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">Save</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Odd page warning */}
              {splitResult.totalPages % 2 !== 0 && (
                <div className="p-2.5 bg-slate-950/60 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] text-amber-200/90">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Odd total pages ({splitResult.totalPages}). Last page back will be blank.</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            100% local in browser
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-lg text-xs font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

