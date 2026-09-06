import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Info,
  ExternalLink
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

  // All Hooks must be at the very top
  const [refundAmount, setRefundAmount] = useState('50.000');
  const [transferReason, setTransferReason] = useState('Hoan tien quy');
  const [copiedField, setCopiedField] = useState(null);

  // Edit bank info state
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankId, setBankId] = useState('MBBank');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [activeQrTab, setActiveQrTab] = useState('vietqr');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever member changes or modal opens
  useEffect(() => {
    if (isOpen && member) {
      const bId = member.member_bank_id || member.bank_id || 'MBBank';
      const aNo = member.member_bank_account_no || member.bank_account_no || '';
      const aName = member.member_bank_account_name || member.bank_account_name || member.member_name || member.name || '';
      const customImg = member.member_qr_url || member.qr_url || member.avatar_url || '';

      setBankId(bId);
      setAccountNo(aNo);
      setAccountName(aName);
      setActiveQrTab(customImg ? 'custom' : 'vietqr');
      setIsEditingBank(false);
      setSaveSuccess(false);
    }
  }, [isOpen, member]);

  // Safe early exit AFTER hooks
  if (!isOpen || !member) return null;

  const memberDisplayName = member.member_name || member.name || 'Thành viên';
  const customQrImage = member.member_qr_url || member.qr_url || member.avatar_url || '';

  const currentBankId = bankId || 'MBBank';
  const currentAccountNo = accountNo || '';
  const currentAccountName = accountName || memberDisplayName;

  const amountNumber = parseFormattedNumber(refundAmount) || 50000;
  const content = transferReason.trim() || `Chuyen tien cho ${memberDisplayName}`;

  // Sinh mã VietQR của thành viên
  const vietQrUrl = generateVietQRUrl({
    bankId: currentBankId,
    accountNo: currentAccountNo || '0988888888',
    accountName: currentAccountName,
    amount: amountNumber,
    content: content,
    template: 'compact2',
  });

  const displayQrUrl = activeQrTab === 'custom' && customQrImage ? customQrImage : vietQrUrl;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(displayQrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_ChuyenTien_${memberDisplayName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(displayQrUrl, '_blank');
    }
  };

  const handleSaveBankInfo = async () => {
    await updateMemberBankInfo(member.member_id || member.id, {
      name: memberDisplayName,
      bank_id: currentBankId,
      bank_account_no: currentAccountNo,
      bank_account_name: currentAccountName,
      phone: member.member_phone || member.phone || '',
      qr_url: customQrImage,
      avatar_url: customQrImage,
    });
    setIsEditingBank(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up my-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mã QR Chuyển Tiền: {memberDisplayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thông tin số tài khoản & mã QR nhận tiền của thành viên
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Tabs nếu thành viên có ảnh QR thủ quỹ đã tải lên */}
          {customQrImage && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveQrTab('custom')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeQrTab === 'custom'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ảnh QR Riêng (Thủ quỹ up)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveQrTab('vietqr')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeQrTab === 'vietqr'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-brand-500" />
                <span>VietQR Tự Động</span>
              </button>
            </div>
          )}

          {/* QR Image & Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-200 shrink-0 flex items-center justify-center">
              <img
                src={displayQrUrl}
                alt={`QR ${memberDisplayName}`}
                className="w-40 sm:w-44 h-auto max-h-56 rounded-xl object-contain"
                onError={(e) => {
                  e.target.src = vietQrUrl;
                }}
              />
            </div>

            <div className="flex-1 space-y-3 w-full">
              {activeQrTab === 'vietqr' || !customQrImage ? (
                <>
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
                        className="w-full px-3 py-2 text-xs font-extrabold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
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
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      placeholder="Hoan tien mua do, chia quy..."
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Đang hiển thị mã QR gốc của thành viên
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Mã QR này do Thủ Quỹ tải lên trực tiếp. Bạn có thể mở ứng dụng ngân hàng quét trực tiếp mã này để chuyển tiền.
                  </p>
                </div>
              )}

              {/* Tải QR */}
              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh QR này về máy</span>
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-bold">
              ✅ Đã cập nhật thông tin tài khoản thành công!
            </div>
          )}

          {/* Thông tin tài khoản của thành viên */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Thông tin tài khoản nhận tiền
              </span>
              <button
                onClick={() => {
                  if (isEditingBank) {
                    handleSaveBankInfo();
                  } else {
                    setIsEditingBank(true);
                  }
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
              >
                {isEditingBank ? (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Lưu STK này</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Cập nhật STK</span>
                  </>
                )}
              </button>
            </div>

            {isEditingBank ? (
              <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 rounded-2xl border border-brand-200 dark:border-brand-800 space-y-3 animate-fade-in">
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
                    placeholder="Nhập STK ngân hàng..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Chủ tài khoản (In hoa)</label>
                  <input
                    type="text"
                    value={currentAccountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold uppercase"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveBankInfo}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu & Cập Nhật Mã QR</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
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
                  {currentAccountNo ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {currentAccountNo}
                      </span>
                      <button
                        onClick={() => handleCopy(currentAccountNo, 'acc')}
                        className="p-1 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        title="Sao chép STK"
                      >
                        {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Chưa cập nhật STK</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-500" />
                    Chủ tài khoản:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {currentAccountName || memberDisplayName}
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
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-brand-600 hover:text-white transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
