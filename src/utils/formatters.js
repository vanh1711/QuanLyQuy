import * as XLSX from 'xlsx';

/**
 * Định dạng số tiền VNĐ (Ví dụ: 100.000 đ)
 */
export const formatVND = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  const num = Math.round(Number(amount));
  return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
};

/**
 * Định dạng số tiền không có chữ đ (dùng cho input)
 */
export const formatNumberInput = (value) => {
  if (!value) return '';
  const cleanValue = value.toString().replace(/\D/g, '');
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse chuỗi tiền về số nguyên
 */
export const parseFormattedNumber = (formattedStr) => {
  if (!formattedStr) return 0;
  return parseInt(formattedStr.toString().replace(/\./g, '').replace(/,/g, ''), 10) || 0;
};

/**
 * Định dạng ngày (DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const VIETNAM_BANKS = [
  { code: 'MBBank', name: 'MB Bank (Quân Đội)', shortName: 'MB' },
  { code: 'Vietcombank', name: 'Vietcombank (Ngoại Thương VN)', shortName: 'VCB' },
  { code: 'Techcombank', name: 'Techcombank (Kỹ Thương VN)', shortName: 'TCB' },
  { code: 'BIDV', name: 'BIDV (Đầu Tư và Phát Triển VN)', shortName: 'BIDV' },
  { code: 'VietinBank', name: 'VietinBank (Công Thương VN)', shortName: 'CTG' },
  { code: 'VPBank', name: 'VPBank (Việt Nam Thịnh Vượng)', shortName: 'VPB' },
  { code: 'TPBank', name: 'TPBank (Tiên Phong)', shortName: 'TPB' },
  { code: 'ACB', name: 'ACB (Á Châu)', shortName: 'ACB' },
  { code: 'Sacombank', name: 'Sacombank (Sài Gòn Thương Tín)', shortName: 'STB' },
  { code: 'VIB', name: 'VIB (Quốc Tế Việt Nam)', shortName: 'VIB' },
  { code: 'Agribank', name: 'Agribank (Nông Nghiệp & PTNT)', shortName: 'VBA' },
  { code: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)', shortName: 'SHB' },
  { code: 'OCB', name: 'OCB (Phương Đông)', shortName: 'OCB' },
  { code: 'MSB', name: 'MSB (Hàng Hải)', shortName: 'MSB' },
  { code: 'HDBank', name: 'HDBank (Phát Triển TP.HCM)', shortName: 'HDB' },
  { code: 'SeABank', name: 'SeABank (Đông Nam Á)', shortName: 'SEA' },
  { code: 'LPBank', name: 'LPBank (Bưu Điện Liên Việt)', shortName: 'LPB' },
  { code: 'Eximbank', name: 'Eximbank (Xuất Nhập Khẩu VN)', shortName: 'EIB' },
  { code: 'NamABank', name: 'Nam A Bank (Nam Á)', shortName: 'NAB' },
  { code: 'BaoVietBank', name: 'BaoViet Bank (Bảo Việt)', shortName: 'BVB' },
  { code: 'VietABank', name: 'VietABank (Việt Á)', shortName: 'VAB' },
  { code: 'BacABank', name: 'Bac A Bank (Bắc Á)', shortName: 'BAB' },
  { code: 'Kienlongbank', name: 'Kienlongbank (Kiên Long)', shortName: 'KLB' },
  { code: 'PVcomBank', name: 'PVcomBank (Đại Chúng VN)', shortName: 'PVC' },
  { code: 'Cake', name: 'Cake by VPBank (Ngân hàng số Cake)', shortName: 'Cake' },
  { code: 'Timo', name: 'Timo by BVBank (Ngân hàng số Timo)', shortName: 'Timo' },
  { code: 'ZaloPay', name: 'Ví ZaloPay', shortName: 'ZaloPay' },
  { code: 'MoMo', name: 'Ví MoMo', shortName: 'MoMo' },
  { code: 'ViettelMoney', name: 'Viettel Money', shortName: 'ViettelPay' },
];

/**
 * Tạo URL mã VietQR chuẩn xác
 */
export const generateVietQRUrl = ({
  bankId = 'MBBank',
  accountNo = '0988888888',
  accountName = 'NGUYEN VAN THU QUY',
  amount = 10000,
  content = 'Nop quy',
  template = 'compact2',
  customQrUrl = '',
}) => {
  if (customQrUrl && customQrUrl.trim() !== '') {
    return customQrUrl.trim();
  }
  const cleanBank = encodeURIComponent((bankId || 'MBBank').trim());
  const cleanAcc = encodeURIComponent((accountNo || '0988888888').trim());
  const cleanName = encodeURIComponent((accountName || 'NGUYEN VAN THU QUY').trim());
  const cleanAmount = encodeURIComponent(amount || 0);
  const cleanContent = encodeURIComponent((content || '').trim());
  const cleanTemplate = encodeURIComponent(template || 'compact2');

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-${cleanTemplate}.png?amount=${cleanAmount}&addInfo=${cleanContent}&accountName=${cleanName}`;
};

/**
 * Xuất dữ liệu quỹ thời gian thực ra file Excel (.xlsx) với 3 Sheet chuyên nghiệp
 */
export const exportTransactionsToExcel = (transactions, summaryInfo = {}, contributions = []) => {
  const workbook = XLSX.utils.book_new();
  const nowStr = new Date().toLocaleString('vi-VN', { hour12: false });

  // ===================== SHEET 1: MA TRẬN ĐÓNG QUỸ THEO TUẦN =====================
  if (contributions && contributions.length > 0) {
    const weeklyData = contributions.map((c, index) => {
      const weeks = c.weeks || [];
      const w1 = weeks.find((w) => w.week === 1);
      const w2 = weeks.find((w) => w.week === 2);
      const w3 = weeks.find((w) => w.week === 3);
      const w4 = weeks.find((w) => w.week === 4);

      const totalPaid = c.total_paid || 0;
      const debt = Math.max(0, 40000 - totalPaid);

      return {
        'STT': index + 1,
        'Họ & Tên': c.member_name,
        'Ngân Hàng': c.member_bank_id || 'MBBank',
        'Số Tài Khoản': c.member_bank_account_no || '0912345678',
        'Tuần 1 (10k)': w1?.is_paid === 1 ? 'Đã nộp (10.000đ)' : 'Chưa nộp',
        'Tuần 2 (10k)': w2?.is_paid === 1 ? 'Đã nộp (10.000đ)' : 'Chưa nộp',
        'Tuần 3 (10k)': w3?.is_paid === 1 ? 'Đã nộp (10.000đ)' : 'Chưa nộp',
        'Tuần 4 (10k)': w4?.is_paid === 1 ? 'Đã nộp (10.000đ)' : 'Chưa nộp',
        'Tổng Đã Nộp (VNĐ)': totalPaid,
        'Còn Thiếu (VNĐ)': debt,
        'Trạng Thái Tháng': c.is_month_fully_paid ? 'Đã nộp đủ cả tháng' : `Đã nộp ${c.paid_weeks_count || 0}/4 tuần`,
        'Ghi Chú / Lời Nhắn': c.note || '',
      };
    });

    const weeklySheet = XLSX.utils.json_to_sheet(weeklyData);
    weeklySheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 22 }, // Tên
      { wch: 15 }, // Ngân hàng
      { wch: 16 }, // STK
      { wch: 18 }, // T1
      { wch: 18 }, // T2
      { wch: 18 }, // T3
      { wch: 18 }, // T4
      { wch: 18 }, // Đã nộp
      { wch: 16 }, // Còn thiếu
      { wch: 22 }, // Trạng thái
      { wch: 35 }, // Ghi chú
    ];
    XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Theo Dõi Đóng Quỹ Tuần');
  }

  // ===================== SHEET 2: LỊCH SỬ THU CHI CHI TIẾT =====================
  const txData = transactions.map((t, index) => ({
    'STT': index + 1,
    'Ngày giao dịch': formatDate(t.transaction_date),
    'Loại': t.type === 'income' ? 'Thu (+)' : 'Chi (-)',
    'Số tiền (VNĐ)': Number(t.amount),
    'Danh mục': t.category,
    'Người liên quan': t.member_name || 'Thủ quỹ',
    'Nội dung / Lý do': t.description || '',
    'Ảnh chứng từ/Bill': t.receipt_url || 'Không có',
  }));

  const txSheet = XLSX.utils.json_to_sheet(txData);
  txSheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Ngày
    { wch: 10 }, // Loại
    { wch: 18 }, // Số tiền
    { wch: 20 }, // Danh mục
    { wch: 20 }, // Người liên quan
    { wch: 40 }, // Nội dung
    { wch: 30 }, // Link ảnh
  ];
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Lịch Sử Thu Chi');

  // ===================== SHEET 3: BÁO CÁO TỔNG KẾT THỜI GIAN THỰC =====================
  const summaryData = [
    { 'Chỉ tiêu báo cáo': 'Số dư quỹ hiện tại', 'Giá trị': formatVND(summaryInfo.totalBalance || 0) },
    { 'Chỉ tiêu báo cáo': 'Tổng thu trong kỳ', 'Giá trị': formatVND(summaryInfo.totalIncome || 0) },
    { 'Chỉ tiêu báo cáo': 'Tổng chi trong kỳ', 'Giá trị': formatVND(summaryInfo.totalExpense || 0) },
    { 'Chỉ tiêu báo cáo': 'Tổng số lượt tuần đã thu', 'Giá trị': `${summaryInfo.totalPaidWeeks || 0} / 40 lượt tuần` },
    { 'Chỉ tiêu báo cáo': 'Thời gian xuất file (Realtime)', 'Giá trị': nowStr },
    { 'Chỉ tiêu báo cáo': 'Quy tắc đóng quỹ', 'Giá trị': '10.000 VNĐ / tuần (40.000 VNĐ / tháng)' },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng Kết Thời Gian Thực');

  const fileTimestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
  const fileName = `Bao_Cao_Quy_Realtime_${fileTimestamp}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
