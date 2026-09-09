/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG ĐỒNG BỘ QUẢN LÝ QUỸ THỜI GIAN THỰC (REAL-TIME WEBHOOK)
 * =========================================================================================
 * HƯỚNG DẪN CÀI ĐẶT NHANH TRONG 1 PHÚT:
 * 1. Mở file Google Sheets mới (hoặc file có sẵn).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết mã cũ trong file Code.gs và dán toàn bộ đoạn mã này vào.
 * 4. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment).
 * 5. Nhấp vào biểu tượng bánh răng (⚙️) -> Chọn "Ứng dụng web" (Web app).
 * 6. Điền:
 *    - Mô tả: "QuanLyQuy Webhook"
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) - *Rất quan trọng!*
 * 7. Nhấn "Triển khai" (Deploy) -> Cấp quyền cho script -> Sao chép "URL của ứng dụng web" (Web App URL).
 * 8. Dán URL này vào mục Cài Đặt trên web Quản Lý Quỹ!
 * =========================================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'success',
      message: 'Google Apps Script Webhook Quản Lý Quỹ đang hoạt động thời gian thực!',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'Không có dữ liệu gửi đến (No postData)' });
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'PING';
    var payload = data.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Kiểm tra kết nối
    if (action === 'PING') {
      return jsonResponse({
        status: 'success',
        message: 'Kết nối Google Sheet thành công!',
        sheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Đồng bộ 1 giao dịch Thu / Chi
    if (action === 'SYNC_TRANSACTION') {
      handleSyncTransaction(ss, payload);
      return jsonResponse({ status: 'success', message: 'Đã lưu giao dịch vào Sheet Lịch Sử Thu Chi' });
    }

    // 3. Đồng bộ trạng thái đóng quỹ tuần
    if (action === 'SYNC_CONTRIBUTION') {
      handleSyncContribution(ss, payload);
      return jsonResponse({ status: 'success', message: 'Đã cập nhật trạng thái đóng quỹ tuần' });
    }

    // 4. Đồng bộ toàn bộ dữ liệu (Full Sync)
    if (action === 'FULL_SYNC') {
      handleFullSync(ss, payload);
      return jsonResponse({ status: 'success', message: 'Đã đồng bộ toàn bộ dữ liệu lên Google Sheets thành công!' });
    }

    return jsonResponse({ status: 'warning', message: 'Không nhận diện được action: ' + action });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * =========================================================================================
 * CÁC HÀM XỬ LÝ DỮ LIỆU TỪNG SHEET
 * =========================================================================================
 */

// Helper trả về JSON chuẩn
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lấy hoặc tự động tạo Sheet theo tên kèm tiêu đề cột đẹp mắt
function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1e293b'); // Dark Slate
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// Xử lý ghi giao dịch vào Sheet "Lịch Sử Thu Chi"
function handleSyncTransaction(ss, tx) {
  var headers = ['Mã GD', 'Thời Gian', 'Loại', 'Số Tiền (VNĐ)', 'Danh Mục', 'Người Liên Quan', 'Nội Dung / Ghi Chú'];
  var sheet = getOrCreateSheet(ss, 'Lịch Sử Thu Chi', headers);

  var txId = tx.id ? '#' + tx.id : '#' + Date.now();
  var dateStr = tx.transaction_date || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  var typeStr = tx.type === 'income' ? 'Thu (+)' : 'Chi (-)';
  var amount = Number(tx.amount) || 0;
  var category = tx.category || 'Khác';
  var memberName = tx.member_name || tx.memberName || 'Thủ quỹ';
  var description = tx.description || '';

  // Thêm dòng mới
  sheet.appendRow([txId, dateStr, typeStr, amount, category, memberName, description]);

  // Format số tiền cột D
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 4).setNumberFormat('#,##0 "đ"');
  
  // Highlight màu theo loại thu chi
  var typeCell = sheet.getRange(lastRow, 3);
  if (tx.type === 'income') {
    typeCell.setFontColor('#16a34a'); // Green
  } else {
    typeCell.setFontColor('#dc2626'); // Red
  }
}

// Xử lý cập nhật đóng quỹ vào Sheet "Theo Dõi Đóng Quỹ Tuần"
function handleSyncContribution(ss, payload) {
  var month = payload.month || (new Date().getMonth() + 1);
  var year = payload.year || new Date().getFullYear();
  var sheetName = 'Đóng Quỹ T' + month + '_' + year;

  var headers = ['STT', 'Họ & Tên Thành Viên', 'Ngân Hàng', 'Số Tài Khoản', 'Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tổng Đã Nộp (VNĐ)', 'Trạng Thái Tháng', 'Ghi Chú'];
  var sheet = getOrCreateSheet(ss, sheetName, headers);

  var memberName = payload.memberName || payload.member_name;
  if (!memberName) return;

  var data = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().trim() === memberName.trim()) {
      targetRow = i + 1;
      break;
    }
  }

  // Nếu tìm thấy dòng thành viên, cập nhật tuần tương ứng
  if (targetRow > 0 && payload.week) {
    var weekCol = 4 + Number(payload.week); // Cột E (T1), F (T2), G (T3), H (T4)
    var isPaidStr = payload.isPaid ? '✅ Đã nộp (10.000đ)' : '❌ Chưa nộp';
    sheet.getRange(targetRow, weekCol).setValue(isPaidStr);
    
    if (payload.isPaid) {
      sheet.getRange(targetRow, weekCol).setFontColor('#16a34a');
    } else {
      sheet.getRange(targetRow, weekCol).setFontColor('#dc2626');
    }
  }
}

// Xử lý Đồng bộ toàn bộ dữ liệu (Full Sync)
function handleFullSync(ss, payload) {
  var transactions = payload.transactions || [];
  var contributions = payload.contributions || [];
  var month = payload.month || (new Date().getMonth() + 1);
  var year = payload.year || new Date().getFullYear();

  // 1. Ghi lại toàn bộ Sheet "Lịch Sử Thu Chi"
  var txHeaders = ['Mã GD', 'Thời Gian', 'Loại', 'Số Tiền (VNĐ)', 'Danh Mục', 'Người Liên Quan', 'Nội Dung / Ghi Chú'];
  var txSheet = getOrCreateSheet(ss, 'Lịch Sử Thu Chi', txHeaders);
  
  // Xóa dữ liệu cũ trừ hàng tiêu đề
  if (txSheet.getLastRow() > 1) {
    txSheet.getRange(2, 1, txSheet.getLastRow() - 1, txHeaders.length).clearContent();
  }

  if (transactions.length > 0) {
    var txRows = transactions.map(function(t) {
      return [
        t.id ? '#' + t.id : '',
        t.transaction_date || '',
        t.type === 'income' ? 'Thu (+)' : 'Chi (-)',
        Number(t.amount) || 0,
        t.category || '',
        t.member_name || '',
        t.description || ''
      ];
    });
    txSheet.getRange(2, 1, txRows.length, txHeaders.length).setValues(txRows);
    txSheet.getRange(2, 4, txRows.length, 1).setNumberFormat('#,##0 "đ"');
  }

  // 2. Ghi lại Sheet "Đóng Quỹ Tuần"
  var conSheetName = 'Đóng Quỹ T' + month + '_' + year;
  var conHeaders = ['STT', 'Họ & Tên Thành Viên', 'Ngân Hàng', 'Số Tài Khoản', 'Tuần 1 (01-07)', 'Tuần 2 (08-14)', 'Tuần 3 (15-21)', 'Tuần 4 (22-hết)', 'Tổng Đã Nộp (VNĐ)', 'Trạng Thái Tháng', 'Ghi Chú'];
  var conSheet = getOrCreateSheet(ss, conSheetName, conHeaders);

  if (conSheet.getLastRow() > 1) {
    conSheet.getRange(2, 1, conSheet.getLastRow() - 1, conHeaders.length).clearContent();
  }

  if (contributions.length > 0) {
    var conRows = contributions.map(function(c, idx) {
      var weeks = c.weeks || [];
      var w1 = weeks.find(function(w) { return w.week === 1; });
      var w2 = weeks.find(function(w) { return w.week === 2; });
      var w3 = weeks.find(function(w) { return w.week === 3; });
      var w4 = weeks.find(function(w) { return w.week === 4; });

      return [
        idx + 1,
        c.member_name || '',
        c.member_bank_id || 'MBBank',
        c.member_bank_account_no || '',
        (w1 && w1.is_paid === 1) ? '✅ Đã nộp' : '❌ Chưa nộp',
        (w2 && w2.is_paid === 1) ? '✅ Đã nộp' : '❌ Chưa nộp',
        (w3 && w3.is_paid === 1) ? '✅ Đã nộp' : '❌ Chưa nộp',
        (w4 && w4.is_paid === 1) ? '✅ Đã nộp' : '❌ Chưa nộp',
        Number(c.total_paid) || 0,
        c.is_month_fully_paid ? 'Đã nộp đủ 4/4 tuần' : 'Đã nộp ' + (c.paid_weeks_count || 0) + '/4 tuần',
        c.note || ''
      ];
    });

    conSheet.getRange(2, 1, conRows.length, conHeaders.length).setValues(conRows);
    conSheet.getRange(2, 9, conRows.length, 1).setNumberFormat('#,##0 "đ"');
  }
}
