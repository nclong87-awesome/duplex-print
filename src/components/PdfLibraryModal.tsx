import React, { useState } from 'react';
import { PdfDocumentItem } from '../types';
import { formatFileSize } from '../utils/pdfStorage';
import { FileText, Trash2, X, Plus, Search, Calendar, FileCheck } from 'lucide-react';

interface PdfLibraryModalProps {
  documents: PdfDocumentItem[];
  activeDocId: string | null;
  onSelectDocument: (doc: PdfDocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  onOpenUpload: () => void;
  onClose: () => void;
}

export const PdfLibraryModal: React.FC<PdfLibraryModalProps> = ({
  documents,
  activeDocId,
  onSelectDocument,
  onDeleteDocument,
  onOpenUpload,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-slate-100">Uploaded Documents ({documents.length})</h2>
          </div>
          <button
            id="btn-close-library"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-3 border-b border-slate-800 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search uploaded PDFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>
          <button
            id="btn-upload-new-pdf"
            onClick={() => {
              onClose();
              onOpenUpload();
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add PDF</span>
          </button>
        </div>

        {/* List of PDFs */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/40">
          {filteredDocs.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-60" />
              <p className="text-xs">No PDF files found</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="mt-3 text-xs text-red-400 hover:text-red-300 font-medium underline"
              >
                Upload your first PDF
              </button>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isActive = doc.id === activeDocId;
              const uploadDate = new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={doc.id}
                  className={`pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-red-950/30 border border-red-900/40 text-slate-100'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectDocument(doc);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isActive ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-200 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        {doc.pageCount && <span>{doc.pageCount} pages</span>}
                        {doc.pageCount && <span>•</span>}
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {uploadDate}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 pl-2">
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete from local storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
