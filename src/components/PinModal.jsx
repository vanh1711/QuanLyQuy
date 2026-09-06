import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, KeyRound, AlertCircle, Delete, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PinModal = () => {
  const { isPinModalOpen, closePinModal, unlockWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isPinModalOpen) {
      setPin('');
      setError('');
      setIsShaking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isPinModalOpen]);

  if (!isPinModalOpen) return null;

  const handleDigitClick = (digit) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        handleVerify(newPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleVerify = async (pinToTest) => {
    const res = await unlockWithPin(pinToTest);
    if (!res.success) {
      setError(res.message);
      setIsShaking(true);
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      handleDigitClick(e.key);
    } else if (e.key === 'Backspace') {
      handleDeleteDigit();
    } else if (e.key === 'Escape') {
      closePinModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className={`relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 ${
          isShaking ? 'animate-shake' : 'animate-slide-up'
        }`}
      >
        <button
          onClick={closePinModal}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-md shadow-brand-500/10">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Xác Thực Quyền Thủ Quỹ
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nhập mã PIN 6 số để mở khóa quyền quản lý
          </p>
        </div>

        {/* PIN Indicators (6 Dots) */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                index < pin.length
                  ? 'bg-brand-600 border-brand-600 scale-110 shadow-sm shadow-brand-500/50'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center text-xs font-semibold text-rose-500 animate-fade-in flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitClick(num.toString())}
              className="w-16 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg transition-all active:scale-95 shadow-xs border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => handleVerify(pin)}
            disabled={pin.length !== 6}
            className="w-16 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold transition-all active:scale-95 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center disabled:opacity-30"
            title="Xác nhận"
          >
            <Check className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleDigitClick('0')}
            className="w-16 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg transition-all active:scale-95 shadow-xs border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center"
          >
            0
          </button>

          <button
            onClick={handleDeleteDigit}
            className="w-16 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95 border border-rose-200 dark:border-rose-800 flex items-center justify-center"
            title="Xóa ký tự"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
