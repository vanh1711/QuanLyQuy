import React from 'react';
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
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';
import { formatVND, formatDate } from '../utils/formatters';

export const MemberTracker = ({ onOpenMemberQrModal }) => {
  const { isAdmin } = useAuth();
  const { contributions, toggleWeek, toggleFullMonth, currentMonth, currentYear } = useFund();

  // Tính toán tổng số tuần đã nộp của toàn bộ nhóm (10 người x 4 tuần = 40 lượt tuần)
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
                Bảng Theo Dõi Đóng Quỹ Theo Tuần (10k / tuần)
              </h3>
              <span className="whitespace-nowrap px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                Tháng {currentMonth}/{currentYear}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-11">
            {isAdmin ? (
              <span className="text-brand-600 dark:text-brand-400 font-semibold">
                💡 Quyền Thủ quỹ: Bấm trực tiếp vào từng Tuần (T1, T2, T3, T4) để đổi trạng thái hoặc bấm "Nộp cả tháng (40k)"
              </span>
            ) : (
              <span>Thành viên nộp theo tuần (10k) hoặc nộp theo tháng (40k) đều được hệ thống tự động ghi nhận</span>
            )}
          </p>
        </div>

        {/* Thống kê tiến độ tháng */}
        <div className="w-full lg:w-80 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tiến độ thu tháng {currentMonth}:
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {totalPaidWeeks}/40 tuần ({completionRate}%)
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
            <span>Mục tiêu: <strong>{formatVND(400000)}</strong></span>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách 10 Thành Viên x 4 Tuần */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contributions.map((c, index) => {
          const weeks = c.weeks || [];
          const isFullyPaid = c.is_month_fully_paid;
          const paidWeeksCount = c.paid_weeks_count || 0;
          const totalPaid = c.total_paid || 0;
          const debt = Math.max(0, 40000 - totalPaid);

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
                  onClick={() => onOpenMemberQrModal(c)}
                  className="flex items-center gap-3 cursor-pointer group"
                  title="Nhấp để mở mã QR chuyển tiền lại cho thành viên này"
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
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1.5">
                      <span>{c.member_name}</span>
                      <span className="text-[10px] font-normal text-slate-400">({c.member_bank_id || 'MB'})</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                    const isWeekPaid = w.is_paid === 1;

                    return (
                      <button
                        key={w.id || w.week}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => handleToggleWeek(w)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                          isWeekPaid
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                        } ${isAdmin ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : 'cursor-default'}`}
                        title={
                          isAdmin
                            ? `Tuần ${w.week}: ${isWeekPaid ? 'Đã nộp (Click để hủy)' : 'Chưa nộp (Click để tích đã nộp)'}`
                            : `Tuần ${w.week}: ${isWeekPaid ? 'Đã nộp' : 'Chưa nộp'}`
                        }
                      >
                        <div className="flex items-center gap-1">
                          {isWeekPaid && <Check className="w-3 h-3" />}
                          <span>Tuần {w.week}</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-90">10k</span>
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
                
                {/* Nút xem QR cá nhân thành viên */}
                <button
                  onClick={() => onOpenMemberQrModal(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>QR Hoàn tiền</span>
                </button>

                {/* Nút Đóng cả tháng (Dành cho Thủ quỹ 1-click) */}
                {isAdmin && (
                  <button
                    onClick={() => handleToggleFullMonth(c)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      isFullyPaid
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/30'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isFullyPaid ? 'Hủy cả tháng' : 'Nộp cả tháng (40k)'}</span>
                  </button>
                )}

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
