import React, { useState } from 'react';
import { 
  QrCode, 
  Building, 
  CreditCard, 
  User, 
  Copy, 
  Check, 
  Download, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare,
  DollarSign,
  Calendar,
  Zap,
  Edit3,
  Settings,
  ZoomIn,
  Maximize2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';
import { 
  generateVietQRUrl, 
  formatVND, 
  formatNumberInput, 
  parseFormattedNumber,
  getCurrentWeekInfo 
} from '../utils/formatters';

export const QuickPaySection = () => {
  const { isAdmin, openPinModal } = useAuth();
  const { settings, members, currentMonth, currentYear, submitMemberPayment, openSettingsModal } = useFund();

  const weekStatus = getCurrentWeekInfo(currentMonth, currentYear);
  const currentWeekObj = weekStatus.currentWeekObj;

  const weeklyAmount = Number(settings.weekly_amount) || 10000;
  const monthlyAmount = Number(settings.monthly_amount) || weeklyAmount * 4;

  const paymentPresets = [
    { 
      label: `1 Tuần (${formatVND(weeklyAmount)})`, 
      amount: weeklyAmount, 
      desc: currentWeekObj ? `1 tuần (${currentWeekObj.label}: ${currentWeekObj.shortRange})` : '1 tuần' 
    },
    { label: `2 Tuần (${formatVND(weeklyAmount * 2)})`, amount: weeklyAmount * 2, desc: '2 tuần' },
    { label: `⚡ Cả Tháng (${formatVND(monthlyAmount)} - 4 tuần)`, amount: monthlyAmount, desc: 'cả tháng (4 tuần)', isPopular: true },
    { label: `2 Tháng (${formatVND(monthlyAmount * 2)})`, amount: monthlyAmount * 2, desc: '2 tháng (8 tuần)' },
    { label: `Cả Năm (${formatVND(weeklyAmount * 52)})`, amount: weeklyAmount * 52, desc: 'cả năm' },
  ];

  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const [customAmount, setCustomAmount] = useState(formatNumberInput(monthlyAmount));
  const [selectedPreset, setSelectedPreset] = useState(monthlyAmount);
  const [note, setNote] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const selectedMember = members.find((m) => m.id === Number(selectedMemberId)) || members[0];
  const memberName = selectedMember?.name || 'Thành viên';
  const amountNumber = parseFormattedNumber(customAmount) || monthlyAmount;

  // Cú pháp chuyển khoản tự động
  const weekNoteSnippet = amountNumber === weeklyAmount && currentWeekObj
    ? `T${currentWeekObj.week}`
    : amountNumber >= monthlyAmount
    ? '4 tuan'
    : formatVND(amountNumber);

  const transferContent = note.trim()
    ? `${memberName} nop quy T${currentMonth}: ${note.trim()}`
    : `${memberName} nop quy T${currentMonth}/${currentYear} (${weekNoteSnippet})`;

  // Sinh link mã VietQR của Thủ quỹ
  const qrUrl = generateVietQRUrl({
    bankId: settings.bank_id || 'MBBank',
    accountNo: settings.bank_account_no || '0988888888',
    accountName: settings.bank_account_name || 'NGUYEN VAN THU QUY',
    amount: amountNumber,
    content: transferContent,
    template: settings.qr_template || 'compact2',
    customQrUrl: settings.custom_qr_url || '',
  });

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.amount);
    setCustomAmount(formatNumberInput(preset.amount));
  };

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
      link.download = `VietQR_DongQuy_${memberName}_${amountNumber}d.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  const handleConfirmSent = async () => {
    setIsSubmitting(true);
    try {
      await submitMemberPayment({
        member_id: Number(selectedMemberId),
        amount: amountNumber,
        note: transferContent,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenQrSettings = () => {
    if (isAdmin) {
      openSettingsModal();
    } else {
      openPinModal();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Banner Tiêu Đề */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-indigo-900 text-white shadow-xl shadow-indigo-500/15 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-brand-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quy Định Quỹ: {formatVND(weeklyAmount)} / Tuần ({formatVND(monthlyAmount)} / Tháng 4 tuần)
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Cổng Đóng Quỹ Tháng {currentMonth}/{currentYear}
          </h2>
          <p className="text-xs sm:text-sm text-brand-100/90 leading-relaxed">
            Chọn tên bạn, gói đóng (theo tuần, theo tháng hoặc theo năm). Hệ thống sẽ tự động tạo mã VietQR và tích đủ các tuần cho bạn!
          </p>
        </div>
      </div>

      {/* Grid: 2 Cột (Thông tin & Mã QR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN & GHI CHÚ */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                1. Chọn Thành Viên & Gói Đóng Quỹ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bạn có thể đóng từng tuần ({formatVND(weeklyAmount)}) hoặc đóng cả tháng ({formatVND(monthlyAmount)})
              </p>
            </div>

            {/* Nút thay đổi QR Thủ Quỹ */}
            <button
              onClick={handleOpenQrSettings}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:hover:bg-brand-900 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800 transition-colors shadow-2xs cursor-pointer"
              title="Thủ quỹ thay đổi STK & mã QR nhận tiền"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đổi QR Quỹ</span>
            </button>
          </div>

          {/* Chọn thành viên */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-500" />
              <span>Bạn là thành viên nào? <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.bank_id || 'MB'} - {m.bank_account_no || 'Chưa cập nhật'})
                </option>
              ))}
            </select>
          </div>

          {/* Gói đóng nhanh */}
          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" />
              <span>Chọn gói đóng quỹ nhanh</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentPresets.map((p) => {
                const isSelected = selectedPreset === p.amount;

                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`py-2 px-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                    }`}
                  >
                    <div className="truncate">{p.label}</div>
                    <div className="text-[10px] font-normal opacity-90">{formatVND(p.amount)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số tiền tùy chỉnh */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Số tiền chuyển khoản</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(formatNumberInput(e.target.value));
                  setSelectedPreset(null);
                }}
                className="w-full px-4 py-3 text-sm font-extrabold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="40.000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Ghi chú khi chuyển tiền */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span>Ghi chú / Lời nhắn cho Thủ quỹ</span>
              </span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">Lưu vào lịch sử thu chi</span>
            </label>
            <textarea
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Nộp 4 tuần tháng 9 + 20k tiền nước ngọt, nộp trước 2 tháng..."
              className="w-full px-4 py-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Chi tiết tài khoản Thủ quỹ */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-brand-500" />
                Ngân hàng Thủ quỹ:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {settings.bank_id || 'MBBank'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-brand-500" />
                Số tài khoản:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {settings.bank_account_no || '0988888888'}
                </span>
                <button
                  onClick={() => handleCopy(settings.bank_account_no || '0988888888', 'acc')}
                  className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:text-brand-600 cursor-pointer"
                  title="Sao chép STK"
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
                {settings.bank_account_name || 'NGUYEN VAN THU QUY'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Cú pháp CK:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand-600 dark:text-brand-400 truncate max-w-[200px]">
                  {transferContent}
                </span>
                <button
                  onClick={() => handleCopy(transferContent, 'content')}
                  className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:text-brand-600 cursor-pointer"
                  title="Sao chép nội dung"
                >
                  {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Quick edit link */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleOpenQrSettings}
                className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Thủ quỹ đổi STK/QR nhận tiền</span>
              </button>
            </div>
          </div>

          {/* Nút gửi thông báo đã chuyển */}
          <div className="pt-2">
            {isSubmitted ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 font-bold text-xs animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Đã ghi nhận đóng quỹ và tự động tích đủ tuần cho bạn!</span>
              </div>
            ) : (
              <button
                onClick={handleConfirmSent}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang gửi thông báo...' : '✅ Tôi Đã Chuyển Tiền & Gửi Ghi Chú Này Lên Web'}</span>
              </button>
            )}
          </div>

        </div>

        {/* CỘT PHẢI: MÃ VIETQR TỰ ĐỘNG SINH */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-between text-center space-y-4">
          
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200/60 dark:border-emerald-800">
                VietQR Quét Tự Điền Tiền
              </span>

              <button
                onClick={handleOpenQrSettings}
                className="text-[11px] text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                title="Đổi mã QR"
              >
                <Edit3 className="w-3 h-3" />
                <span>Đổi QR</span>
              </button>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-2">
              Đóng quỹ cho: <span className="text-brand-600 dark:text-brand-400">{memberName}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Số tiền: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatVND(amountNumber)}</strong>
              <span className="block text-[11px] text-slate-400 font-medium">
                (Tương đương {Math.max(1, Math.floor(amountNumber / weeklyAmount))} tuần đóng quỹ)
              </span>
            </p>
          </div>

          {/* Ảnh VietQR (Nhấp vào để phóng to) */}
          <div 
            onClick={() => setIsZoomOpen(true)}
            className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 max-w-[260px] relative group cursor-zoom-in transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
            title="Nhấp vào để phóng to mã QR"
          >
            <img
              src={qrUrl}
              alt="VietQR nộp quỹ"
              className="w-full h-auto rounded-xl object-contain"
            />
            
            {/* Overlay gợi ý phóng to khi hover */}
            <div className="absolute inset-0 rounded-2xl bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-[2px]">
              <ZoomIn className="w-4 h-4" />
              <span>Phóng to QR</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
            Mở App ngân hàng bất kỳ để quét mã. Nhấp vào ảnh để xem to rõ hơn.
          </p>

          {/* Các nút hành động: Phóng to & Tải ảnh */}
          <div className="w-full flex items-center gap-2">
            <button
              onClick={() => setIsZoomOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-xs border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Phóng To QR</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Ảnh QR</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL PHÓNG TO MÃ QR (LIGHTBOX) */}
      {isZoomOpen && (
        <div 
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center space-y-4 animate-slide-up"
          >
            {/* Nút đóng */}
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tiêu đề Modal */}
            <div className="space-y-1 pr-6">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                VietQR Quét Tự Điền Tiền
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                Đóng quỹ cho: <span className="text-brand-600 dark:text-brand-400">{memberName}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Số tiền: <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">{formatVND(amountNumber)}</strong>
              </p>
            </div>

            {/* Ảnh QR phóng to cực nét */}
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-[320px] flex items-center justify-center">
              <img
                src={qrUrl}
                alt="VietQR nộp quỹ phóng to"
                className="w-full h-auto rounded-xl object-contain"
              />
            </div>

            {/* Thông tin tài khoản tóm tắt */}
            <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-slate-900 dark:text-white">{settings.bank_id || 'MBBank'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">STK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{settings.bank_account_no || '0988888888'}</span>
                  <button
                    onClick={() => handleCopy(settings.bank_account_no || '0988888888', 'acc_zoom')}
                    className="p-0.5 rounded text-slate-500 hover:text-brand-600 cursor-pointer"
                    title="Copy STK"
                  >
                    {copiedField === 'acc_zoom' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cú pháp:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-brand-600 dark:text-brand-400 truncate max-w-[180px]">{transferContent}</span>
                  <button
                    onClick={() => handleCopy(transferContent, 'content_zoom')}
                    className="p-0.5 rounded text-slate-500 hover:text-brand-600 cursor-pointer"
                    title="Copy cú pháp"
                  >
                    {copiedField === 'content_zoom' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="w-full flex items-center gap-2 pt-1">
              <button
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Ảnh QR Về Máy</span>
              </button>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
