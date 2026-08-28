import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  MessageSquare,
  FileText,
  Lightbulb,
  ListTodo,
  HelpCircle,
  PenTool,
  Send,
  Copy,
  Check,
  Plus,
  RefreshCw,
  AlertCircle,
  Bot,
  User as UserIcon,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';
import {
  requestAiReflection,
  requestAiSummary,
  requestAiBrainstorm,
  requestAiOrganize,
  requestAiContinuation,
  requestAiChat,
  requestAiActionItems,
  requestAiQuestions,
} from '../lib/aiClient';
import { useTheme } from '../lib/themeContext';
import { useAuth } from '../lib/authContext';
import { JournalEntry, JournalMessage, JournalSummary } from '../types';
import { saveJournalMessage, subscribeToJournalMessages, saveJournalSummary } from '../lib/storage';

interface AiAssistantPanelProps {
  entry: JournalEntry;
  onAppendContent: (text: string) => void;
  onReplaceContent: (text: string) => void;
  onUpdateTitle: (title: string) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  entry,
  onAppendContent,
  onReplaceContent,
  onUpdateTitle,
}) => {
  const { palette, settings } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'tools' | 'chat' | 'summary'>('tools');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [aiOutputTitle, setAiOutputTitle] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<JournalMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Brainstorm custom topic
  const [brainstormQuery, setBrainstormQuery] = useState('');
  const [showBrainstormInput, setShowBrainstormInput] = useState(false);

  // Subscribe to chat messages for current journal entry
  useEffect(() => {
    if (!user || !entry.id) return;
    const unsubscribe = subscribeToJournalMessages(user.uid, entry.id, (msgs) => {
      setChatMessages(msgs);
    });
    return () => unsubscribe();
  }, [user, entry.id]);

  // Auto scroll chat
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // AI Tools Dispatcher
  const runAiTool = async (
    type: 'reflect' | 'summarize' | 'brainstorm' | 'organize' | 'continue' | 'actions' | 'questions'
  ) => {
    if (!entry.content.trim()) {
      setErrorMessage('Please write some thoughts in your journal before asking Gemini to reflect.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction(type);

    try {
      if (type === 'reflect') {
        setAiOutputTitle('🌸 Gemini Reflection & Insights');
        const res = await requestAiReflection({
          title: entry.title,
          content: entry.content,
          mood: entry.emoji,
        });
        setAiOutput(res);
      } else if (type === 'summarize') {
        setAiOutputTitle('📋 Structured Journal Summary');
        const res = await requestAiSummary({
          title: entry.title,
          content: entry.content,
        });
        setAiOutput(res);

        // Also save summary directly if user is logged in
        if (user) {
          const summaryObj: JournalSummary = {
            id: `sum_${entry.id}`,
            journalId: entry.id,
            title: entry.title || 'Journal Summary',
            shortSummary: res.slice(0, 300),
            keyTakeaways: [],
            actionItems: [],
            reflectionQuestion: '',
            rawMarkdown: res,
            createdAt: Date.now(),
          };
          await saveJournalSummary(user.uid, summaryObj);
        }
      } else if (type === 'brainstorm') {
        setAiOutputTitle('💡 Creative Brainstorming');
        const res = await requestAiBrainstorm({
          content: entry.content,
          query: brainstormQuery || undefined,
        });
        setAiOutput(res);
      } else if (type === 'organize') {
        setAiOutputTitle('✨ Mindfully Organized Thoughts');
        const res = await requestAiOrganize({
          content: entry.content,
        });
        setAiOutput(res);
      } else if (type === 'continue') {
        setAiOutputTitle('✍️ Flow Continuation');
        const res = await requestAiContinuation({
          content: entry.content,
        });
        setAiOutput(res);
      } else if (type === 'actions') {
        setAiOutputTitle('✅ Extracted Action Items');
        const res = await requestAiActionItems({
          content: entry.content,
        });
        setAiOutput(res);
      } else if (type === 'questions') {
        setAiOutputTitle('❓ Introspective Coaching Questions');
        const res = await requestAiQuestions({
          content: entry.content,
        });
        setAiOutput(res);
      }
    } catch (err: any) {
      console.error('[AI Tool Error]:', err);
      setErrorMessage(err.message || '✨ Gemini is temporarily unavailable. Your journal remains safe.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Chat Submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat || !user) return;

    const userText = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);
    setErrorMessage(null);

    const userMessage: JournalMessage = {
      id: `msg_${Date.now()}_user`,
      journalId: entry.id,
      role: 'user',
      content: userText,
      createdAt: Date.now(),
    };

    // Save user message immediately to Firestore
    try {
      await saveJournalMessage(user.uid, entry.id, userMessage);
    } catch (e) {
      console.error('Failed to save user message:', e);
    }

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await requestAiChat({
        message: userText,
        journalContent: entry.content,
        journalTitle: entry.title,
        history,
      });

      const geminiMessage: JournalMessage = {
        id: `msg_${Date.now()}_gemini`,
        journalId: entry.id,
        role: 'gemini',
        content: reply,
        createdAt: Date.now(),
      };

      await saveJournalMessage(user.uid, entry.id, geminiMessage);
    } catch (err: any) {
      console.error('[Chat Error]:', err);
      setErrorMessage(err.message || 'Gemini reply failed. Please try again.');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden">
      {/* AI Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shadow-xs"
            style={{ backgroundColor: palette.accent }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800">Gemini Reflection Assistant</span>
            <span className="block text-[10px] text-slate-400">Context-Aware AI Companion</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-pink-50 text-pink-700 font-semibold border border-pink-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reflection Tools
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'chat'
                ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat ({chatMessages.length})</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="m-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: AI Tools */}
      {activeTab === 'tools' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {/* Quick Action Chips */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => runAiTool('reflect')}
              disabled={!!loadingAction}
              className="p-2.5 rounded-2xl border border-pink-200 bg-pink-50/60 hover:bg-pink-100/80 text-pink-900 text-left transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-pink-200/80 flex items-center justify-center text-pink-700">
                {loadingAction === 'reflect' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs">Reflect</div>
                <div className="text-[10px] text-pink-700/70">Empathetic insights</div>
              </div>
            </button>

            <button
              onClick={() => runAiTool('summarize')}
              disabled={!!loadingAction}
              className="p-2.5 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-900 text-left transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-purple-200/80 flex items-center justify-center text-purple-700">
                {loadingAction === 'summarize' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs">Summarize</div>
                <div className="text-[10px] text-purple-700/70">Key takeaways</div>
              </div>
            </button>

            <button
              onClick={() => runAiTool('organize')}
              disabled={!!loadingAction}
              className="p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 text-left transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-200/80 flex items-center justify-center text-emerald-700">
                {loadingAction === 'organize' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ListTodo className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs">Organize</div>
                <div className="text-[10px] text-emerald-700/70">Structure notes</div>
              </div>
            </button>

            <button
              onClick={() => runAiTool('brainstorm')}
              disabled={!!loadingAction}
              className="p-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 text-left transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-700">
                {loadingAction === 'brainstorm' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs">Brainstorm</div>
                <div className="text-[10px] text-amber-700/70">Creative sparks</div>
              </div>
            </button>

            <button
              onClick={() => runAiTool('actions')}
              disabled={!!loadingAction}
              className="p-2.5 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 text-left transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-blue-200/80 flex items-center justify-center text-blue-700">
                {loadingAction === 'actions' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs">Action Items</div>
                <div className="text-[10px] text-blue-700/70">Actionable checklist</div>
              </div>
            </button>

            <button
              onClick={() => runAiTool('questions')}
              disabled={!!loadingAction}
              className="p-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-900 text-left transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-200/80 flex items-center justify-center text-indigo-700">
                {loadingAction === 'questions' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs">Questions</div>
                <div className="text-[10px] text-indigo-700/70">Coaching prompts</div>
              </div>
            </button>
          </div>

          {/* Flow Continuation Pill */}
          <button
            onClick={() => runAiTool('continue')}
            disabled={!!loadingAction}
            className="w-full py-2 px-3 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingAction === 'continue' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PenTool className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span>Help me continue writing...</span>
          </button>

          {/* AI Output Card */}
          {aiOutput ? (
            <div className="flex-1 flex flex-col p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-pink-50/20 border border-pink-100/80 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-pink-100">
                <span className="font-bold text-xs text-slate-800">{aiOutputTitle}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(aiOutput)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-colors text-[11px] flex items-center gap-1"
                    title="Copy AI response"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => onAppendContent(`\n\n---\n### ${aiOutputTitle}\n\n${aiOutput}`)}
                    className="px-2 py-1 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                    title="Append to Journal"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Insert</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto text-xs text-slate-700 leading-relaxed pr-1 prose-sm">
                <div className="markdown-body">
                  <Markdown>{aiOutput}</Markdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <Sparkles className="w-8 h-8 text-pink-300 mb-2 animate-pulse" />
              <p className="text-xs font-medium text-slate-600">Select an AI action above</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Gemini will reflect on your journal entry, brainstorm creative sparks, or summarize your thoughts gently.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interactive Multi-Turn Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full min-h-0">
          {/* Chat Messages Container */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-2 shadow-xs"
                  style={{ backgroundColor: palette.accent }}
                >
                  <Bot className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Chat with Gemini about this journal</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Ask questions, explore deeper feelings, or talk through your thoughts freely in a safe, confidential space.
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'gemini' && (
                    <div
                      className="w-6 h-6 rounded-xl flex items-center justify-center text-white text-[10px] shrink-0 mt-1 shadow-xs"
                      style={{ backgroundColor: palette.accent }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-xs shadow-xs'
                        : 'text-slate-800 rounded-tl-xs border border-pink-100 shadow-xs'
                    }`}
                    style={{
                      backgroundColor:
                        msg.role === 'user' ? palette.userBubble : palette.aiBubble,
                    }}
                  >
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] shrink-0 mt-1">
                      <UserIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isSendingChat && (
              <div className="flex items-center gap-2 text-xs text-pink-600 animate-pulse pl-8">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini is reflecting...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-slate-100 bg-slate-50/80 flex items-center gap-2"
          >
            <input
              id="ai-chat-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Gemini anything about your journal..."
              disabled={isSendingChat}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSendingChat}
              className="p-2 rounded-xl text-white transition-transform hover:scale-105 cursor-pointer disabled:opacity-50 shrink-0"
              style={{ backgroundColor: palette.buttonPrimary }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
