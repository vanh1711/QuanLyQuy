import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FundProvider, useFund } from './context/FundContext';
import { Header } from './components/Header';
import { MonthSelector } from './components/MonthSelector';
import { QuickPaySection } from './components/QuickPaySection';
import { KPICards } from './components/KPICards';
import { Charts } from './components/Charts';
import { MemberTracker } from './components/MemberTracker';
import { TransactionList } from './components/TransactionList';
import { VietQRModal } from './components/VietQRModal';
import { MemberQrModal } from './components/MemberQrModal';
import { TransactionModal } from './components/TransactionModal';
import { PinModal } from './components/PinModal';
import { SettingsModal } from './components/SettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AccessGateModal } from './components/AccessGateModal';
import { ShieldAlert, Zap } from 'lucide-react';

const MainContent = () => {
  const { activeTab, setActiveTab, isSettingsOpen, closeSettingsModal } = useFund();
  const { isAdmin } = useAuth();

  // Modal States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);

  const [isMemberQrModalOpen, setIsMemberQrModalOpen] = useState(false);
  const [selectedMemberForQr, setSelectedMemberForQr] = useState(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [receiptModal, setReceiptModal] = useState({
    isOpen: false,
    imageUrl: '',
    description: '',
  });

  // Handlers
  const handleOpenQr = (contribution) => {
    setSelectedContribution(contribution);
    setIsQrModalOpen(true);
  };

  const handleOpenMemberQr = (member) => {
    setSelectedMemberForQr(member);
    setIsMemberQrModalOpen(true);
  };

  const handleOpenAddTx = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenReceipt = (imageUrl, description) => {
    setReceiptModal({
      isOpen: true,
      imageUrl,
      description,
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Admin Status Notice Banner */}
      {isAdmin && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Chế độ Thủ Quỹ đang hoạt động. Bạn có quyền thêm/sửa/xóa giao dịch, đổi trạng thái và sửa thông tin STK của 10 thành viên.</span>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
            Admin Unlocked
          </span>
        </div>
      )}

      {/* Period Month Selector */}
      <MonthSelector />

      {/* TAB 1: ⚡ ĐÓNG QUỸ NHANH (Trang chuyên biệt cho thành viên đóng quỹ) */}
      {activeTab === 'quickpay' && (
        <div className="space-y-6 animate-fade-in">
          <QuickPaySection />
        </div>
      )}

      {/* TAB 2: TỔNG QUAN (Dashboard đầy đủ) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick CTA banner for paying */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-brand-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bạn muốn nộp tiền quỹ tháng này?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chuyển nhanh qua VietQR có sẵn số tiền & lưu ghi chú gửi Thủ Quỹ
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('quickpay')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all shrink-0"
            >
              Mở Trang Đóng Quỹ Nhanh →
            </button>
          </div>

          <KPICards />
          <MemberTracker onOpenMemberQrModal={handleOpenMemberQr} />
          <Charts />
          <TransactionList
            onOpenAddModal={handleOpenAddTx}
            onOpenEditModal={handleOpenEditTx}
            onOpenReceiptModal={handleOpenReceipt}
          />
        </div>
      )}

      {/* TAB 3: 10 THÀNH VIÊN */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-fade-in">
          <MemberTracker onOpenMemberQrModal={handleOpenMemberQr} />
        </div>
      )}

      {/* TAB 4: LỊCH SỬ THU CHI */}
      {activeTab === 'transactions' && (
        <div className="space-y-6 animate-fade-in">
          <KPICards />
          <TransactionList
            onOpenAddModal={handleOpenAddTx}
            onOpenEditModal={handleOpenEditTx}
            onOpenReceiptModal={handleOpenReceipt}
          />
        </div>
      )}

      {/* Modals */}
      <VietQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        memberContribution={selectedContribution}
      />

      <MemberQrModal
        isOpen={isMemberQrModalOpen}
        onClose={() => setIsMemberQrModalOpen(false)}
        member={selectedMemberForQr}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialData={editingTransaction}
      />

      <PinModal />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettingsModal}
      />

      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, imageUrl: '', description: '' })}
        imageUrl={receiptModal.imageUrl}
        description={receiptModal.description}
      />

      {/* Footer */}
      <footer className="pt-8 pb-4 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
        <p>Hệ thống Quản Lý Quỹ Nhóm & Đóng Quỹ Tự Động VietQR © 2026</p>
      </footer>
    </main>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold">Có lỗi xảy ra khi tải giao diện</h2>
          <p className="text-xs text-slate-400 max-w-md">
            Bộ nhớ đệm của trình duyệt có thể đang chứa dữ liệu phiên bản cũ. Bấm vào nút bên dưới để làm mới trang.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              🔄 Tải lại trang
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-brand-500/25"
            >
              🧹 Xóa bộ nhớ đệm & Làm mới
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FundProvider>
          <AppLayout isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        </FundProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const AppLayout = ({ isDarkMode, toggleTheme }) => {
  const { openSettingsModal } = useFund();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        onOpenSettings={openSettingsModal}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      <MainContent />
      <AccessGateModal />
    </div>
  );
};
