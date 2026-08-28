import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Columns,
  Layers,
  Monitor,
  Eye,
  Printer,
} from 'lucide-react';
import { ViewerState } from '../types';

interface PdfViewerControlsProps {
  state: ViewerState;
  onPageChange: (newPage: number) => void;
  onScaleChange: (newScale: number) => void;
  onRotate: () => void;
  onDisplayModeChange: (mode: 'single' | 'continuous') => void;
  onViewModeChange: (mode: 'canvas' | 'native') => void;
  onOpenDuplexSplitter: () => void;
}

export const PdfViewerControls: React.FC<PdfViewerControlsProps> = ({
  state,
  onPageChange,
  onScaleChange,
  onRotate,
  onDisplayModeChange,
  onViewModeChange,
  onOpenDuplexSplitter,
}) => {
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPageVal, setInputPageVal] = useState(state.currentPage.toString());

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPageVal, 10);
    if (!isNaN(p) && p >= 1 && p <= state.totalPages) {
      onPageChange(p);
    } else {
      setInputPageVal(state.currentPage.toString());
    }
    setIsEditingPage(false);
  };

  return (
    <div className="bg-slate-900 border-t sm:border-t-0 sm:border-b border-slate-800 p-2.5 px-3 shadow-lg z-20">
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-md mx-auto">
        {/* Page Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="btn-prev-page"
            disabled={state.currentPage <= 1}
            onClick={() => onPageChange(state.currentPage - 1)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {isEditingPage ? (
            <form onSubmit={handlePageSubmit} className="flex items-center">
              <input
                type="number"
                min={1}
                max={state.totalPages}
                value={inputPageVal}
                onChange={(e) => setInputPageVal(e.target.value)}
                onBlur={handlePageSubmit}
                autoFocus
                className="w-10 text-center bg-slate-800 text-slate-100 text-xs py-0.5 rounded border border-red-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 px-1">/ {state.totalPages}</span>
            </form>
          ) : (
            <button
              id="btn-jump-page"
              onClick={() => {
                setInputPageVal(state.currentPage.toString());
                setIsEditingPage(true);
              }}
              className="text-xs font-mono font-medium text-slate-200 px-2 py-0.5 hover:bg-slate-800 rounded transition-colors"
              title="Click to jump to page"
            >
              {state.currentPage} <span className="text-slate-500 font-normal">/ {state.totalPages}</span>
            </button>
          )}

          <button
            id="btn-next-page"
            disabled={state.currentPage >= state.totalPages}
            onClick={() => onPageChange(state.currentPage + 1)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Action Toolbar */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="btn-zoom-out"
            onClick={() => onScaleChange(Math.max(0.5, state.scale - 0.25))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            id="btn-zoom-reset"
            onClick={() => onScaleChange(1.0)}
            className="text-[11px] font-mono text-slate-300 px-1.5 py-0.5 hover:bg-slate-800 rounded"
            title="Reset Zoom"
          >
            {Math.round(state.scale * 100)}%
          </button>

          <button
            id="btn-zoom-in"
            onClick={() => onScaleChange(Math.min(3.0, state.scale + 0.25))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            id="btn-rotate-pdf"
            onClick={onRotate}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Display / Viewer Mode Toggles & Duplex Split */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="btn-duplex-split-toolbar"
            onClick={onOpenDuplexSplitter}
            className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            title="Split PDF for manual double-sided printing"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Duplex Split</span>
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            id="btn-mode-single"
            onClick={() => onDisplayModeChange('single')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              state.displayMode === 'single'
                ? 'bg-slate-800 text-red-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Single Page View"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            id="btn-mode-continuous"
            onClick={() => onDisplayModeChange('continuous')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              state.displayMode === 'continuous'
                ? 'bg-slate-800 text-red-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Continuous Scroll View"
          >
            <Columns className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            id="btn-view-toggle"
            onClick={() => onViewModeChange(state.viewMode === 'canvas' ? 'native' : 'canvas')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              state.viewMode === 'native'
                ? 'bg-red-600/90 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={state.viewMode === 'canvas' ? 'Switch to Native Browser Viewer' : 'Switch to Canvas Viewer'}
          >
            {state.viewMode === 'canvas' ? <Eye className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
