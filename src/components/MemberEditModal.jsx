import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Building, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  UserPlus 
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { VIETNAM_BANKS } from '../utils/formatters';

export const MemberEditModal = ({ isOpen, onClose, member, isCreating = false }) => {
  const { updateMemberBankInfo } = useFund();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankId, setBankId] = useState('MBBank');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isCreating || !member) {
        setName('');
        setPhone('');
        setBankId('MBBank');
        setBankAccountNo('');
        setBankAccountName('');
      } else {
        setName(member.member_name || member.name || '');
        setPhone(member.member_phone || member.phone || '');
        setBankId(member.member_bank_id || member.bank_id || 'MBBank');
        setBankAccountNo(member.member_bank_account_no || member.bank_account_no || '');
        setBankAccountName(member.member_bank_account_name || member.bank_account_name || '');
      }
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, member, isCreating]);

  if (!isOpen) return null;

  const memberId = member?.member_id || member?.id;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên thành viên');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await updateMemberBankInfo(memberId, {
        name: name.trim(),
        phone: phone.trim(),
        bank_id: bankId,
        bank_account_no: bankAccountNo.trim(),
        bank_account_name: bankAccountName.trim().toUpperCase() || name.trim().toUpperCase(),
      });

      setSuccessMsg('Đã cập nhật thông tin thành viên thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 800);
    } catch (err) {
      setErrorMsg('Lỗi khi lưu thông tin, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/30">
              {isCreating ? <UserPlus className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isCreating ? 'Thêm Thành Viên Mới' : `Sửa Thông Tin: ${name || 'Thành viên'}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thủ quỹ đổi tên, số điện thoại và STK nhận tiền hoàn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tên thành viên */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-500" />
              <span>Họ và Tên thành viên <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn An, Trần Thị Bình..."
              className="w-full px-4 py-3 text-sm font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-brand-500" />
              <span>Số điện thoại (tùy chọn)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912..."
              className="w-full px-4 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Ngân hàng */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-500" />
              <span>Ngân hàng nhận tiền</span>
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Số tài khoản */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-brand-500" />
              <span>Số tài khoản</span>
            </label>
            <input
              type="text"
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
              placeholder="Nhập STK để tạo QR hoàn tiền..."
              className="w-full px-4 py-2.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Tên chủ tài khoản */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Tên chủ tài khoản (In hoa không dấu)
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN AN"
              className="w-full px-4 py-2.5 text-xs font-bold uppercase rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thành Viên'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
