import React, { useState } from 'react';
import { JOURNAL_TEMPLATES } from '../data/templates';
import { TemplateItem } from '../types';
import { Sparkles, X, Check, BookOpen, Tag } from 'lucide-react';
import { useTheme } from '../lib/themeContext';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateItem, createNew: boolean) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { palette } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem>(JOURNAL_TEMPLATES[0]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'daily', name: '🌸 Daily' },
    { id: 'mindfulness', name: '🌙 Mindfulness' },
    { id: 'growth', name: '🌱 Growth & Goals' },
    { id: 'academic', name: '📚 Academic & Study' },
    { id: 'work', name: '💻 Work & Career' },
    { id: 'lifestyle', name: '☕ Lifestyle & Travel' },
    { id: 'creative', name: '💡 Creative Writing' },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? JOURNAL_TEMPLATES
      : JOURNAL_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-pink-100 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: palette.accent }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Journal Templates</h2>
              <p className="text-xs text-slate-400">Choose a mindful prompt or structured framework</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex gap-1.5 overflow-x-auto bg-white text-xs font-medium scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-pink-100 text-pink-800 font-bold border border-pink-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Modal Body: Left List + Right Preview */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Templates Grid List */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto border-r border-slate-100 space-y-2.5">
            {filteredTemplates.map((template) => {
              const isSelected = previewTemplate.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setPreviewTemplate(template)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-pink-300 bg-pink-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-pink-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{template.emoji}</span>
                      <span className="text-xs font-bold text-slate-900">{template.title}</span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.defaultTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Template Live Preview */}
          <div className="w-full md:w-1/2 p-5 flex flex-col bg-slate-50/40 min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{previewTemplate.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{previewTemplate.title}</h3>
                  <p className="text-[11px] text-slate-500">{previewTemplate.description}</p>
                </div>
              </div>
            </div>

            {/* Template Markdown Preview */}
            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap overflow-y-auto leading-relaxed shadow-inner">
              {previewTemplate.initialContent}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  onSelectTemplate(previewTemplate, false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-300 transition-colors cursor-pointer"
              >
                Insert into Current Entry
              </button>

              <button
                onClick={() => {
                  onSelectTemplate(previewTemplate, true);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-transform hover:scale-105 cursor-pointer"
                style={{ backgroundColor: palette.buttonPrimary }}
              >
                Create New Entry with Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
