import React, { useState } from 'react';
import { X, Copy, Check, Download, QrCode, Building, User, CreditCard, Sparkles } from 'lucide-react';
import { useFund } from '../context/FundContext';
import { generateVietQRUrl, formatVND } from '../utils/formatters';

export const VietQRModal = ({ isOpen, onClose, memberContribution }) => {
  const { settings, currentMonth, currentYear } = useFund();
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !memberContribution) return null;

  const memberName = memberContribution.member_name || 'Thanh Vien';
  const amount = memberContribution.amount || settings.monthly_amount || 100000;
  const transferContent = `${memberName} nop quy T${currentMonth}/${currentYear}`;

  const qrUrl = generateVietQRUrl({
    bankId: settings.bank_id || 'MBBank',
    accountNo: settings.bank_account_no || '0988888888',
    accountName: settings.bank_account_name || 'NGUYEN VAN THU QUY',
    amount: amount,
    content: transferContent,
    template: 'compact2',
  });

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR_${memberName}_T${currentMonth}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mã VietQR Chuyển Khoản
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đóng quỹ: <span className="font-semibold text-brand-600 dark:text-brand-400">{memberName}</span>
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
        <div className="p-6 space-y-5">
          
          {/* QR Image Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200">
              <img
                src={qrUrl}
                alt="VietQR Mã chuyển khoản"
                className="w-56 h-auto rounded-lg object-contain"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 flex items-center gap-1 text-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Mở App Ngân Hàng bất kỳ (MB, VCB, Techcombank, Momo,...) để quét mã
            </p>
          </div>

          {/* Details & Copy Actions */}
          <div className="space-y-2.5 text-xs">
            
            {/* Ngân hàng */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Building className="w-4 h-4 text-brand-500" />
                <span>Ngân hàng:</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                {settings.bank_id || 'MBBank'}
              </span>
            </div>

            {/* Số tài khoản */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span>Số tài khoản:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {settings.bank_account_no || '0988888888'}
                </span>
                <button
                  onClick={() => handleCopy(settings.bank_account_no || '0988888888', 'acc')}
                  className="p-1 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-600 shadow-2xs"
                  title="Sao chép STK"
                >
                  {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Chủ tài khoản */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4 text-brand-500" />
                <span>Chủ tài khoản:</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                {settings.bank_account_name || 'NGUYEN VAN THU QUY'}
              </span>
            </div>

            {/* Số tiền */}
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Số tiền đóng:</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                {formatVND(amount)}
              </span>
            </div>

            {/* Nội dung chuyển khoản */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Cú pháp CK:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-600 dark:text-brand-400 truncate max-w-[180px]">
                  {transferContent}
                </span>
                <button
                  onClick={() => handleCopy(transferContent, 'content')}
                  className="p-1 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-600 shadow-2xs"
                  title="Sao chép nội dung"
                >
                  {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải ảnh QR
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-brand-600 dark:hover:bg-brand-400 transition-colors"
            >
              Đóng
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
