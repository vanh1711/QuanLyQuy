import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';
import { useFund } from '../context/FundContext';
import { formatNumberInput, parseFormattedNumber } from '../utils/formatters';

const DEFAULT_CATEGORIES = [
  'Thu quỹ định kỳ',
  'Tài trợ',
  'Ăn uống',
  'Thuê sân/địa điểm',
  'Mua sắm dụng cụ',
  'Liên hoan / Cafe',
  'Khác',
];

export const TransactionModal = ({ isOpen, onClose, initialData = null }) => {
  const { addTransaction, editTransaction, members } = useFund();

  const [type, setType] = useState('income');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [category, setCategory] = useState('Thu quỹ định kỳ');
  const [memberName, setMemberName] = useState('Thủ quỹ');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'income');
      setFormattedAmount(formatNumberInput(initialData.amount || ''));
      setCategory(initialData.category || 'Ăn uống');
      setMemberName(initialData.member_name || 'Thủ quỹ');
      setDescription(initialData.description || '');
      setTransactionDate(initialData.transaction_date || new Date().toISOString().slice(0, 10));
      setReceiptUrl(initialData.receipt_url || '');
    } else {
      setType('income');
      setFormattedAmount('');
      setCategory('Thu quỹ định kỳ');
      setMemberName('Thủ quỹ');
      setDescription('');
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setReceiptUrl('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFormattedNumber(formattedAmount);
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }
    if (!category.trim()) {
      setError('Vui lòng chọn hoặc nhập danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount,
        category,
        member_name: memberName,
        description,
        transaction_date: transactionDate,
        receipt_url: receiptUrl,
      };

      if (initialData?.id) {
        await editTransaction(initialData.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (err) {
      setError('Đã xảy ra lỗi khi lưu giao dịch. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {initialData ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Khoản Thu / Chi Mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loại giao dịch (Thu / Chi) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Khoản Thu (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Khoản Chi (-)</span>
            </button>
          </div>

          {/* Số tiền */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Số tiền (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ví dụ: 250.000"
                value={formattedAmount}
                onChange={(e) => setFormattedAmount(formatNumberInput(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Danh mục & Ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Ngày giao dịch
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Người liên quan / Người thực hiện */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Người liên quan / thực hiện
            </label>
            <input
              type="text"
              list="members-list"
              placeholder="Thủ quỹ, hoặc tên thành viên..."
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <datalist id="members-list">
              <option value="Thủ quỹ" />
              {members.map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
          </div>

          {/* Ghi chú / Lý do */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Nội dung / Lý do chi tiết
            </label>
            <textarea
              rows="2"
              placeholder="Mô tả cụ thể (ví dụ: Mua 10 chai nước khoáng, tiền sân tuần 2...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Link ảnh hóa đơn / Bill */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Đường dẫn ảnh hóa đơn / Bill (tùy chọn)</span>
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="url"
              placeholder="https://imgur.com/... hoặc link ảnh bất kỳ"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            {receiptUrl && (
              <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                <img
                  src={receiptUrl}
                  alt="Bill preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Xem trước ảnh hóa đơn
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Giao Dịch'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
