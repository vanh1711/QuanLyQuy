/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG ĐỒNG BỘ QUẢN LÝ QUỸ THỜI GIAN THỰC (REAL-TIME WEBHOOK)
 * =========================================================================================
 * HƯỚNG DẪN CẬP NHẬT:
 * 1. Mở file Google Sheets -> Tiện ích mở rộng -> Apps Script.
 * 2. Copy toàn bộ code này dán đè vào Code.gs và bấm Lưu (Ctrl + S).
 * 3. Bấm Triển khai (Deploy) -> Quản lý các bản triển khai (Manage deployments).
 * 4. Bấm biểu tượng cây bút ✏️ -> Tại mục "Phiên bản" chọn "Phiên bản mới" -> Bấm Triển khai.
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

    // 2. Đồng bộ 1 giao dịch Thu / Chi (Thêm hoặc Cập nhật)
    if (action === 'SYNC_TRANSACTION') {
      handleSyncTransaction(ss, payload);
      return jsonResponse({ status: 'success', message: 'Đã lưu giao dịch vào Sheet Lịch Sử Thu Chi' });
    }

    // 3. Xóa 1 giao dịch Thu / Chi khi hủy nộp hoặc xóa giao dịch
    if (action === 'DELETE_TRANSACTION') {
      handleDeleteTransaction(ss, payload);
      return jsonResponse({ status: 'success', message: 'Đã xóa giao dịch khỏi Sheet Lịch Sử Thu Chi' });
    }

    // 4. Đồng bộ trạng thái đóng quỹ tuần của thành viên
    if (action === 'SYNC_CONTRIBUTION') {
      handleSyncContribution(ss, payload);
      return jsonResponse({ status: 'success', message: 'Đã cập nhật trạng thái đóng quỹ tuần' });
    }

    // 5. Đồng bộ toàn bộ dữ liệu (Full Sync)
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

// Tự động đánh số lại STT 1, 2, 3, 4... liên tục không bị nhảy số
function renumberSTT(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var sttValues = [];
  for (var i = 1; i <= lastRow - 1; i++) {
    sttValues.push([i]);
  }
  sheet.getRange(2, 1, sttValues.length, 1).setValues(sttValues);
  sheet.getRange(2, 1, sttValues.length, 1).setHorizontalAlignment('center');
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

// Xử lý ghi/cập nhật giao dịch vào Sheet "Lịch Sử Thu Chi" với STT 1, 2, 3...
function handleSyncTransaction(ss, tx) {
  var headers = ['STT', 'Thời Gian', 'Loại', 'Số Tiền (VNĐ)', 'Danh Mục', 'Người Liên Quan', 'Nội Dung / Ghi Chú'];
  var sheet = getOrCreateSheet(ss, 'Lịch Sử Thu Chi', headers);

  var dateStr = tx.transaction_date || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  var typeStr = tx.type === 'income' ? 'Thu (+)' : 'Chi (-)';
  var amount = Number(tx.amount) || 0;
  var category = tx.category || 'Khác';
  var memberName = tx.member_name || tx.memberName || 'Thủ quỹ';
  var description = tx.description || '';

  // Kiểm tra xem giao dịch này đã có trong bảng chưa
  var data = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    var rowDate = data[i][1] ? data[i][1].toString().trim() : '';
    var rowMember = data[i][5] ? data[i][5].toString().trim() : '';
    var rowDesc = data[i][6] ? data[i][6].toString().trim() : '';

    if (rowMember === memberName && rowDesc === description && rowDate === dateStr) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow > 0) {
    // Đã có -> Cập nhật lại dòng này
    sheet.getRange(targetRow, 2, 1, 6).setValues([[dateStr, typeStr, amount, category, memberName, description]]);
    sheet.getRange(targetRow, 4).setNumberFormat('#,##0 "đ"');
    sheet.getRange(targetRow, 3).setFontColor(tx.type === 'income' ? '#16a34a' : '#dc2626');
  } else {
    // Chưa có -> Thêm dòng mới vào cuối
    var nextStt = sheet.getLastRow();
    sheet.appendRow([nextStt, dateStr, typeStr, amount, category, memberName, description]);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setNumberFormat('#,##0 "đ"');
    sheet.getRange(lastRow, 3).setFontColor(tx.type === 'income' ? '#16a34a' : '#dc2626');
  }

  // Luôn đánh lại số thứ tự STT 1, 2, 3, 4... liên tục
  renumberSTT(sheet);
}

// Xử lý xóa giao dịch khỏi Sheet "Lịch Sử Thu Chi" và đánh số lại STT
function handleDeleteTransaction(ss, payload) {
  var sheet = ss.getSheetByName('Lịch Sử Thu Chi');
  if (!sheet || sheet.getLastRow() <= 1) return;

  var data = sheet.getDataRange().getValues();
  var desc = payload.description ? payload.description.trim().toLowerCase() : '';
  var member = payload.memberName ? payload.memberName.trim().toLowerCase() : '';

  // Duyệt từ dưới lên trên để xóa đúng dòng
  for (var i = data.length - 1; i >= 1; i--) {
    var rowMember = data[i][5] ? data[i][5].toString().trim().toLowerCase() : '';
    var rowDesc = data[i][6] ? data[i][6].toString().trim().toLowerCase() : '';

    var isMatch = false;
    if (member && desc && rowMember === member && rowDesc.includes(desc)) {
      isMatch = true;
    } else if (desc && rowDesc.includes(desc)) {
      isMatch = true;
    }

    if (isMatch) {
      sheet.deleteRow(i + 1);
      break; // Xóa 1 dòng khớp nhất
    }
  }

  // Đánh lại số thứ tự STT sau khi xóa
  renumberSTT(sheet);
}

// Xử lý cập nhật đóng quỹ vào Sheet "Đóng Quỹ T{month}_{year}"
function handleSyncContribution(ss, payload) {
  var month = payload.month || (new Date().getMonth() + 1);
  var year = payload.year || new Date().getFullYear();
  var sheetName = 'Đóng Quỹ T' + month + '_' + year;

  var headers = ['STT', 'Họ & Tên Thành Viên', 'Ngân Hàng', 'Số Tài Khoản', 'Tuần 1 (01-07)', 'Tuần 2 (08-14)', 'Tuần 3 (15-21)', 'Tuần 4 (22-hết)', 'Tổng Đã Nộp (VNĐ)', 'Trạng Thái Tháng', 'Ghi Chú'];
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
    var isPaidStr = payload.isPaid ? '✅ Đã nộp' : '❌ Chưa nộp';
    sheet.getRange(targetRow, weekCol).setValue(isPaidStr);
    
    if (payload.isPaid) {
      sheet.getRange(targetRow, weekCol).setFontColor('#16a34a');
    } else {
      sheet.getRange(targetRow, weekCol).setFontColor('#dc2626');
    }

    // Đếm lại số tuần đã nộp để cập nhật Tổng tiền và Trạng thái
    var rowVals = sheet.getRange(targetRow, 5, 1, 4).getValues()[0];
    var paidCount = 0;
    for (var k = 0; k < rowVals.length; k++) {
      if (rowVals[k] && rowVals[k].toString().includes('Đã nộp')) {
        paidCount++;
      }
    }

    var totalAmt = paidCount * 10000;
    var statusStr = paidCount === 4 ? 'Đã nộp đủ 4/4 tuần' : 'Đã nộp ' + paidCount + '/4 tuần';

    sheet.getRange(targetRow, 9).setValue(totalAmt).setNumberFormat('#,##0 "đ"');
    sheet.getRange(targetRow, 10).setValue(statusStr);
  }
}

// Xử lý Đồng bộ toàn bộ dữ liệu (Full Sync)
function handleFullSync(ss, payload) {
  var transactions = payload.transactions || [];
  var contributions = payload.contributions || [];
  var month = payload.month || (new Date().getMonth() + 1);
  var year = payload.year || new Date().getFullYear();

  // 1. Ghi lại toàn bộ Sheet "Lịch Sử Thu Chi"
  var txHeaders = ['STT', 'Thời Gian', 'Loại', 'Số Tiền (VNĐ)', 'Danh Mục', 'Người Liên Quan', 'Nội Dung / Ghi Chú'];
  var txSheet = getOrCreateSheet(ss, 'Lịch Sử Thu Chi', txHeaders);
  
  // Xóa dữ liệu cũ trừ hàng tiêu đề
  if (txSheet.getLastRow() > 1) {
    txSheet.getRange(2, 1, txSheet.getLastRow() - 1, txHeaders.length).clearContent();
  }

  if (transactions.length > 0) {
    // Sắp xếp giao dịch theo ngày/thứ tự tăng dần
    var sortedTxs = transactions.slice().sort(function(a, b) {
      var dateA = new Date(a.transaction_date || 0);
      var dateB = new Date(b.transaction_date || 0);
      return dateA - dateB || (a.id || 0) - (b.id || 0);
    });

    var txRows = sortedTxs.map(function(t, idx) {
      return [
        idx + 1,
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
    txSheet.getRange(2, 1, txRows.length, 1).setHorizontalAlignment('center');

    // Tô màu cột loại Thu (+) / Chi (-)
    for (var r = 0; r < sortedTxs.length; r++) {
      var color = sortedTxs[r].type === 'income' ? '#16a34a' : '#dc2626';
      txSheet.getRange(r + 2, 3).setFontColor(color);
    }
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
    conSheet.getRange(2, 1, conRows.length, 1).setHorizontalAlignment('center');
  }
}
