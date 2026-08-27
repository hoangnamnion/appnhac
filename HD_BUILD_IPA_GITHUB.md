# 📱 Hướng Dẫn Tự Động Build File .IPA Bằng GitHub Actions & Cài Lên iPhone

Dự án đã được tích hợp sẵn luồng CI/CD tự động **GitHub Actions** (`.github/workflows/build-ipa.yml`). Bạn **không cần máy Mac**, GitHub sẽ dùng máy chủ macOS của họ để build ra file `.ipa` cho bạn hoàn toàn miễn phí!

---

## 🚀 Bước 1: Đưa Code Lên GitHub

1. Truy cập [github.com](https://github.com) và tạo một **Repository** mới (ví dụ đặt tên: `shintag-music`).
2. Tải toàn bộ mã nguồn trong thư mục này lên GitHub (bằng Git hoặc kéo thả trực tiếp trên web).
   - *Nếu dùng lệnh Git*:
     ```bash
     git init
     git add .
     git commit -m "feat: setup ShinTag with automated IPA build"
     git branch -M main
     git remote add origin https://github.com/USERNAME/shintag-music.git
     git push -u origin main
     ```

---

## ⚡ Bước 2: Xem GitHub Tự Động Build File .IPA

1. Khi bạn vừa đẩy code lên GitHub, bấm vào tab **"Actions"** ở thanh menu trên cùng của repository.
2. Bạn sẽ thấy một tiến trình đang chạy có tên: **`📱 Auto Build iOS .IPA`**.
3. Chờ khoảng **2 đến 3 phút** để máy chủ macOS của GitHub biên dịch xong (sẽ hiện dấu tích xanh ✅).

---

## 📥 Bước 3: Tải File .IPA Về Máy

1. Bấm vào tên luồng vừa build xong trong tab **Actions**.
2. Cuộn xuống phần **Artifacts** ở dưới cùng trang.
3. Bấm vào **`ShinTag-Music-iOS-IPA`** để tải file nén về.
4. Giải nén ra bạn sẽ nhận được file **`ShinTag-Music.ipa`** hoàn chỉnh!

---

## 📲 Bước 4: Cài File `.ipa` Vào iPhone Của Bạn

Bạn có thể cài đặt file `.ipa` này lên bất kỳ iPhone / iPad nào bằng 1 trong các cách sau:

### Cách A: Cài bằng TrollStore (Nếu máy có TrollStore - Khuyên dùng)
- Gửi file `.ipa` qua AirDrop hoặc mở từ app Tệp (Files) &rarr; Chọn **Open with TrollStore** &rarr; Bấm **Install**. Ứng dụng sẽ được cài vĩnh viễn không bao giờ bị thu hồi cert!

### Cách B: Cài bằng Sideloadly hoặc AltStore (PC / Laptop)
1. Tải [Sideloadly](https://sideloadly.io/) (Windows/Mac).
2. Cắm iPhone vào máy tính qua cáp USB.
3. Kéo thả file `ShinTag-Music.ipa` vào Sideloadly &rarr; Nhập Apple ID của bạn &rarr; Bấm **Start**.
4. Sau khi cài xong, trên iPhone vào: **Cài đặt &rarr; Cài đặt chung &rarr; Quản lý VPN & Thiết bị** &rarr; Bấm **Tin cậy (Trust)** để mở app.

### Cách C: Cài trực tiếp trên điện thoại qua Scarlet / ESign
- Mở link Scarlet hoặc ESign trên iPhone &rarr; Import file `.ipa` và ký chứng chỉ để cài đặt trực tiếp.
