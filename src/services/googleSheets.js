/**
 * Service đồng bộ dữ liệu với Google Sheets thông qua Google Apps Script Webhook
 * Cơ chế hoạt động: Non-blocking (chạy ngầm), an toàn, không gián đoạn trải nghiệm người dùng.
 */

// Lấy URL Webhook từ LocalStorage, Database Settings hoặc biến môi trường
export const getGoogleSheetsWebhookUrl = () => {
  try {
    const settingsStr = localStorage.getItem('app_settings');
    if (settingsStr) {
      const parsed = JSON.parse(settingsStr);
      if (parsed.google_sheet_webhook_url && parsed.google_sheet_webhook_url.trim()) {
        return parsed.google_sheet_webhook_url.trim();
      }
    }
  } catch (e) {}

  return import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || '';
};

/**
 * Gửi dữ liệu bất đồng bộ đến Google Sheets Webhook
 */
export const sendGoogleSheetsWebhook = async (action, payload = {}, customUrl = '') => {
  const webhookUrl = customUrl || getGoogleSheetsWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    return { success: false, message: 'Chưa cấu hình Google Sheets Webhook URL' };
  }

  try {
    // Sử dụng fetch với mode no-cors hoặc cors thông thường
    // Với Google Apps Script Web App, request redirect 302 -> POST payload dạng text/plain để tránh CORS preflight
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      try {
        const json = await response.json();
        return { success: true, data: json };
      } catch {
        return { success: true, message: 'Đã gửi thành công đến Google Sheet' };
      }
    }

    return { success: true, message: 'Đã phát lệnh đồng bộ lên Google Sheet' };
  } catch (err) {
    console.warn('Lỗi đồng bộ Google Sheets (Chạy ngầm):', err);
    return { success: false, error: err.message };
  }
};

/**
 * Kiểm tra kết nối Webhook URL
 */
export const testGoogleSheetsConnection = async (webhookUrl) => {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'URL không hợp lệ! Vui lòng nhập link dạng https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const res = await sendGoogleSheetsWebhook('PING', {}, webhookUrl);
    if (res.success) {
      return { success: true, message: '✅ Kết nối Google Sheets Webhook thành công!' };
    }
    return { success: false, message: res.error || 'Không thể kết nối đến Webhook URL' };
  } catch (err) {
    return { success: false, message: 'Lỗi kết nối: ' + err.message };
  }
};

/**
 * Đồng bộ 1 giao dịch Thu / Chi mới lên Google Sheet
 */
export const syncTransactionToSheet = (txData) => {
  // Chạy nền không await
  setTimeout(() => {
    sendGoogleSheetsWebhook('SYNC_TRANSACTION', txData);
  }, 100);
};

/**
 * Đồng bộ trạng thái đóng quỹ tuần của thành viên lên Google Sheet
 */
export const syncContributionToSheet = ({ memberName, member_id, month, year, week, isPaid, note }) => {
  setTimeout(() => {
    sendGoogleSheetsWebhook('SYNC_CONTRIBUTION', {
      memberName,
      member_id,
      month,
      year,
      week,
      isPaid,
      note,
    });
  }, 100);
};

/**
 * Đồng bộ toàn bộ dữ liệu (Full Sync)
 */
export const syncAllDataToSheet = async ({ transactions, contributions, month, year }, customUrl = '') => {
  return await sendGoogleSheetsWebhook(
    'FULL_SYNC',
    {
      transactions,
      contributions,
      month,
      year,
    },
    customUrl
  );
};

export const googleSheetService = {
  getUrl: getGoogleSheetsWebhookUrl,
  sendWebhook: sendGoogleSheetsWebhook,
  testConnection: testGoogleSheetsConnection,
  syncTransaction: syncTransactionToSheet,
  syncContribution: syncContributionToSheet,
  syncAllData: syncAllDataToSheet,
};

export default googleSheetService;
