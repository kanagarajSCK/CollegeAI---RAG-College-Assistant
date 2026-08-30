import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'What is the last date for hostel application?',
  'What is the examination fee and grading system?',
  'When does the semester begin and what are the exam dates?',
  'What are the hostel room fees and curfew timings?',
  'What are the eligibility criteria for campus placement?',
  'What is the mandatory attendance requirement for exams?',
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-center space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>College Knowledge Assistant</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Ask anything about your college documents
        </h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Get grounded answers retrieved directly from circulars, hostel guidelines, examination manuals, and academic calendars with citations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
        {SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="flex items-start gap-2.5 p-3.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-300 rounded-xl text-xs text-gray-700 hover:text-indigo-900 transition-all text-left shadow-2xs group"
          >
            <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-snug">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

