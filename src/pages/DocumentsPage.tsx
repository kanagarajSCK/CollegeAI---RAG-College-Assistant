import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DocumentChunkModal } from '../components/DocumentChunkModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { DocumentItem } from '../types';

interface DocumentsPageProps {
  documents: DocumentItem[];
  loadingDocuments: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReindex?: (id: string) => Promise<void>;
  onLoadSamples: () => Promise<void>;
  loadingSamples: boolean;
  onRefresh: () => Promise<void>;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  loadingDocuments,
  onUpload,
  onDelete,
  onReindex,
  onLoadSamples,
  loadingSamples,
  onRefresh,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDocForChunks, setSelectedDocForChunks] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.json', '.rtf', '.html', '.htm', '.tsv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Unsupported file format. Please upload PDF, Word (.docx/.doc), Text (.txt/.md), CSV, or JSON documents.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds the 50MB limit. Please upload a smaller file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      await onUpload(file);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteClick = (doc: DocumentItem) => {
    setDocToDelete(doc);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const id = docToDelete._id;
    setDeletingId(id);
    try {
      await onDelete(id);
      setDocToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (docId: string) => {
    if (!onReindex) return;
    setReindexingId(docId);
    try {
      await onReindex(docId);
    } finally {
      setReindexingId(null);
    }
  };

  return (
    <div className="p-3.5 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Documents & Knowledge Base</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Upload and manage the college documents your AI uses to ground its answers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh list"
            className="p-2.5 sm:p-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 bg-white border border-gray-200 rounded-xl sm:rounded-lg transition-colors shadow-2xs min-h-[40px] flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDocuments ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            id="btn-load-sample-docs"
            onClick={onLoadSamples}
            disabled={loadingSamples}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 rounded-xl sm:rounded-lg shadow-2xs transition-colors disabled:opacity-60 min-h-[40px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{loadingSamples ? 'Indexing Samples...' : 'Load Samples'}</span>
          </button>

          <button
            id="btn-trigger-upload"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl sm:rounded-lg shadow-xs shadow-indigo-100 transition-colors min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-gray-300 hover:border-gray-400 active:bg-gray-50 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.rtf,.html,.htm,.tsv"
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-2.5 sm:space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            {uploading ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
              {uploading ? 'Processing & Vectorizing Document...' : 'Tap to upload or drag & drop documents'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500">
              PDF, Word (DOCX/DOC), Text (TXT/MD), CSV, JSON (Up to 50MB)
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-[10px] sm:text-[11px] text-gray-600">
            <span>Automatic vector embedding & semantic chunking</span>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-rose-50 border border-rose-200 rounded-xl inline-flex items-center gap-2 text-xs text-rose-700 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Document List Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Uploaded Files ({documents.length})
            </h2>
            {documents.some(d => d.status === 'Processing') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              {documents.filter(d => d.status === 'Indexed').length} Ready for Querying
            </span>
            <button
              id="btn-refresh-documents-list"
              onClick={onRefresh}
              disabled={loadingDocuments}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh document status"
            >
              <RefreshCw className={`w-3 h-3 ${loadingDocuments ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loadingDocuments ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
            <span className="text-xs">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">No documents in your knowledge base</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Upload your college calendar, notices, handbook, or tap "Load Samples" above.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View (hidden on lg) */}
            <div className="divide-y divide-gray-100 lg:hidden">
              {documents.map(doc => (
                <div key={doc._id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-[10px] mt-0.5">
                        {doc.fileType.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 break-all">
                          {doc.originalName || doc.filename}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                          <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{doc.chunkCount || 0} chunks</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {doc.status === 'Indexed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Indexed
                        </span>
                      ) : doc.status === 'Processing' || reindexingId === doc._id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 animate-spin shrink-0" />
                          Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {doc.error && doc.status === 'Failed' && (
                    <div className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded-lg break-words">
                      Error: {doc.error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                      {doc.extractedTextPreview || ''}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.status === 'Indexed' && (
                        <button
                          onClick={() => setSelectedDocForChunks(doc)}
                          className="px-2 py-1 text-gray-700 active:bg-indigo-50 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Chunks</span>
                        </button>
                      )}

                      {doc.status === 'Failed' && (
                        <button
                          onClick={() => handleRetry(doc._id)}
                          className="px-2 py-1 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${reindexingId === doc._id ? 'animate-spin' : ''}`} />
                          <span>Retry</span>
                        </button>
                      )}

                      <button
                        id={`btn-delete-doc-mobile-${doc._id}`}
                        onClick={() => handleDeleteClick(doc)}
                        disabled={deletingId === doc._id}
                        aria-label={`Delete ${doc.originalName || doc.filename}`}
                        className="p-1.5 text-gray-400 hover:text-rose-600 active:bg-rose-50 rounded-lg transition-colors"
                      >
                        {deletingId === doc._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Document Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Indexed Chunks</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {documents.map(doc => (
                    <tr key={doc._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-[10px]">
                            {doc.fileType.toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <div className="font-semibold text-gray-900 truncate">
                              {doc.originalName || doc.filename}
                            </div>
                            {doc.error && doc.status === 'Failed' ? (
                              <div className="text-[11px] text-rose-500 truncate mt-0.5" title={doc.error}>
                                Error: {doc.error}
                              </div>
                            ) : (
                              doc.extractedTextPreview && (
                                <div className="text-[11px] text-gray-400 truncate mt-0.5">
                                  {doc.extractedTextPreview}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {doc.status === 'Indexed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Indexed
                          </span>
                        ) : doc.status === 'Processing' || reindexingId === doc._id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </span>
                            <button
                              onClick={() => handleRetry(doc._id)}
                              disabled={reindexingId === doc._id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                              title="Retry document parsing and indexing"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${reindexingId === doc._id ? 'animate-spin' : ''}`} />
                              Retry
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-600">
                        {doc.chunkCount || 0} chunks
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500">
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.status === 'Indexed' && (
                            <button
                              onClick={() => setSelectedDocForChunks(doc)}
                              title="Inspect chunks"
                              className="p-1.5 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Chunks</span>
                            </button>
                          )}

                          {doc.status === 'Failed' && (
                            <button
                              onClick={() => handleRetry(doc._id)}
                              title="Retry Indexing"
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>
                          )}

                          <button
                            id={`btn-delete-doc-${doc._id}`}
                            onClick={() => handleDeleteClick(doc)}
                            disabled={deletingId === doc._id}
                            title="Delete document"
                            aria-label={`Delete ${doc.originalName || doc.filename}`}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === doc._id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Chunks Inspector Modal */}
      <DocumentChunkModal
        document={selectedDocForChunks}
        onClose={() => setSelectedDocForChunks(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Delete Document?"
        message={`Are you sure you want to permanently delete "${docToDelete?.originalName || docToDelete?.filename}"? All associated chunks and vector embeddings will be purged from the knowledge base.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        isDestructive={true}
        loading={!!deletingId}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};

