import React, { useEffect, useState } from 'react';
import { PdfDocumentItem, ViewerState } from './types';
import {
  getAllPdfsFromStorage,
  savePdfToStorage,
  deletePdfFromStorage,
} from './utils/pdfStorage';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { PdfLibraryModal } from './components/PdfLibraryModal';
import { PdfCanvasViewer } from './components/PdfCanvasViewer';
import { PdfNativeViewer } from './components/PdfNativeViewer';
import { PdfViewerControls } from './components/PdfViewerControls';
import { DuplexSplitterModal } from './components/DuplexSplitterModal';
import { FileText, Upload, FolderOpen, ArrowLeft, Plus, Printer, Sparkles } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<PdfDocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<PdfDocumentItem | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDuplexModalOpen, setIsDuplexModalOpen] = useState(false);

  const [viewerState, setViewerState] = useState<ViewerState>({
    currentPage: 1,
    totalPages: 1,
    scale: 1.0,
    rotation: 0,
    displayMode: 'single',
    viewMode: 'canvas',
  });

  // Load local stored PDFs on mount
  useEffect(() => {
    getAllPdfsFromStorage().then((storedDocs) => {
      // Create object URLs for loaded docs
      const preparedDocs = storedDocs.map((doc) => ({
        ...doc,
        objectUrl: URL.createObjectURL(new Blob([doc.arrayBuffer], { type: 'application/pdf' })),
      }));
      setDocuments(preparedDocs);

      // Auto-open most recent PDF if available
      if (preparedDocs.length > 0) {
        setActiveDoc(preparedDocs[preparedDocs.length - 1]);
      }
    });

    return () => {
      // Cleanup object URLs on unmount
      documents.forEach((doc) => {
        if (doc.objectUrl) URL.revokeObjectURL(doc.objectUrl);
      });
    };
  }, []);

  // Handle uploading a new PDF file from local storage
  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));

      const newDoc: PdfDocumentItem = {
        id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: file.name,
        size: file.size,
        uploadedAt: Date.now(),
        arrayBuffer: buffer,
        objectUrl,
      };

      // Save to IndexedDB
      await savePdfToStorage(newDoc);

      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDoc(newDoc);
      setViewerState((prev) => ({
        ...prev,
        currentPage: 1,
        scale: 1.0,
        rotation: 0,
      }));
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error('Error processing uploaded PDF file:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    await deletePdfFromStorage(id);
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (activeDoc?.id === id) {
        setActiveDoc(next.length > 0 ? next[0] : null);
      }
      return next;
    });
  };

  const handleSelectDocument = (doc: PdfDocumentItem) => {
    setActiveDoc(doc);
    setViewerState((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Mobile container wrapper */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col bg-slate-950 shadow-2xl relative min-h-screen">
        {/* App Header */}
        <Header
          currentFileName={activeDoc?.name}
          pdfCount={documents.length}
          hasActiveDoc={!!activeDoc}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenDuplexModal={() => setIsDuplexModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {!activeDoc ? (
            /* Empty State: Prompt user to upload local PDF */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-lg">
                <Printer className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">DuplexPrint Helper</h2>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Split PDFs into <strong className="text-red-400">Odd Pages (Part 1)</strong> and{' '}
                <strong className="text-blue-400">Even Pages (Part 2)</strong> for manual double-sided printing.
              </p>

              {/* Duplex Feature Spotlight Card */}
              <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-3.5 mb-5 text-left text-xs shadow-md">
                <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Manual Double-Sided Printing Helper</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Have a single-sided printer? Upload your PDF, click <strong>Duplex Split</strong>, print Part 1 (front), re-insert paper, and print Part 2 (back).
                </p>
              </div>

              <div className="w-full max-w-sm mb-6">
                <UploadZone onFileSelected={handleFileUpload} />
              </div>

              {documents.length > 0 && (
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>View stored PDFs ({documents.length})</span>
                </button>
              )}
            </div>
          ) : (
            /* PDF Viewer View */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Controls bar at top of viewer */}
              <PdfViewerControls
                state={viewerState}
                onPageChange={(page) => setViewerState((s) => ({ ...s, currentPage: page }))}
                onScaleChange={(scale) => setViewerState((s) => ({ ...s, scale }))}
                onRotate={() => setViewerState((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                onDisplayModeChange={(mode) => setViewerState((s) => ({ ...s, displayMode: mode }))}
                onViewModeChange={(mode) => setViewerState((s) => ({ ...s, viewMode: mode }))}
                onOpenDuplexSplitter={() => setIsDuplexModalOpen(true)}
              />

              {/* View area */}
              {viewerState.viewMode === 'canvas' ? (
                <PdfCanvasViewer
                  arrayBuffer={activeDoc.arrayBuffer}
                  state={viewerState}
                  onTotalPagesLoaded={(total) =>
                    setViewerState((s) => ({ ...s, totalPages: total }))
                  }
                  onPageVisibleChange={(page) =>
                    setViewerState((s) => ({ ...s, currentPage: page }))
                  }
                  onSwitchToNative={() =>
                    setViewerState((s) => ({ ...s, viewMode: 'native' }))
                  }
                />
              ) : (
                <PdfNativeViewer
                  objectUrl={activeDoc.objectUrl || ''}
                  fileName={activeDoc.name}
                  onSwitchToCanvas={() => setViewerState((s) => ({ ...s, viewMode: 'canvas' }))}
                />
              )}
            </div>
          )}
        </main>

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-red-500" />
                  Upload PDF File
                </h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded-lg"
                >
                  Close
                </button>
              </div>

              <UploadZone
                onFileSelected={handleFileUpload}
                onClose={() => setIsUploadModalOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Documents Library Modal */}
        {isLibraryOpen && (
          <PdfLibraryModal
            documents={documents}
            activeDocId={activeDoc?.id || null}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={handleDeleteDocument}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onClose={() => setIsLibraryOpen(false)}
          />
        )}

        {/* Duplex Print Splitter Modal */}
        {isDuplexModalOpen && activeDoc && (
          <DuplexSplitterModal
            arrayBuffer={activeDoc.arrayBuffer}
            fileName={activeDoc.name}
            onClose={() => setIsDuplexModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

