import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { loadPdfDocument, renderPdfPage } from '../utils/pdfRenderer';
import { ViewerState } from '../types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface PdfCanvasViewerProps {
  arrayBuffer: ArrayBuffer;
  state: ViewerState;
  onTotalPagesLoaded: (totalPages: number) => void;
  onPageVisibleChange?: (page: number) => void;
  onSwitchToNative: () => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  arrayBuffer,
  state,
  onTotalPagesLoaded,
  onPageVisibleChange,
  onSwitchToNative,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageRendering, setIsPageRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF document on arrayBuffer change
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setPdfDoc(null);

    loadPdfDocument(arrayBuffer)
      .then((doc) => {
        if (!active) return;
        setPdfDoc(doc);
        onTotalPagesLoaded(doc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load PDF document:', err);
        setError('Could not render PDF with Canvas. Try switching to the Native PDF viewer mode.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [arrayBuffer]);

  // Render single page
  useEffect(() => {
    if (!pdfDoc || state.displayMode !== 'single') return;

    let isSubscribed = true;
    setIsPageRendering(true);

    const targetCanvas = singleCanvasRef.current;
    if (!targetCanvas) return;

    renderPdfPage(pdfDoc, state.currentPage, targetCanvas, state.scale, state.rotation)
      .then(() => {
        if (isSubscribed) setIsPageRendering(false);
      })
      .catch((err) => {
        console.error('Page render error:', err);
        if (isSubscribed) setIsPageRendering(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [pdfDoc, state.currentPage, state.scale, state.rotation, state.displayMode]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full bg-slate-950 overflow-auto flex flex-col items-center justify-start p-4 relative min-h-[400px]"
    >
      {isLoading && (
        <div className="my-auto flex flex-col items-center gap-3 text-slate-400 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-xs font-medium">Loading PDF document...</p>
        </div>
      )}

      {error && (
        <div className="my-auto max-w-xs text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Rendering Error</h3>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button
            onClick={onSwitchToNative}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
          >
            Switch to Native Browser Viewer
          </button>
        </div>
      )}

      {!isLoading && !error && pdfDoc && (
        <div className="flex flex-col items-center w-full my-auto transition-all">
          {state.displayMode === 'single' ? (
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white border border-slate-800 my-auto">
              <canvas ref={singleCanvasRef} className="block max-w-full h-auto" />
              {isPageRendering && (
                <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                </div>
              )}
            </div>
          ) : (
            <ContinuousViewer
              pdfDoc={pdfDoc}
              scale={state.scale}
              rotation={state.rotation}
              onPageVisibleChange={onPageVisibleChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

interface ContinuousViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  scale: number;
  rotation: number;
  onPageVisibleChange?: (page: number) => void;
}

const ContinuousViewer: React.FC<ContinuousViewerProps> = ({
  pdfDoc,
  scale,
  rotation,
  onPageVisibleChange,
}) => {
  const totalPages = pdfDoc.numPages;

  return (
    <div className="flex flex-col items-center gap-4 w-full py-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <ContinuousPageCanvas
          key={pageNum}
          pdfDoc={pdfDoc}
          pageNum={pageNum}
          scale={scale}
          rotation={rotation}
        />
      ))}
    </div>
  );
};

interface ContinuousPageCanvasProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  scale: number;
  rotation: number;
}

const ContinuousPageCanvas: React.FC<ContinuousPageCanvasProps> = ({
  pdfDoc,
  pageNum,
  scale,
  rotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    if (canvasRef.current) {
      renderPdfPage(pdfDoc, pageNum, canvasRef.current, scale, rotation)
        .then(() => {
          if (isSubscribed) setRendered(true);
        })
        .catch((err) => console.error(`Error rendering page ${pageNum}:`, err));
    }

    return () => {
      isSubscribed = false;
    };
  }, [pdfDoc, pageNum, scale, rotation]);

  return (
    <div className="relative shadow-xl rounded-lg overflow-hidden bg-white border border-slate-800">
      <canvas ref={canvasRef} className="block max-w-full h-auto" />
      <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
        Page {pageNum}
      </div>
    </div>
  );
};
