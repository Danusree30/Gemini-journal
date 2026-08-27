import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  WifiOff,
  Palette,
  Heart,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Smile,
  Zap,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, authError } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 text-slate-800 flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-purple-700 bg-clip-text text-transparent">
              Gemini Journal
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium border border-pink-200">
              Zero-Trust Security
            </span>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium shadow-md shadow-pink-200 hover:shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all cursor-pointer disabled:opacity-75"
        >
          {signingIn ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {authError && (
          <div className="mb-6 p-4 bg-rose-100 border border-rose-300 text-rose-800 rounded-2xl max-w-md text-sm">
            {authError}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-pink-200 text-pink-700 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Private Digital Scrapbook + Gemini Reflection Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Your sacred space to write, reflect, and grow with{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
              Gemini AI
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Distraction-free journaling crafted with bank-grade zero-trust privacy, multi-turn AI reflections, offline synchronization, personal codelocks, and aesthetic pastel color studios.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-semibold text-base shadow-xl shadow-pink-300 hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Get Started Free with Google</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Interactive Feature Cards */}
        <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Zero-Trust & Isolated</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Enforced by strict Firestore security rules. User data is strictly isolated by Firebase UID with client-side SHA-256 codelock PIN hashing.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Gemini AI Reflection</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Multi-turn empathetic reflection, structured summarization, thought-organizer, creative brainstorming, and introspective coaching.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Palette className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Aesthetic Color Studio</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              12+ pastel palettes, automatic seasonal transitions (Spring 🌸, Summer ☀️, Autumn 🍂, Winter ❄️), and 15+ curated sticker collections.
            </p>
          </div>
        </div>

        {/* Secondary Trust Highlights */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-pink-500" />
            <span>Offline-First Synchronization</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-500" />
            <span>Encrypted PIN Codelock</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Server-Side Gemini Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>1-Click Cloud & JSON Backups</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-400 border-t border-pink-100/60">
        <p>Gemini Journal • Built with Google AI Studio, Gemini 2.5, & Firebase Security</p>
      </footer>
    </div>
  );
};
