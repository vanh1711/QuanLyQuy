import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Building, 
  CreditCard, 
  User, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Save, 
  ArrowLeftRight,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';
import { 
  VIETNAM_BANKS, 
  generateVietQRUrl, 
  formatVND, 
  formatNumberInput, 
  parseFormattedNumber 
} from '../utils/formatters';

export const MemberQrModal = ({ isOpen, onClose, member }) => {
  const { isAdmin } = useAuth();
  const { updateMemberBankInfo } = useFund();

  const [refundAmount, setRefundAmount] = useState('50.000');
  const [transferReason, setTransferReason] = useState('Hoan tien quy');
  const [copiedField, setCopiedField] = useState(null);

  // Chế độ chỉnh sửa thông tin STK của thành viên
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankId, setBankId] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');

  if (!isOpen || !member) return null;

  const currentBankId = bankId || member.member_bank_id || member.bank_id || 'MBBank';
  const currentAccountNo = accountNo || member.member_bank_account_no || member.bank_account_no || member.phone || '0912345678';
  const currentAccountName = accountName || member.member_bank_account_name || member.bank_account_name || member.member_name || member.name || 'THANH VIEN';
  const memberDisplayName = member.member_name || member.name || 'Thành viên';

  const amountNumber = parseFormattedNumber(refundAmount) || 50000;
  const content = transferReason.trim() || `Chuyen tien cho ${memberDisplayName}`;

  // Sinh mã VietQR của thành viên
  const qrUrl = generateVietQRUrl({
    bankId: currentBankId,
    accountNo: currentAccountNo,
    accountName: currentAccountName,
    amount: amountNumber,
    content: content,
    template: 'compact2',
  });

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR_ChuyenTien_${memberDisplayName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  const handleSaveBankInfo = async () => {
    await updateMemberBankInfo(member.member_id || member.id, {
      name: memberDisplayName,
      bank_id: currentBankId,
      bank_account_no: currentAccountNo,
      bank_account_name: currentAccountName,
      phone: member.member_phone || member.phone || '',
    });
    setIsEditingBank(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mã QR Chuyển Tiền Cho: {memberDisplayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dành cho Thủ quỹ hoặc thành viên chuyển lại tiền / chia tiền
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* QR Image & Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 shrink-0">
              <img
                src={qrUrl}
                alt={`VietQR ${memberDisplayName}`}
                className="w-40 sm:w-44 h-auto rounded-lg object-contain"
              />
            </div>

            <div className="flex-1 space-y-3 w-full">
              {/* Số tiền cần chuyển lại */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Số tiền muốn chuyển lại</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(formatNumberInput(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-extrabold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    placeholder="50.000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[10px] text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Lý do chuyển tiền */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Lý do chuyển / Nội dung
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Hoan tien mua do, chia quy..."
                />
              </div>

              {/* Tải QR */}
              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh QR thành viên</span>
              </button>
            </div>
          </div>

          {/* Thông tin tài khoản của thành viên */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Thông tin tài khoản nhận tiền
              </span>
              <button
                onClick={() => {
                  if (isEditingBank) {
                    handleSaveBankInfo();
                  } else {
                    setBankId(currentBankId);
                    setAccountNo(currentAccountNo);
                    setAccountName(currentAccountName);
                    setIsEditingBank(true);
                  }
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                {isEditingBank ? (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Lưu thông tin</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa STK thành viên</span>
                  </>
                )}
              </button>
            </div>

            {isEditingBank ? (
              <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 rounded-2xl border border-brand-200 dark:border-brand-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Ngân hàng</label>
                  <select
                    value={currentBankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {VIETNAM_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Số tài khoản</label>
                  <input
                    type="text"
                    value={currentAccountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Chủ tài khoản (In hoa)</label>
                  <input
                    type="text"
                    value={currentAccountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold uppercase"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-brand-500" />
                    Ngân hàng:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentBankId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-brand-500" />
                    Số tài khoản:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {currentAccountNo}
                    </span>
                    <button
                      onClick={() => handleCopy(currentAccountNo, 'acc')}
                      className="p-1 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                      title="Sao chép"
                    >
                      {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-500" />
                    Chủ tài khoản:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {currentAccountName}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-brand-600 transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
