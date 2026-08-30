import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCw,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { MessageItem, SourceCitation } from '../types';

interface ChatMessageProps {
  message: MessageItem;
  onRegenerate?: () => void;
  onViewCitation?: (source: SourceCitation) => void;
  isLastAssistant?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onViewCitation,
  isLastAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDocBadgeColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bg-red-50 text-red-600 border-red-100';
    if (ext === 'docx') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  const getDocType = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'DOC';
  };

  return (
    <div className="py-2.5 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {isUser ? (
          /* User Message - Right Aligned Clean Pill Container */
          <div className="flex justify-end">
            <div className="max-w-[80%] sm:max-w-[70%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-xs space-y-1">
              <div className="flex items-center justify-between gap-3 text-[10px] text-indigo-200">
                <span className="font-semibold uppercase tracking-wider">You</span>
                <span>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ) : (
          /* AI Message - Clean Minimal Card with Avatar & Citations */
          <div className="flex justify-start items-start gap-3 sm:gap-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-2xs">
              AI
            </div>

            <div className="flex-1 max-w-[85%] sm:max-w-[80%] space-y-3">
              {/* Message Bubble */}
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 text-[10px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 uppercase tracking-wider">College AI</span>
                    <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase rounded">Grounded</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={handleCopy}
                      title="Copy response"
                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-white rounded transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isLastAssistant && onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        title="Regenerate answer"
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-white rounded transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="markdown-body text-sm leading-relaxed text-gray-800">
                  <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                </div>
              </div>

              {/* Source Citation Cards */}
              {message.sources && message.sources.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Sources & Citations ({message.sources.length})
                    </p>
                    <span className="text-[10px] text-gray-400">Click to view verified excerpt</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {message.sources.map((src, idx) => (
                      <div
                        key={idx}
                        onClick={() => onViewCitation?.(src)}
                        className="flex items-center gap-2.5 p-2 bg-gray-50/70 hover:bg-indigo-50/50 border border-gray-100 hover:border-indigo-200 rounded-lg group cursor-pointer transition-all"
                      >
                        <div className={`px-1.5 py-1 rounded text-[10px] font-bold uppercase border ${getDocBadgeColor(src.filename)}`}>
                          {getDocType(src.filename)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 truncate">
                            {src.filename}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Page {src.pageNumber || 1} • {Math.round(src.score * 100)}% match
                          </p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

