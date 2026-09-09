# 📊 HƯỚNG DẪN LIÊN KẾT WEB QUẢN LÝ QUỸ VỚI GOOGLE SHEETS THỜI GIAN THỰC

Chỉ mất **1 phút** để kết nối Web Quản Lý Quỹ với Google Sheets của bạn. Dữ liệu sẽ tự động nhảy vào Sheet ngay khi có giao dịch hoặc nộp quỹ mới!

---

### BƯỚC 1: TẠO GOOGLE SHEET & MỞ APPS SCRIPT
1. Truy cập [sheets.new](https://sheets.new) để tạo một bảng tính Google Sheets mới.
2. Đặt tên cho file Google Sheet (Ví dụ: **"Quản Lý Quỹ Nhóm 2026"**).
3. Trên thanh Menu trên cùng, nhấp vào: **Tiện ích mở rộng** *(Extensions)* ➜ **Apps Script**.

---

### BƯỚC 2: DÁN ĐOẠN MÃ GOOGLE APPS SCRIPT
1. Xóa toàn bộ nội dung mẫu đang có trong file `Code.gs`.
2. Mở file [google_apps_script.js](file:///d:/laragon/www/QuanLyQuy/google_apps_script.js) trong thư mục dự án, **sao chép toàn bộ mã** và dán vào `Code.gs`.
3. Nhấn biểu tượng 💾 **Lưu dự án** *(Ctrl + S)*.

---

### BƯỚC 3: TRIỂN KHAI THÀNH WEBHOOK (WEB APP)
1. Ở góc trên cùng bên phải, nhấp nút màu xanh **Triển khai** *(Deploy)* ➜ Chọn **Tùy chọn triển khai mới** *(New deployment)*.
2. Nhấp vào biểu tượng bánh răng **⚙️ Chọn loại** ➜ Chọn **Ứng dụng web** *(Web app)*.
3. Điền thông tin như sau:
   - **Mô tả**: `QuanLyQuy Webhook`
   - **Thực thi dưới dạng** *(Execute as)*: **Tôi (email của bạn)** *(Me)*
   - **Ai có quyền truy cập** *(Who has access)*: **Bất kỳ ai** *(Anyone)*  ⚠️ *(Rất quan trọng để Web gửi dữ liệu vào được!)*
4. Nhấp nút **Triển khai** *(Deploy)*.
5. Nếu Google yêu cầu cấp quyền:
   - Bấm **Ủy quyền truy cập** *(Authorize access)* ➜ Chọn tài khoản Google của bạn.
   - Bấm **Nâng cao** *(Advanced)* ➜ Chọn **Đi tới ... (không an toàn)** *(Go to ... unsafe)* ➜ Bấm **Cho phép** *(Allow)*.
6. Sao chép đường dẫn tại mục **URL của ứng dụng web** *(Web app URL)* có dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

### BƯỚC 4: DÁN LINK VÀO WEB QUẢN LÝ QUỸ
1. Mở trang Web Quản Lý Quỹ của bạn.
2. Nhấp vào nút ⚙️ **Cài Đặt** (ở góc phải trên cùng hoặc mục Thủ Quỹ).
3. Tìm đến ô **"Google Sheets Webhook URL"** và dán đường link vừa sao chép vào.
4. Bấm **"🔗 Kiểm tra kết nối"** ➜ Khi hiện thông báo **"✅ Kết nối thành công"**, bấm **"Lưu Cài Đặt"**.
5. Bấm nút **"🚀 Đồng bộ toàn bộ dữ liệu lên Google Sheet"** để toàn bộ lịch sử thu chi và danh sách đóng quỹ 4 tuần được điền tự động vào Google Sheet ngay lập tức!
