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
  Sparkles,
  Upload
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { VIETNAM_BANKS } from '../utils/formatters';

export const MemberQrModal = ({ isOpen, onClose, member }) => {
  const { updateMemberBankInfo } = useFund();

  const [copiedField, setCopiedField] = useState(null);

  // Edit bank info state
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankId, setBankId] = useState('MBBank');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [memberQrImage, setMemberQrImage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Nén ảnh siêu nhẹ (khoảng 20-30KB) để lưu tức thì
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
      setMemberQrImage(customImg);
      setIsEditingBank(false);
      setSaveSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, member]);

  // Safe early exit AFTER hooks
  if (!isOpen || !member) return null;

  const memberDisplayName = member.member_name || member.name || 'Thành viên';
  const memberId = member.member_id || member.id;

  const currentBankId = bankId || 'MBBank';
  const currentAccountNo = accountNo || '';
  const currentAccountName = accountName || memberDisplayName;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = async () => {
    if (!memberQrImage) return;
    try {
      if (memberQrImage.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = memberQrImage;
        link.download = `QR_NhanTien_${memberDisplayName.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const response = await fetch(memberQrImage);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_NhanTien_${memberDisplayName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(memberQrImage, '_blank');
    }
  };

  const handleMemberQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setMemberQrImage(compressedDataUrl);
      setErrorMsg('');

      // Tự động lưu ảnh QR lên database
      await updateMemberBankInfo(memberId, {
        name: memberDisplayName,
        bank_id: currentBankId,
        bank_account_no: currentAccountNo,
        bank_account_name: currentAccountName,
        phone: member.member_phone || member.phone || '',
        qr_url: compressedDataUrl,
        avatar_url: compressedDataUrl,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg('Không thể nén ảnh, vui lòng thử lại');
    }
  };

  const handleSaveBankInfo = async () => {
    await updateMemberBankInfo(memberId, {
      name: memberDisplayName,
      bank_id: currentBankId,
      bank_account_no: currentAccountNo,
      bank_account_name: currentAccountName,
      phone: member.member_phone || member.phone || '',
      qr_url: memberQrImage,
      avatar_url: memberQrImage,
    });
    setIsEditingBank(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up my-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mã QR Nhận Tiền: {memberDisplayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quét mã để chuyển tiền hoặc hoàn quỹ cho {memberDisplayName}
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
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 font-bold">
              {errorMsg}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-bold animate-fade-in">
              ✅ Đã cập nhật ảnh mã QR & thông tin thành công!
            </div>
          )}

          {/* QR Image & Controls */}
          {memberQrImage ? (
            <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 shrink-0 flex items-center justify-center">
                <img
                  src={memberQrImage}
                  alt={`QR ${memberDisplayName}`}
                  className="w-48 sm:w-52 h-auto max-h-64 rounded-xl object-contain"
                />
              </div>

              <div className="w-full space-y-3">
                <div className="space-y-1 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Mã QR Cá Nhân Đã Đăng
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Mở App ngân hàng hoặc ví điện tử bất kỳ để quét mã chuyển tiền cho {memberDisplayName}.
                  </p>
                </div>

                {/* Tải QR & Đổi ảnh */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải ảnh QR</span>
                  </button>
                  <label className="cursor-pointer py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                    <Upload className="w-3.5 h-3.5 text-brand-500" />
                    <span>Đổi ảnh QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMemberQrUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Khung kêu gọi tải ảnh QR khi chưa có */
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {memberDisplayName} chưa tải ảnh mã QR lên
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  Tải ảnh mã QR ngân hàng hoặc ví MoMo/ZaloPay của bạn lên để nhận tiền hoàn quỹ nhanh chóng.
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all">
                <Upload className="w-4 h-4" />
                <span>Bấm vào đây để tải ảnh QR lên</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMemberQrUpload}
                />
              </label>
            </div>
          )}

          {/* Thông tin tài khoản của thành viên */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Thông tin số tài khoản
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
                    <span className="text-emerald-600 font-bold">Lưu STK</span>
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Chủ tài khoản (In hoa)</label>
                  <input
                    type="text"
                    value={currentAccountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveBankInfo}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thông Tin STK</span>
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
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-brand-600 hover:text-white transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

