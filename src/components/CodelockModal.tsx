import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, KeyRound, Sparkles, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useTheme } from '../lib/themeContext';
import { verifyPin } from '../lib/crypto';

interface CodelockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export const CodelockModal: React.FC<CodelockModalProps> = ({ isOpen, onUnlock }) => {
  const { user, signOut } = useAuth();
  const { settings, palette } = useTheme();

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check PIN function with correct argument order (pin, salt, storedHash)
  const checkPin = useCallback(
    async (candidatePin: string) => {
      if (!settings.codelockPinHash || !settings.codelockSalt) {
        onUnlock();
        return;
      }

      setIsVerifying(true);
      try {
        const isValid = await verifyPin(
          candidatePin,
          settings.codelockSalt,
          settings.codelockPinHash
        );
        if (isValid) {
          setError(false);
          setPin('');
          onUnlock();
        } else {
          if (candidatePin.length >= 4) {
            setError(true);
            setTimeout(() => {
              setPin('');
            }, 600);
          }
        }
      } catch (e) {
        console.error('[Codelock Verification Error]:', e);
        setError(true);
      } finally {
        setIsVerifying(false);
      }
    },
    [settings.codelockPinHash, settings.codelockSalt, onUnlock]
  );

  const handleKeyPress = useCallback(
    (num: string) => {
      if (pin.length >= 6) return;
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length >= 4) {
        checkPin(newPin);
      }
    },
    [pin, checkPin]
  );

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  // Reset and listen to physical keyboard keys
  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          checkPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, handleKeyPress, handleBackspace, checkPin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-pink-100 flex flex-col items-center text-center transition-transform ${
          error ? 'animate-shake' : ''
        }`}
      >
        {/* User Profile Avatar */}
        <div className="relative mb-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-16 h-16 rounded-3xl object-cover shadow-md border-2 border-pink-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{ backgroundColor: palette.accent }}
            >
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '🌸'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        <h2 className="text-base font-bold text-slate-800">
          {user?.displayName || 'Gemini Journal'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 mb-6">Enter your security PIN to unlock</p>

        {/* PIN Dots indicator */}
        <div className="flex items-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 scale-110 shadow-xs'
                    : 'bg-pink-500 scale-110 shadow-xs'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-bold mb-4 flex items-center gap-1 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5" /> Incorrect PIN. Try again.
          </p>
        )}

        {isVerifying && (
          <p className="text-xs text-pink-600 font-medium mb-3">Verifying PIN...</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-pink-50 text-slate-800 hover:text-pink-700 text-lg font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-pink-50 text-slate-800 hover:text-pink-700 text-lg font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            title="Backspace"
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Sign out fallback if forgot PIN */}
        <div className="mt-6 pt-4 border-t border-slate-100 w-full flex justify-center">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out of account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
