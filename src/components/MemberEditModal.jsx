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
  UserPlus,
  QrCode,
  Upload,
  Image,
  Sparkles
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
  const [qrUrl, setQrUrl] = useState('');
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
        setQrUrl('');
      } else {
        setName(member.member_name || member.name || '');
        setPhone(member.member_phone || member.phone || '');
        setBankId(member.member_bank_id || member.bank_id || 'MBBank');
        setBankAccountNo(member.member_bank_account_no || member.bank_account_no || '');
        setBankAccountName(member.member_bank_account_name || member.bank_account_name || '');
        setQrUrl(member.member_qr_url || member.qr_url || member.avatar_url || '');
      }
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, member, isCreating]);

  if (!isOpen) return null;

  const memberId = member?.member_id || member?.id;

  // Nén ảnh siêu nhẹ (khoảng 20-30KB) để lưu vào Supabase tức thì
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Xử lý upload file ảnh QR từ máy tính / điện thoại
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setQrUrl(compressedDataUrl);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Không thể đọc file ảnh, vui lòng thử lại');
    }
  };

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
        qr_url: qrUrl,
        avatar_url: qrUrl,
      });

      setSuccessMsg('Đã cập nhật thông tin thành viên thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg('Lỗi khi lưu thông tin, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/30">
              {isCreating ? <UserPlus className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isCreating ? 'Thêm Thành Viên Mới' : `Sửa Thành Viên: ${name || 'Thành viên'}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đổi tên, STK ngân hàng & tải ảnh QR nhận tiền hoàn
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

        {/* Form Body with Scroll */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ngân hàng */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-brand-500" />
                <span>Ngân hàng nhận tiền</span>
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                placeholder="Nhập STK nhận hoàn..."
                className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
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

          {/* UPLOAD MÃ QR CỦA THÀNH VIÊN */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-500" />
                <span>Ảnh Mã QR Hoàn Tiền của Thành Viên</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                Thủ Quỹ Tải Lên
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tải trực tiếp ảnh mã QR ngân hàng riêng của thành viên này lên để tiện quét hoàn tiền quỹ nhanh chóng.
            </p>

            {/* Khung xem trước hoặc nút upload */}
            {qrUrl ? (
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <img
                  src={qrUrl}
                  alt="QR Thành viên"
                  className="w-20 h-20 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0"
                />
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đã có ảnh mã QR riêng
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Đổi ảnh khác</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setQrUrl('')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 font-bold text-[11px] transition-colors inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa QR</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-brand-500 dark:hover:border-brand-400 bg-white dark:bg-slate-900 cursor-pointer transition-colors group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600">
                    Bấm vào đây để tải ảnh QR từ máy
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ ảnh JPG, PNG, chụp màn hình ngân hàng
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Hoặc dán link URL trực tiếp */}
                <div className="pt-1">
                  <input
                    type="url"
                    value={qrUrl}
                    onChange={(e) => setQrUrl(e.target.value)}
                    placeholder="Hoặc dán đường link ảnh QR (https://...)"
                    className="w-full px-3 py-2 text-[11px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
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
