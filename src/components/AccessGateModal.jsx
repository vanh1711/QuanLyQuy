import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  Wallet,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export const AccessGateModal = () => {
  const { isGroupUnlocked, unlockGroupAccess } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Nếu đã mở khóa thì không render màn hình này
  if (isGroupUnlocked) return null;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await unlockGroupAccess(password.trim(), rememberMe);
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        setErrorMsg(res.message || 'Mật khẩu không đúng. Vui lòng liên hệ Thủ Quỹ!');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      setErrorMsg('Lỗi xác thực, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-brand-600/25 to-indigo-600/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Card */}
      <div className={`relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-7 sm:p-8 space-y-6 text-center animate-slide-up ${
        isShaking ? 'animate-shake' : ''
      }`}>
        
        {/* Top Icon Branding */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-[11px] border border-brand-200/60 dark:border-brand-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Bảo Mật Quỹ Nhóm Nội Bộ
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Nhập Mật Khẩu Truy Cập
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Trang web chỉ dành cho 10 thành viên trong nhóm. Vui lòng nhập mật khẩu do Thủ Quỹ cung cấp.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2 text-left animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-brand-500" />
              <span>Mật khẩu xem quỹ</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu truy cập..."
                autoFocus
                className="w-full px-4 py-3.5 pr-11 text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Ghi nhớ đăng nhập */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
              <span>Ghi nhớ trên thiết bị này</span>
            </label>
          </div>

          {/* Nút Mở Khóa */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            <span>{isLoading ? 'Đang xác thực...' : 'Mở Khóa Vào Xem Quỹ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Hint for Admin */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          💡 <strong>Dành cho Thủ Quỹ:</strong> Nhập trực tiếp Mã PIN Thủ Quỹ để mở khóa toàn quyền quản trị ngay lập tức.
        </div>

      </div>

    </div>
  );
};
