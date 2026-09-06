import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useFund } from '../context/FundContext';

export const MonthSelector = () => {
  const { currentMonth, currentYear, setCurrentMonth, setCurrentYear } = useFund();

  const handlePrev = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleCurrent = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth() + 1);
    setCurrentYear(now.getFullYear());
  };

  const isCurrentMonth =
    currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-brand-50 dark:bg-brand-950/50 rounded-xl text-brand-600 dark:text-brand-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kỳ theo dõi</span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">
            Tháng {currentMonth} / {currentYear}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {!isCurrentMonth && (
          <button
            onClick={handleCurrent}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Về tháng này
          </button>
        )}

        <button
          onClick={handlePrev}
          title="Tháng trước"
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          title="Tháng sau"
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
