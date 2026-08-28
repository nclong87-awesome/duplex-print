import React, { useState } from 'react';
import { ExternalLink, Monitor, Eye, Printer, RotateCw } from 'lucide-react';
import { printPdfBlob } from '../utils/pdfDuplexSplitter';

interface PdfNativeViewerProps {
  objectUrl: string;
  fileName: string;
  onSwitchToCanvas: () => void;
}

export const PdfNativeViewer: React.FC<PdfNativeViewerProps> = ({
  objectUrl,
  fileName,
  onSwitchToCanvas,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printPdfBlob(objectUrl, undefined, fileName);
    } catch (err) {
      console.error('Native viewer print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Monitor className="w-3.5 h-3.5 text-amber-400" />
          Native PDF View Mode
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded text-[11px] flex items-center gap-1 shadow-sm font-medium"
          >
            {isPrinting ? (
              <RotateCw className="w-3 h-3 animate-spin" />
            ) : (
              <Printer className="w-3 h-3" />
            )}
            <span>{isPrinting ? 'Opening Printer...' : 'Print'}</span>
          </button>
          <a
            href={objectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onSwitchToCanvas}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1"
          >
            <Eye className="w-3 h-3 text-amber-400" />
            <span>Canvas View</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative bg-slate-900">
        <iframe
          src={objectUrl}
          title={fileName}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};
