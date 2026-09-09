import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';
import { formatVND, formatDate, exportTransactionsToExcel } from '../utils/formatters';

export const TransactionList = ({ onOpenAddModal, onOpenEditModal, onOpenReceiptModal }) => {
  const { isAdmin } = useAuth();
  const { transactions, removeTransaction, summary, contributions, currentMonth, currentYear, settings } = useFund();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Categories list extracted from transactions
  const categories = useMemo(() => {
    const defaultCats = [
      'Thu quỹ định kỳ',
      'Tài trợ',
      'Ăn uống',
      'Thuê sân/địa điểm',
      'Mua sắm dụng cụ',
      'Khác',
    ];
    const existing = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean)));
    return Array.from(new Set([...defaultCats, ...existing]));
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchMember = (t.member_name || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        if (!matchDesc && !matchMember && !matchCat) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  const handleExportExcel = () => {
    let totalPaidWeeks = 0;
    contributions.forEach((c) => {
      totalPaidWeeks += c.paid_weeks_count || 0;
    });

    exportTransactionsToExcel(
      filteredTransactions,
      {
        totalBalance: summary.total_balance,
        totalIncome: summary.month_income,
        totalExpense: summary.month_expense,
        totalPaidWeeks: totalPaidWeeks,
      },
      contributions,
      currentMonth,
      currentYear
    );
  };

  const handleDelete = (id, desc) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giao dịch "${desc || 'này'}"?`)) {
      removeTransaction(id);
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Lịch Sử Giao Dịch Thu / Chi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị {filteredTransactions.length} giao dịch trong kỳ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Xem Google Sheet Trực Tuyến */}
          {settings.google_sheet_view_url && (
            <a
              href={settings.google_sheet_view_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors shadow-xs group"
              title="Mở Google Sheets trực tuyến để xem số liệu thời gian thực"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Xem Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </a>
          )}

          {/* Nút Xuất Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
            title="Xuất file Excel báo cáo"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          {/* Nút Thêm giao dịch (Thủ quỹ) */}
          {isAdmin && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khoản Thu/Chi</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung, người nộp, danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all ${
              typeFilter === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
            }`}
          >
            Chỉ Thu (+)
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all ${
              typeFilter === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
            }`}
          >
            Chỉ Chi (-)
          </button>
        </div>

        {/* Category Select */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isIncome = t.type === 'income';

            return (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all gap-3"
              >
                
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                    }`}
                  >
                    {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {t.description || t.category}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {t.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.transaction_date)}
                      </span>
                      {t.member_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {t.member_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Bill Preview & Admin Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800">
                  
                  {/* Bill Receipt Button */}
                  {t.receipt_url && (
                    <button
                      onClick={() => onOpenReceiptModal(t.receipt_url, t.description)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      title="Xem ảnh hóa đơn"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Xem bill</span>
                    </button>
                  )}

                  {/* Amount */}
                  <div
                    className={`font-extrabold text-sm sm:text-base tracking-tight ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatVND(t.amount)}
                  </div>

                  {/* Admin Edit/Delete */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                      <button
                        onClick={() => onOpenEditModal(t)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Chỉnh sửa giao dịch"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.description)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
