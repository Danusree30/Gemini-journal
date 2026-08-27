import React, { useState } from 'react';
import { Smile, Sparkles, Heart, Sun, Coffee, Book, Target } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_SETS = [
  {
    category: 'Moods & Feelings',
    emojis: ['🌸', '✨', '💖', '🥰', '😌', '🌱', '☀️', '☕', '🌿', '🌙', '🌊', '🕊️', '🧘', '💭', '🧸', '🍧'],
  },
  {
    category: 'Study & Work',
    emojis: ['📚', '💡', '🎓', '💻', '📝', '🎯', '📖', '📌', '🏆', '✒️', '🔬', '💼', '📅', '📑', '⏰', '🔍'],
  },
  {
    category: 'Cozy & Treats',
    emojis: ['☕', '🧋', '🥐', '🍰', '🍫', '🍩', '🍪', '🍨', '🍓', '🍵', '🥞', '🥨', '🍮', '🥖', '🧁', '🍯'],
  },
  {
    category: 'Nature & Seasons',
    emojis: ['🌸', '🌻', '🌷', '🌿', '🌵', '🍁', '🍂', '🌲', '🏕️', '🏔️', '🌊', '❄️', '🌈', '⛅', '🌧️', '⚡'],
  },
  {
    category: 'Night & Stars',
    emojis: ['⭐', '🌟', '💫', '🌙', '🌕', '🌖', '💎', '🔮', '💤', '🕯️', '🌌', '🌃', '🪐', '🌠', '🕊️', '🗝️'],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onSelectEmoji,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="absolute top-12 left-0 z-40 w-72 bg-white rounded-2xl shadow-xl border border-pink-200 p-3 animate-in fade-in zoom-in-95">
      {/* Category Tabs */}
      <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
        {EMOJI_SETS.map((set, idx) => (
          <button
            key={set.category}
            onClick={() => setActiveTab(idx)}
            className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
              activeTab === idx ? 'bg-pink-100 text-pink-700 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {set.emojis[0]}
          </button>
        ))}
      </div>

      <div className="text-[11px] font-semibold text-slate-500 mb-2 px-1">
        {EMOJI_SETS[activeTab].category}
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1">
        {EMOJI_SETS[activeTab].emojis.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="w-9 h-9 rounded-xl hover:bg-pink-50 text-xl flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
