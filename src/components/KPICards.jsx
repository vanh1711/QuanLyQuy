import React from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFund } from '../context/FundContext';
import { formatVND } from '../utils/formatters';

export const KPICards = () => {
  const { summary, currentMonth } = useFund();

  const totalBalance = summary?.total_balance ?? 0;
  const monthIncome = summary?.month_income ?? 0;
  const monthExpense = summary?.month_expense ?? 0;
  const prevMonthIncome = summary?.prev_month_income ?? 0;

  // Tính % tăng trưởng thu so với tháng trước
  let growthText = '';
  let isPositiveGrowth = true;
  if (prevMonthIncome > 0) {
    const rate = Math.round(((monthIncome - prevMonthIncome) / prevMonthIncome) * 100);
    growthText = `${rate >= 0 ? '+' : ''}${rate}% so với tháng trước`;
    isPositiveGrowth = rate >= 0;
  } else if (monthIncome > 0) {
    growthText = 'Kỳ thu mới';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* 1. SỐ DƯ QUỸ HIỆN TẠI */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-500/20 border border-brand-400/30">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-100/90">
            Số Dư Quỹ Hiện Tại
          </span>
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatVND(totalBalance)}
          </h3>
          <p className="text-xs text-brand-200 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Minh bạch thời gian thực
          </p>
        </div>
      </div>

      {/* 2. TỔNG THU THÁNG NÀY */}
      <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/60 shadow-sm hover:shadow-glow-emerald transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Tổng Thu (Tháng {currentMonth})
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            +{formatVND(monthIncome)}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {growthText && (
              <span
                className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  isPositiveGrowth
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {isPositiveGrowth ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {growthText}
              </span>
            )}
            {!growthText && <span>Đóng quỹ & tài trợ</span>}
          </div>
        </div>
      </div>

      {/* 3. TỔNG CHI THÁNG NÀY */}
      <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/60 shadow-sm hover:shadow-glow-rose transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Tổng Chi (Tháng {currentMonth})
          </span>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            -{formatVND(monthExpense)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {monthExpense > 0
              ? `Chi tiêu cho hoạt động tháng ${currentMonth}`
              : `Chưa có khoản chi nào trong tháng ${currentMonth}`}
          </p>
        </div>
      </div>

    </div>
  );
};
