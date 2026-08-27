# 🎵 ShinTag Music (PC, iOS, Android & Web)

Ứng dụng quản lý, nhúng Artwork ID3v2 và đồng bộ thư viện nhạc đám mây qua **Supabase Cloud**, hỗ trợ phát offline và xuất file đa nền tảng.

---

## ✨ Tính Năng Nổi Bật

- 🎨 **Apple Music Design**: Giao diện chuẩn iOS, trực quan, hỗ trợ Dark Mode & Shin-chan Ocean Blue.
- 🏷️ **ID3v2 Studio Engine**: Nhúng ảnh bìa chất lượng cao, sửa Title, Artist, Album, Year trực tiếp trên trình duyệt hoặc app native.
- ☁️ **Đồng Bộ Đa Thiết Bị**: Đồng bộ cơ sở dữ liệu và lưu trữ file MP3/Artwork qua **Supabase Storage**.
- 📥 **Tải Offline & Xuất File MP3**: Lưu bài hát vào bộ nhớ máy để nghe không cần mạng, xuất file MP3 ra thư mục Music trên PC hoặc điện thoại.
- 🛡️ **Bảo Mật Quyền Admin**: Bảo vệ tính năng xóa bài hát bằng mã PIN Admin (`2005`).
- 🤖 **CI/CD Tự Động Build**: Tự động build file cài đặt **Windows (`.exe`)**, **Android (`.apk`)**, và **iOS (`.ipa`)** qua GitHub Actions.

---

## 🚀 Tự Động Build Qua GitHub Actions

Chỉ cần push code lên GitHub:
```bash
git add .
git commit -m "feat: update app"
git push
```
Vào tab **Actions** trên GitHub để tải về các file cài đặt từ mục **Artifacts**:
- 💻 **`ShinTag-Music-Windows-Setup`** (`.exe`)
- 🤖 **`ShinTag-Music-Android`** (`.apk`)
- 🍎 **`ShinTag-Music-iOS`** (`.ipa`)

---

## 🛠️ Chạy Thủ Công Trên Máy (Local)

### 1. Web App:
```bash
npm start
```
Truy cập: `http://localhost:3000`

### 2. PC Desktop (Electron):
```bash
npm run electron:dev
```

### 3. Android:
```bash
npm run cap:android:sync
npm run cap:android:open
```

### 4. iOS (Xcode):
```bash
npm run cap:ios:sync
npm run cap:ios:open
```
