# 🚀 Hướng Dẫn Tải File Cài Đặt Từ GitHub Actions

Hệ thống CI/CD đã được cấu hình tự động. Mỗi khi bạn push code lên GitHub, GitHub sẽ tự động khởi tạo máy ảo để build ra cả 3 file cài đặt:

---

## 📥 3 File Sẽ Được Tự Động Build:
1. **`ShinTag-Music-Windows-Setup`** ➔ File `.exe` cài đặt trên máy tính Windows.
2. **`ShinTag-Music-Android`** ➔ File `.apk` cài trực tiếp vào điện thoại Android.
3. **`ShinTag-Music-iOS`** ➔ File `.ipa` cài vào iPhone/iPad qua **TrollStore, AltStore, Sideloadly, hoặc Scarlet**.

---

## 🛠️ Các Bước Để GitHub Bắt Đầu Build:

### Bước 1: Mở Terminal tại thư mục app và push code lên GitHub:
```bash
git add .
git commit -m "feat: setup GitHub Actions auto build for Windows, Android, iOS"
git push
```

### Bước 2: Xem tiến trình và Tải file:
1. Mở trang Repository GitHub của bạn trên trình duyệt.
2. Bấm vào tab **Actions** (ở thanh menu trên cùng).
3. Bạn sẽ thấy quy trình: **`Build All Platforms (Windows, Android, iOS)`** đang chạy với biểu tượng vòng tròn màu vàng 🟡.
4. Khi cả 3 tác vụ hoàn thành (màu xanh lá 🟢):
   - Bấm vào lần chạy đó.
   - Cuộn xuống phần **Artifacts** ở dưới cùng.
   - Bấm vào tên file để tải về:
     - 📁 `ShinTag-Music-Windows-Setup` (.zip chứa file .exe)
     - 📁 `ShinTag-Music-Android` (.zip chứa file .apk)
     - 📁 `ShinTag-Music-iOS` (.zip chứa file .ipa)

---

## ⚡ Chạy Build Thủ Công (Không Cần Push Code):
1. Vào tab **Actions** trên GitHub.
2. Chọn workflow **`Build All Platforms (Windows, Android, iOS)`** ở cột bên trái.
3. Bấm nút **Run workflow** > Bấm **Run workflow** màu xanh để kích hoạt build ngay lập tức.
