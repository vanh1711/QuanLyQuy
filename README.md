# 🌟 Web Quản Lý Quỹ Nhóm & Đóng Quỹ Tự Động VietQR

Ứng dụng Web Quản Lý Quỹ Nhóm hiện đại, minh bạch, bảo mật và hỗ trợ chuyển khoản tự động qua mã VietQR.

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI ONLINE MIỄN PHÍ (SUPABASE + VERCEL)

Để có link web online chia sẻ cho 10 thành viên truy cập trên điện thoại mọi lúc mọi nơi, hãy làm theo 2 bước đơn giản sau:

---

### BƯỚC 1: KHỞI TẠO CƠ SỞ DỮ LIỆU MIỄN PHÍ TRÊN SUPABASE

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập (hoặc đăng ký bằng tài khoản GitHub).
2. Bấm **"New Project"** -> Nhập tên dự án (VD: `QuanLyQuy`) và đặt mật khẩu database.
3. Chờ 1-2 phút để Supabase tạo database xong.
4. Ở menu bên trái, chọn **SQL Editor** -> Bấm **"New query"**.
5. Mở file [`supabase_schema.sql`](./supabase_schema.sql) trong dự án này, **sao chép toàn bộ nội dung** và dán vào ô SQL Editor -> Bấm nút **"Run"** (Ctrl + Enter).
6. Lấy thông tin API:
   - Vào mục **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái) -> Chọn **API**.
   - Sao chép 2 thông số:
     - **Project URL** (VD: `https://xyzcompany.supabase.co`)
     - **Project API keys: `anon` `public`** (Chuỗi ký tự dài bắt đầu bằng `eyJ...`)

---

### BƯỚC 2: DEPLOY WEB LÊN VERCEL

1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Bấm **"Add New..."** -> **"Project"**.
3. Tìm và chọn repository **`vanh1711/QuanLyQuy`** -> Bấm **"Import"**.
4. Mở rộng mục **"Environment Variables"** (Biến môi trường) và thêm 3 biến sau:

| Tên biến (Key) | Giá trị (Value) |
| :--- | :--- |
| `VITE_STORAGE_MODE` | `supabase` |
| `VITE_SUPABASE_URL` | Dán **Project URL** lấy từ Supabase ở Bước 1 |
| `VITE_SUPABASE_ANON_KEY` | Dán **anon public key** lấy từ Supabase ở Bước 1 |

5. Bấm **"Deploy"**. Vercel sẽ tự động build và cung cấp link web (VD: `https://quanlyquy.vercel.app`).

---

## 🔑 MẬT KHẨU & TÀI KHOẢN MẶC ĐỊNH

| Loại Quyền | Mật Khẩu Khởi Tạo | Mô Tả |
| :--- | :---: | :--- |
| **Mật Khẩu Nhóm (Thành viên)** | `123456` | Nhập ở màn hình khóa ngoài để vào xem quỹ & đóng tiền. |
| **Mã PIN Thủ Quỹ (Admin)** | `888888` | Mở khóa toàn quyền quản trị (Sửa STK, đổi QR, quản lý thu chi). |

> 💡 **Lưu ý:** Sau khi deploy lên web thành công, Thủ Quỹ chỉ cần đăng nhập bằng mã PIN `888888`, vào mục **`⚙️ Cài đặt`** để điền Số tài khoản thật, tên ngân hàng và đổi mật khẩu mới tùy thích!

---

## 💻 CHẠY LOCAL TRÊN MÁY TÍNH (VỚI LARAGON / MYSQL)

1. Mở Laragon -> Bấm **Start All**.
2. Mở HeidiSQL / phpMyAdmin -> Tạo database tên `quanlyquy`.
3. Chạy file [`database.sql`](./database.sql) để tạo bảng.
4. Cài đặt thư viện và chạy:
```bash
npm install
npm run dev
```
5. Mở trình duyệt tại: `http://localhost:5173`.
