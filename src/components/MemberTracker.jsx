import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Check, 
  Users, 
  ArrowLeftRight, 
  CalendarDays,
  CreditCard,
  MessageSquare,
  Zap,
  Edit3,
  UserPlus,
  QrCode,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';
import { formatVND, formatDate, getMonthWeeksInfo, getCurrentWeekInfo } from '../utils/formatters';
import { MemberEditModal } from './MemberEditModal';

export const MemberTracker = ({ onOpenMemberQrModal }) => {
  const { isAdmin } = useAuth();
  const { contributions, toggleWeek, toggleFullMonth, currentMonth, currentYear } = useFund();

  // Modal Sửa / Thêm thành viên
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null);

  // Tính toán thông tin 4 tuần của tháng
  const weeksInfo = getMonthWeeksInfo(currentMonth, currentYear);
  const weekStatus = getCurrentWeekInfo(currentMonth, currentYear);

  // Tính toán tổng số tuần đã nộp của toàn bộ nhóm
  let totalWeeks = 0;
  let totalPaidWeeks = 0;
  let totalCollectedMoney = 0;

  contributions.forEach((c) => {
    const weeks = c.weeks || [];
    totalWeeks += weeks.length || 4;
    totalPaidWeeks += c.paid_weeks_count || 0;
    totalCollectedMoney += c.total_paid || 0;
  });

  const completionRate = totalWeeks > 0 ? Math.round((totalPaidWeeks / totalWeeks) * 100) : 0;

  const handleToggleWeek = (w) => {
    if (!isAdmin) return;
    if (w.is_paid === 0) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
    toggleWeek(w.id, w.is_paid);
  };

  const handleToggleFullMonth = (c) => {
    if (!isAdmin) return;
    const willBePaid = !c.is_month_fully_paid;
    if (willBePaid) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    }
    toggleFullMonth(c.member_id, c.is_month_fully_paid);
  };

  const handleOpenEditMember = (c) => {
    setIsCreatingMember(false);
    setSelectedMemberForEdit(c);
    setIsEditModalOpen(true);
  };

  const handleOpenCreateMember = () => {
    setIsCreatingMember(true);
    setSelectedMemberForEdit(null);
    setIsEditModalOpen(true);
  };

  // Avatar Initials
  const getInitials = (name) => {
    if (!name) return 'TV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* Header & Tiêu đề quy tắc */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Bảng Theo Dõi Đóng Quỹ Theo Tuần
              </h3>
              <span className="whitespace-nowrap px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                Tháng {currentMonth}/{currentYear}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-11">
            <span>
              💡 Thành viên & Thủ quỹ có thể bấm <strong>"Sửa & Up QR"</strong> trên mỗi thẻ để tự cập nhật tên, STK và ảnh QR nhận tiền hoàn của mình.
            </span>
          </p>
        </div>

        {/* Nút Thêm Thành Viên & Thống kê tiến độ tháng */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          
          <button
            type="button"
            onClick={handleOpenCreateMember}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Thêm Thành Viên</span>
          </button>

          {/* Thống kê tiến độ tháng */}
          <div className="w-full lg:w-72 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tiến độ thu tháng {currentMonth}:
              </span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {totalPaidWeeks}/{totalWeeks || 40} tuần ({completionRate}%)
              </span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Đã thu: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatVND(totalCollectedMoney)}</strong></span>
              <span>Mục tiêu: <strong>{formatVND((totalWeeks || 40) * 10000)}</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* Info Banner: Quy tắc 4 Tuần Chuẩn Trong Tháng */}
      <div className="p-3.5 bg-gradient-to-r from-brand-50/80 via-indigo-50/60 to-emerald-50/80 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-brand-100 dark:border-slate-700 space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              Lịch 4 tuần tháng {currentMonth}/{currentYear}:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-600 dark:text-slate-300">
              {weeksInfo.map((wi) => {
                const isCurrent = weekStatus.isCurrentMonth && weekStatus.currentWeek === wi.week;
                return (
                  <span
                    key={wi.week}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] transition-colors ${
                      isCurrent
                        ? 'bg-brand-600 text-white font-bold border-brand-600 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <strong>{wi.label}:</strong> {wi.dateRange}
                    {isCurrent && ' (⚡ Tuần này)'}
                  </span>
                );
              })}
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 italic">
            *Tuần 4 tính từ ngày 22 đến hết ngày {weeksInfo[3].endDate}/{currentMonth} để tháng luôn cố định 4 tuần (40k/tháng).
          </span>
        </div>
      </div>

      {/* Bảng Danh Sách Thành Viên x 4 Tuần */}
      {contributions.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto animate-bounce" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Chưa có thành viên nào trong danh sách
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Bấm vào nút "Thêm Thành Viên" ở trên để bắt đầu thêm người vào quỹ nhóm nhé!
          </p>
          <button
            onClick={handleOpenCreateMember}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            + Thêm Thành Viên Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contributions.map((c, index) => {
            const weeks = c.weeks || [];
            const isFullyPaid = c.is_month_fully_paid;
            const paidWeeksCount = c.paid_weeks_count || 0;
            const totalPaid = c.total_paid || 0;
            const debt = Math.max(0, 40000 - totalPaid);
            const hasCustomQr = !!c.member_qr_url;

            return (
              <div
                key={c.member_id || index}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-4 hover:shadow-md ${
                  isFullyPaid
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
                    : paidWeeksCount > 0
                    ? 'bg-brand-50/20 dark:bg-brand-950/10 border-brand-200/60 dark:border-brand-800/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                
                {/* Top: Thông tin thành viên & Trạng thái */}
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Avatar & Name */}
                  <div 
                    onClick={() => handleOpenEditMember(c)}
                    className="flex items-center gap-3 cursor-pointer group"
                    title="Nhấp để sửa tên, STK, xóa thành viên hoặc tải ảnh mã QR"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform ${
                        isFullyPaid
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : paidWeeksCount > 0
                          ? 'bg-brand-600 text-white shadow-brand-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {getInitials(c.member_name)}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1.5">
                          <span>{c.member_name}</span>
                          <span className="text-[10px] font-normal text-slate-400">({c.member_bank_id || 'MB'})</span>
                          <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-brand-600 inline" />
                        </h4>
                        {hasCustomQr && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5" title="Thành viên đã có ảnh mã QR riêng">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                            Đã có QR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Đã đóng: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatVND(totalPaid)}</strong>
                        {debt > 0 && <span className="text-rose-500 ml-1.5 font-medium">(Thiếu {formatVND(debt)})</span>}
                      </p>
                    </div>
                  </div>

                  {/* Badge trạng thái cả tháng */}
                  <div className="shrink-0">
                    {isFullyPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                        Đủ 4/4 tuần
                      </span>
                    ) : paidWeeksCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Đã nộp {paidWeeksCount}/4 tuần
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        Chưa nộp (0/4)
                      </span>
                    )}
                  </div>

                </div>

                {/* Middle: 4 Ô TUẦN TRONG THÁNG (T1, T2, T3, T4) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>Chi tiết 4 tuần tháng {currentMonth}:</span>
                    <span>10.000đ / tuần</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {weeks.map((w) => {
                      const isWeekPaid = w.is_paid === 1 || w.is_paid === true;
                      const wi = weeksInfo.find((item) => item.week === w.week) || { dateRange: '', shortRange: '' };
                      const isThisCurrentWeek = weekStatus.isCurrentMonth && weekStatus.currentWeek === w.week;

                      return (
                        <button
                          key={w.id || w.week}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleToggleWeek(w)}
                          className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                            isWeekPaid
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20'
                              : isThisCurrentWeek
                              ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-400 dark:border-brand-600 ring-2 ring-brand-500/30'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                          } ${isAdmin ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : 'cursor-default'}`}
                          title={
                            isAdmin
                              ? `Tuần ${w.week} (${wi.dateRange}): ${isWeekPaid ? 'Đã nộp (Click để hủy)' : 'Chưa nộp (Click để tích đã nộp)'}`
                              : `Tuần ${w.week} (${wi.dateRange}): ${isWeekPaid ? 'Đã nộp' : 'Chưa nộp'}`
                          }
                        >
                          {isThisCurrentWeek && !isWeekPaid && (
                            <span className="absolute -top-1.5 -right-1 px-1 py-0.2 text-[8px] font-extrabold bg-brand-600 text-white rounded-full shadow-2xs leading-tight animate-pulse">
                              Tuần này
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {isWeekPaid && <Check className="w-3 h-3" />}
                            <span>Tuần {w.week}</span>
                          </div>
                          <span className="text-[9px] font-medium opacity-85">{wi.shortRange}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lời nhắn / Ghi chú của thành viên nếu có */}
                {c.note && (
                  <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span className="truncate" title={c.note}>
                      Lời nhắn: <strong>{c.note}</strong>
                    </span>
                  </div>
                )}

                {/* Bottom: Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  
                  {/* Nút Sửa Tên, STK & Up QR Thành viên (Dành cho Cả Thành Viên & Thủ Quỹ) */}
                  <button
                    onClick={() => handleOpenEditMember(c)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    title="Sửa tên, STK, xóa thành viên hoặc upload ảnh mã QR riêng"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa & Up QR</span>
                  </button>

                  {/* Nút xem QR cá nhân thành viên để hoàn tiền */}
                  <button
                    onClick={() => onOpenMemberQrModal(c)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                      hasCustomQr
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{hasCustomQr ? 'Xem QR Riêng' : 'QR Hoàn Tiền'}</span>
                  </button>

                  {/* Nút Đóng cả tháng (Dành cho Thủ quỹ 1-click) */}
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleFullMonth(c)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isFullyPaid
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/30'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isFullyPaid ? 'Hủy' : 'Nộp tháng'}</span>
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Sửa & Thêm Thành Viên */}
      <MemberEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={selectedMemberForEdit}
        isCreating={isCreatingMember}
      />

    </div>
  );
};
