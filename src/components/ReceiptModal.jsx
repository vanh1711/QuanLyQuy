import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, imageUrl, description }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
              {description || 'Hóa đơn / Chứng từ thanh toán'}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Mở tab mới"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image preview */}
        <div className="flex-1 p-4 bg-slate-950 flex items-center justify-center overflow-auto min-h-[300px]">
          <img
            src={imageUrl}
            alt="Receipt preview"
            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
          />
        </div>

      </div>
    </div>
  );
};
