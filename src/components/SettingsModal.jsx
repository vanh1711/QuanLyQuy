import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Building, 
  CreditCard, 
  User, 
  DollarSign, 
  Save, 
  Check, 
  QrCode, 
  Sparkles, 
  Layers, 
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Users,
  ShieldCheck,
  Upload,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Radio,
  Zap
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { googleSheetService } from '../services/googleSheets';
import { 
  VIETNAM_BANKS, 
  generateVietQRUrl, 
  formatNumberInput, 
  parseFormattedNumber, 
  formatVND 
} from '../utils/formatters';

const QR_TEMPLATES = [
  { id: 'compact2', name: 'Hiện đại (Có logo & Số tiền)', desc: 'Khuyên dùng - Đẹp & Rõ ràng nhất' },
  { id: 'compact', name: 'Gọn nhẹ (Có logo)', desc: 'Thẻ QR thu gọn' },
  { id: 'qr_only', name: 'Chỉ mã QR', desc: 'Chỉ hiển thị ô vuông QR' },
  { id: 'print', name: 'Bản in A4/A5', desc: 'Mẫu in chuyển khoản chuyên nghiệp' },
];

export const SettingsModal = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateAppSettings, 
    transactions, 
    contributions, 
    currentMonth, 
    currentYear 
  } = useFund();

  const [activeSubTab, setActiveSubTab] = useState('qr'); // 'qr', 'rules', 'pin', 'sheets'
  const [bankId, setBankId] = useState(settings.bank_id || 'MBBank');
  const [bankAccountNo, setBankAccountNo] = useState(settings.bank_account_no || '0988888888');
  const [bankAccountName, setBankAccountName] = useState(settings.bank_account_name || 'NGUYEN VAN THU QUY');
  const [qrTemplate, setQrTemplate] = useState(settings.qr_template || 'compact2');
  const [customQrUrl, setCustomQrUrl] = useState(settings.custom_qr_url || '');
  const [useCustomQr, setUseCustomQr] = useState(Boolean(settings.custom_qr_url));
  
  const [weeklyAmount, setWeeklyAmount] = useState(formatNumberInput(settings.weekly_amount || '10000'));
  const [monthlyAmount, setMonthlyAmount] = useState(formatNumberInput(settings.monthly_amount || '40000'));

  const [groupPassword, setGroupPassword] = useState(settings.group_password || '123456');
  const [copiedGroupPwd, setCopiedGroupPwd] = useState(false);

  // Google Sheets Webhook states
  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrl] = useState(
    settings.google_sheet_webhook_url || localStorage.getItem('GOOGLE_SHEET_WEBHOOK_URL') || ''
  );
  const [isTestingSheet, setIsTestingSheet] = useState(false);
  const [sheetTestResult, setSheetTestResult] = useState(null);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [fullSyncResult, setFullSyncResult] = useState(null);

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setBankId(settings.bank_id || 'MBBank');
      setBankAccountNo(settings.bank_account_no || '0988888888');
      setBankAccountName(settings.bank_account_name || 'NGUYEN VAN THU QUY');
      setQrTemplate(settings.qr_template || 'compact2');
      setCustomQrUrl(settings.custom_qr_url || '');
      setUseCustomQr(Boolean(settings.custom_qr_url));
      setWeeklyAmount(formatNumberInput(settings.weekly_amount || '10000'));
      setMonthlyAmount(formatNumberInput(settings.monthly_amount || '40000'));
      setGroupPassword(settings.group_password || '123456');
      setGoogleSheetWebhookUrl(
        settings.google_sheet_webhook_url || localStorage.getItem('GOOGLE_SHEET_WEBHOOK_URL') || ''
      );
      setSheetTestResult(null);
      setFullSyncResult(null);
      setNewPin('');
      setConfirmPin('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Nén ảnh QR siêu nhẹ (20-30KB) để lưu trữ tối ưu
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 450;
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

  const handleFundQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setCustomQrUrl(compressedDataUrl);
      setUseCustomQr(true);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Không thể đọc file ảnh, vui lòng thử lại');
    }
  };

  // Tính preview QR trực tiếp
  const previewAmount = parseFormattedNumber(monthlyAmount) || 40000;
  const livePreviewQrUrl = generateVietQRUrl({
    bankId,
    accountNo: bankAccountNo,
    accountName: bankAccountName,
    amount: previewAmount,
    content: `Test Nop Quy T9 (Preview)`,
    template: qrTemplate,
    customQrUrl: useCustomQr ? customQrUrl : '',
  });

  const handleWeeklyChange = (val) => {
    const formatted = formatNumberInput(val);
    setWeeklyAmount(formatted);
    const num = parseFormattedNumber(formatted);
    setMonthlyAmount(formatNumberInput(num * 4)); // Tự động x4 tuần cho tháng
  };

  const handleCopyGroupPassword = () => {
    navigator.clipboard.writeText(groupPassword);
    setCopiedGroupPwd(true);
    setTimeout(() => setCopiedGroupPwd(false), 2000);
  };

  const handleTestGoogleSheets = async () => {
    if (!googleSheetWebhookUrl.trim()) {
      setSheetTestResult({ success: false, message: 'Vui lòng dán Webhook URL của Google Apps Script trước!' });
      return;
    }
    setIsTestingSheet(true);
    setSheetTestResult(null);
    try {
      const res = await googleSheetService.testConnection(googleSheetWebhookUrl.trim());
      if (res.success) {
        setSheetTestResult({ success: true, message: res.message || 'Kết nối Google Sheet thành công 100%!' });
      } else {
        setSheetTestResult({ success: false, message: res.message || 'Không thể kết nối với Webhook URL' });
      }
    } catch (err) {
      setSheetTestResult({ success: false, message: err.message || 'Lỗi khi gửi request kiểm tra' });
    } finally {
      setIsTestingSheet(false);
    }
  };

  const handleFullSyncGoogleSheets = async () => {
    if (!googleSheetWebhookUrl.trim()) {
      setFullSyncResult({ success: false, message: 'Vui lòng dán Webhook URL của Google Apps Script trước!' });
      return;
    }
    setIsFullSyncing(true);
    setFullSyncResult(null);
    try {
      const res = await googleSheetService.syncAllData({
        transactions,
        contributions,
        month: currentMonth,
        year: currentYear
      }, googleSheetWebhookUrl.trim());

      if (res.success) {
        setFullSyncResult({ 
          success: true, 
          message: `Đồng bộ thành công ${transactions?.length || 0} giao dịch & ${contributions?.length || 0} thành viên lên Google Sheets!` 
        });
      } else {
        setFullSyncResult({ success: false, message: res.message || 'Lỗi trong quá trình đồng bộ' });
      }
    } catch (err) {
      setFullSyncResult({ success: false, message: err.message || 'Lỗi kết nối' });
    } finally {
      setIsFullSyncing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!bankAccountNo.trim()) {
      setErrorMsg('Vui lòng nhập số tài khoản ngân hàng');
      return;
    }
    if (!bankAccountName.trim()) {
      setErrorMsg('Vui lòng nhập tên chủ tài khoản');
      return;
    }

    if (!groupPassword.trim()) {
      setErrorMsg('Mật khẩu nhóm xem quỹ không được để trống');
      setActiveSubTab('pin');
      return;
    }

    if (newPin) {
      if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
        setErrorMsg('Mã PIN mới phải đúng 6 chữ số');
        setActiveSubTab('pin');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMsg('Mã PIN xác nhận không trùng khớp');
        setActiveSubTab('pin');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        bank_id: bankId,
        bank_account_no: bankAccountNo.trim(),
        bank_account_name: bankAccountName.trim().toUpperCase(),
        qr_template: qrTemplate,
        custom_qr_url: useCustomQr ? customQrUrl.trim() : '',
        weekly_amount: parseFormattedNumber(weeklyAmount).toString() || '10000',
        monthly_amount: parseFormattedNumber(monthlyAmount).toString() || '40000',
        group_password: groupPassword.trim(),
        google_sheet_webhook_url: googleSheetWebhookUrl.trim(),
      };

      if (newPin) {
        payload.admin_pin = newPin;
      }

      await updateAppSettings(payload);
      setSuccessMsg('Đã cập nhật cấu hình & mật khẩu thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg('Lỗi khi lưu cấu hình, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-brand-50 via-indigo-50 to-emerald-50 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cài Đặt Hệ Thống & Bảo Mật Quỹ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cập nhật thông tin STK, QR quỹ, mức đóng, Google Sheets và mật khẩu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1.5 px-6 pt-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('qr')}
            className={`flex items-center gap-1.5 pb-3 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSubTab === 'qr'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. Mã QR & STK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-1.5 pb-3 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSubTab === 'rules'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Mức Đóng Quỹ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pin')}
            className={`flex items-center gap-1.5 pb-3 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSubTab === 'pin'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>3. Bảo Mật & PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sheets')}
            className={`flex items-center gap-1.5 pb-3 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSubTab === 'sheets'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="flex items-center gap-1">
              <span>4. Google Sheets</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold uppercase animate-pulse">
                Live
              </span>
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-2xl border border-rose-200 font-semibold animate-fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-2xl border border-emerald-200 flex items-center gap-2 font-bold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CẤU HÌNH QR & TÀI KHOẢN THỦ QUỸ */}
          {activeSubTab === 'qr' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start animate-fade-in">
              
              {/* Cột trái: Form nhập liệu */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Chọn ngân hàng */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-brand-500" />
                    <span>Ngân hàng nhận tiền VietQR <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
                    <span>Số tài khoản Thủ Quỹ <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="Nhập số tài khoản ngân hàng..."
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                </div>

                {/* Tên chủ tài khoản */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-500" />
                    <span>Tên chủ tài khoản (In hoa không dấu) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN THU QUY"
                    className="w-full px-3.5 py-2.5 text-xs font-bold uppercase rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                </div>

                {/* Kiểu mẫu VietQR */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Kiểu hiển thị mã VietQR</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {QR_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setQrTemplate(tpl.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          qrTemplate === tpl.id
                            ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs truncate">{tpl.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">{tpl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tùy chọn Tải lên hoặc dán link ảnh QR riêng của Quỹ */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomQr}
                        onChange={(e) => setUseCustomQr(e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                      />
                      <span>Tải ảnh mã QR riêng của Quỹ (MoMo, ZaloPay, QR ngân hàng)</span>
                    </label>
                  </div>

                  {useCustomQr && (
                    <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-fade-in">
                      {customQrUrl ? (
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                          <img
                            src={customQrUrl}
                            alt="QR Quỹ"
                            className="w-16 h-16 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0"
                          />
                          <div className="flex-1 space-y-1">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Đã có ảnh QR riêng của Quỹ
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors inline-flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>Đổi ảnh QR khác</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFundQrUpload}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomQrUrl('');
                                  setUseCustomQr(false);
                                }}
                                className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold text-[11px] transition-colors inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-brand-500 bg-white dark:bg-slate-900 cursor-pointer transition-colors group">
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all mb-1" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600">
                              Bấm vào đây để tải ảnh QR Quỹ từ máy
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Hỗ trợ ảnh JPG, PNG, ảnh chụp màn hình MoMo, ngân hàng...
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFundQrUpload}
                            />
                          </label>

                          <input
                            type="url"
                            value={customQrUrl}
                            onChange={(e) => setCustomQrUrl(e.target.value)}
                            placeholder="Hoặc dán đường link ảnh QR (https://...)"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Cột phải: Live Preview Mã QR */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Xem trước mã QR trực tiếp:</span>
                </div>

                <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 max-w-[200px]">
                  <img
                    src={livePreviewQrUrl}
                    alt="VietQR Preview"
                    className="w-full h-auto rounded-lg object-contain"
                  />
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{bankId}</div>
                  <div className="font-mono">{bankAccountNo || '0988888888'}</div>
                  <div className="uppercase font-semibold text-brand-600 dark:text-brand-400">{bankAccountName || 'THU QUY'}</div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CẤU HÌNH MỨC ĐÓNG QUỸ */}
          {activeSubTab === 'rules' && (
            <div className="space-y-4 max-w-lg mx-auto py-2 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-1">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Quy định đóng quỹ tự động</span>
                </h4>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Hệ thống chia tháng thành 4 tuần. Khi thành viên nộp số tiền tương ứng, hệ thống sẽ tự động tích các tuần đã nộp.
                </p>
              </div>

              {/* Mức đóng 1 tuần */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Mức đóng quỹ cho 1 Tuần (VNĐ)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={weeklyAmount}
                    onChange={(e) => handleWeeklyChange(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-extrabold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ / Tuần
                  </span>
                </div>
              </div>

              {/* Mức đóng cả tháng */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-brand-500" />
                  <span>Mức đóng quỹ Cả Tháng (4 tuần)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(formatNumberInput(e.target.value))}
                    className="w-full px-4 py-3 text-sm font-extrabold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ / Tháng
                  </span>
                </div>
              </div>

              {/* Gợi ý mức */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-400 text-[11px]">Chọn nhanh:</span>
                {[10000, 20000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleWeeklyChange(amt.toString())}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {formatVND(amt)}/tuần ({formatVND(amt * 4)}/tháng)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU */}
          {activeSubTab === 'pin' && (
            <div className="space-y-5 max-w-lg mx-auto py-2 animate-fade-in">
              
              {/* PHẦN 1: MẬT KHẨU NHÓM (DÀNH CHO THÀNH VIÊN VÀO XEM WEB) */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                      Mật Khẩu Nhóm (Cho thành viên vào xem web)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyGroupPassword}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[11px] hover:bg-indigo-700 transition-colors shadow-xs"
                    title="Sao chép để gửi vào nhóm chat"
                  >
                    {copiedGroupPwd ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedGroupPwd ? 'Đã chép!' : 'Copy gửi nhóm'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300/90 leading-relaxed">
                  Bất kỳ ai mở web đều phải nhập mật khẩu này để xem thông tin quỹ. Bạn có thể thay đổi bất cứ khi nào.
                </p>

                <div className="space-y-1">
                  <label className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                    Mật khẩu truy cập nhóm hiện tại:
                  </label>
                  <input
                    type="text"
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    placeholder="Nhập mật khẩu nhóm (VD: 123456)..."
                    className="w-full px-3.5 py-2.5 font-mono font-bold text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {/* PHẦN 2: MÃ PIN QUẢN TRỊ (DÀNH RIÊNG CHO THỦ QUỸ) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    Mã PIN Thủ Quỹ (Quản trị toàn quyền)
                  </span>
                </div>

                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  Mã PIN 6 số dùng để mở khóa các thao tác: Thêm/Sửa/Xóa giao dịch, sửa thông tin STK và cấu hình hệ thống.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between text-[11px]">
                      <span>Đổi Mã PIN 6 Số Mới:</span>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px]"
                      >
                        {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPin ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                    </label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Để trống nếu không muốn đổi PIN (Mặc định: 888888)"
                      className="w-full px-3.5 py-2.5 text-center text-xs font-mono font-bold tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {newPin && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        Xác nhận lại mã PIN 6 số:
                      </label>
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Nhập lại đúng 6 số..."
                        className="w-full px-3.5 py-2.5 text-center text-xs font-mono font-bold tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TÍCH HỢP GOOGLE SHEETS THỜI GIAN THỰC */}
          {activeSubTab === 'sheets' && (
            <div className="space-y-5 max-w-lg mx-auto py-2 animate-fade-in">
              
              {/* Banner Giới Thiệu */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-emerald-500 text-white shadow-sm">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200">
                      Tự Động Ghi Dữ Liệu Vào Google Sheets
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>Real-time Webhook</span>
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/90 dark:text-emerald-300/90 leading-relaxed">
                  Mỗi khi có giao dịch <b>Thu/Chi</b> mới, <b>Đóng quỹ nhanh</b> hoặc <b>Đánh dấu tuần</b>, hệ thống sẽ tự động cập nhật ngay lập tức vào Google Sheet mà không làm đơ web.
                </p>
              </div>

              {/* Ô Nhập Webhook URL */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Google Apps Script Webhook URL:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">URL kết thúc bằng /exec</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={googleSheetWebhookUrl}
                    onChange={(e) => {
                      setGoogleSheetWebhookUrl(e.target.value);
                      setSheetTestResult(null);
                      setFullSyncResult(null);
                    }}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-20"
                  />
                  {googleSheetWebhookUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleSheetWebhookUrl('');
                        setSheetTestResult(null);
                        setFullSyncResult(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-rose-500 bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Nút Kiểm tra kết nối & Đồng bộ toàn bộ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleTestGoogleSheets}
                  disabled={isTestingSheet || !googleSheetWebhookUrl.trim()}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSheet ? 'animate-spin' : ''}`} />
                  <span>{isTestingSheet ? 'Đang Kiểm Tra...' : '🔗 Kiểm Tra Kết Nối'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFullSyncGoogleSheets}
                  disabled={isFullSyncing || !googleSheetWebhookUrl.trim()}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isFullSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isFullSyncing ? 'Đang Đồng Bộ...' : '🚀 Đồng Bộ Toàn Bộ'}</span>
                </button>
              </div>

              {/* Thông báo kết quả Test */}
              {sheetTestResult && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-fade-in ${
                  sheetTestResult.success
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {sheetTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{sheetTestResult.message}</span>
                </div>
              )}

              {/* Thông báo kết quả Full Sync */}
              {fullSyncResult && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-fade-in ${
                  fullSyncResult.success
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {fullSyncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{fullSyncResult.message}</span>
                </div>
              )}

              {/* Hướng Dẫn Cài Đặt Nhanh 1 Phút */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>📋 5 bước kết nối Google Sheets (Chỉ mất 1 phút):</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Đã có mã mẫu sẵn</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                  <li>Tạo 1 bảng tính Google Sheets mới trên Google Drive của bạn.</li>
                  <li>Vào menu <b>Tiện ích mở rộng (Extensions) &gt; Apps Script</b>.</li>
                  <li>Mở file <b><code className="text-brand-600 dark:text-brand-400 font-mono">google_apps_script.js</code></b> trong mã nguồn dự án, copy toàn bộ và dán vào Apps Script.</li>
                  <li>Bấm <b>Triển khai (Deploy) &gt; Tùy chọn triển khai mới (New deployment) &gt; Ứng dụng web (Web app)</b>. Chọn quyền truy cập: <b>Bất kỳ ai (Anyone)</b>.</li>
                  <li>Copy đường link <b>Web App URL</b> (kết thúc bằng <code className="text-emerald-600 font-mono">/exec</code>) dán vào ô bên trên và bấm <b>Lưu Thay Đổi</b>!</li>
                </ol>
              </div>

            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-2 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi & Cập Nhật Cấu Hình'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
