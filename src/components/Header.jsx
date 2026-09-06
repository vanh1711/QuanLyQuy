import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Settings, 
  RefreshCw, 
  Wallet, 
  Moon, 
  Sun, 
  Users, 
  BarChart3, 
  Receipt,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';

export const Header = ({ onOpenSettings, isDarkMode, onToggleTheme }) => {
  const { isAdmin, openPinModal, lockAdmin, lockGroupAccess } = useAuth();
  const { isRefreshing, refreshData, activeTab, setActiveTab } = useFund();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-600 dark:from-white dark:via-brand-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  QUẢN LÝ QUỸ
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Minh bạch thu chi & đóng quỹ tức thì
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('quickpay')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'quickpay'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>⚡ Đóng Quỹ Nhanh</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Tổng Quan
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'members'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              10 Thành Viên
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Lịch Sử Thu Chi
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              title="Làm mới dữ liệu"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              title="Chuyển chế độ sáng/tối"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Lock Web Access Button (Đăng xuất / Khóa màn hình) */}
            <button
              onClick={lockGroupAccess}
              title="Khóa bảo vệ Web / Đăng xuất"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenSettings}
                  title="Cài đặt hệ thống & mã QR"
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={lockAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all group"
                  title="Nhấn để khóa quyền Thủ quỹ"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:hidden" />
                  <Lock className="w-3.5 h-3.5 hidden group-hover:block" />
                  <span className="group-hover:hidden">Thủ Quỹ (Mở)</span>
                  <span className="hidden group-hover:inline">Khóa quyền</span>
                </button>
              </div>
            ) : (
              <button
                onClick={openPinModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-brand-600 dark:hover:bg-brand-400 dark:hover:text-white shadow-sm transition-all"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở khóa Thủ Quỹ</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveTab('quickpay')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-bold ${
              activeTab === 'quickpay'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Đóng quỹ
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-medium ${
              activeTab === 'dashboard'
                ? 'bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-medium ${
              activeTab === 'members'
                ? 'bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            10 Thành viên
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-medium ${
              activeTab === 'transactions'
                ? 'bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Thu chi
          </button>
        </div>
      </div>
    </header>
  );
};
