import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useFund } from '../context/FundContext';
import { formatVND } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 min-w-[140px]">
        <p className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
          {label}
        </p>
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span>Thu:</span>
          <span className="font-semibold">{formatVND(payload[0]?.value || 0)}</span>
        </div>
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span>Chi:</span>
          <span className="font-semibold">{formatVND(payload[1]?.value || 0)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const Charts = () => {
  const { summary } = useFund();
  const chartData = summary?.chart_data || [];

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Biểu Đồ So Sánh Thu vs Chi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xu hướng biến động dòng tiền 6 tháng gần nhất
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>Tổng Thu</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
            <span>Tổng Chi</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${val / 1000000}Tr`;
                  if (val >= 1000) return `${val / 1000}k`;
                  return val;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="income"
                name="Thu"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="expense"
                name="Chi"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Chưa có dữ liệu giao dịch để vẽ biểu đồ
          </div>
        )}
      </div>
    </div>
  );
};
