import React, { useState, useEffect } from 'react';
import { X, FileText, Layers, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, DocumentChunkPreview } from '../types';

interface DocumentChunkModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export const DocumentChunkModal: React.FC<DocumentChunkModalProps> = ({ document, onClose }) => {
  const [chunks, setChunks] = useState<DocumentChunkPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) return;

    const fetchChunks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDocumentById(document._id);
        setChunks(data.chunks || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load chunks.');
      } finally {
        setLoading(false);
      }
    };

    fetchChunks();
  }, [document]);

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{document.originalName || document.filename}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{document.chunkCount || chunks.length} Indexed Chunks</span>
                <span>•</span>
                <span className="capitalize">{document.fileType.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
              <span className="text-xs">Loading chunk vector index...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No chunk data available for this document.
            </div>
          ) : (
            chunks.map((chunk, idx) => (
              <div
                key={chunk._id || idx}
                className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Chunk #{chunk.chunkIndex}
                  </span>
                  <div className="flex items-center gap-2 font-normal">
                    {chunk.pageNumber && <span>Page {chunk.pageNumber}</span>}
                    <span>•</span>
                    <span>~{chunk.tokenCount} tokens</span>
                  </div>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed font-mono whitespace-pre-wrap">
                  {chunk.textPreview}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100 bg-gray-50/70 shrink-0 text-xs text-gray-500">
          <span>Vector embedding dimension: 768-d</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

