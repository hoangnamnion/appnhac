# 📱 Hướng Dẫn Đóng Gói File .IPA & Cài Lên iPhone

Dự án **MusicTag Sync** đã được thiết kế sẵn sàng để:
1. Chạy trực tiếp như Native Web App trên iPhone (không cần máy tính, không cần chứng chỉ Apple Developer).
2. Đóng gói thành file `.ipa` để cài đặt qua **AltStore**, **Sideloadly**, **TrollStore** hoặc **TestFlight**.

---

## 🚀 Cách 1: Sử dụng Trực Tiếp Trên iPhone Không Cần Build .IPA (Khuyên Dùng)

1. Mở file `index.html` của dự án trên trình duyệt **Safari** của iPhone (hoặc tải lên GitHub Pages / Vercel / Cloudflare Pages miễn phí).
2. Bấm vào biểu tượng **Chia sẻ (Share)** ở thanh điều hướng dưới cùng của Safari.
3. Cuộn xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** -> Bấm **Thêm (Add)**.
4. Biểu tượng ứng dụng sẽ xuất hiện ngoài màn hình iPhone. Khi mở lên, app sẽ chạy toàn màn hình không có thanh URL của Safari, có thể phát nhạc ngoài màn hình khóa (Lockscreen), nhúng ảnh và lưu nhạc offline 100%.

---

## 🛠️ Cách 2: Đóng Gói Thành File `.ipa` Bằng Capacitor (Trên macOS / Xcode)

### Bước 1: Khởi tạo dự án iOS
Mở Terminal trong thư mục dự án và chạy các lệnh sau:
```bash
# 1. Cài đặt các công cụ Capacitor
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/ios

# 2. Tạo dự án iOS Xcode
npx cap add ios

# 3. Đồng bộ code vào iOS project
npx cap copy
npx cap sync
```

### Bước 2: Mở Xcode & Xuất file `.ipa`
```bash
npx cap open ios
```
Trong Xcode:
1. Chọn target **App** -> mục **Signing & Capabilities** -> Chọn tài khoản Apple ID cá nhân của bạn (Personal Team).
2. Chọn thiết bị đích: **Any iOS Device (arm64)**.
3. Trên thanh Menu chọn **Product** -> **Archive**.
4. Khi quá trình build hoàn tất, cửa sổ *Organizer* sẽ hiện ra -> Chọn **Distribute App** -> Chọn **Custom** -> **Ad Hoc** hoặc **Development** -> Bấm **Export** để lưu file `.ipa` ra máy.

---

## 📲 Cách 3: Cài Đặt File `.ipa` Lên iPhone

Sau khi đã có file `MusicTagSync.ipa`:
- **Dùng AltStore (Windows / Mac):** Mở app AltStore trên iPhone -> Bấm dấu `+` ở góc trái -> Chọn file `.ipa` để cài.
- **Dùng Sideloadly (Windows / Mac):** Cắm iPhone vào máy tính qua cáp USB -> Kéo thả file `.ipa` vào Sideloadly -> Nhập Apple ID -> Bấm *Start*.
- **Dùng TrollStore (Nếu máy đã Jailbreak / TrollStore):** Mở file `.ipa` và chọn *Install with TrollStore* (không bao giờ bị thu hồi chứng chỉ).
