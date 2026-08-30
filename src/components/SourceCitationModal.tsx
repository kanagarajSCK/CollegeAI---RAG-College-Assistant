import React from 'react';
import { X, FileText, CheckCircle2, Bookmark } from 'lucide-react';
import { SourceCitation } from '../types';

interface SourceCitationModalProps {
  citation: SourceCitation | null;
  onClose: () => void;
}

export const SourceCitationModal: React.FC<SourceCitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{citation.filename}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Page {citation.pageNumber || 1}</span>
                <span>•</span>
                <span>Chunk #{citation.chunkIndex}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                  {Math.round(citation.score * 100)}% Match
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Retrieved Document Passage</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs leading-relaxed text-gray-800 font-mono whitespace-pre-wrap selection:bg-indigo-100">
              {citation.snippet}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              This verbatim excerpt was retrieved from your uploaded document and provided to the AI model to ground the response accurately.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-100 bg-gray-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
          >
            Close Passage
          </button>
        </div>
      </div>
    </div>
  );
};

