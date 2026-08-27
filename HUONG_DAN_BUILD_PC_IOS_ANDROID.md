# 📱 & 💻 Hướng Dẫn Build ShinTag Music Đa Nền Tảng (PC, iOS, Android)

Dự án ShinTag Music đã được cấu hình hoàn chỉnh để đóng gói ứng dụng native cho:
1. **PC Desktop (Windows `.exe`, Mac `.dmg`, Linux `.AppImage`)**
2. **Android (`.apk`)**
3. **iOS (`.ipa` / Xcode)**

---

## 1. 💻 Build Ứng Dụng PC Desktop (Windows / Mac)

Sử dụng **Electron**:

### Chạy thử nghiệm trên máy (Dev Mode):
```bash
npm run electron:dev
```

### Đóng gói file cài đặt Windows (.exe):
```bash
npm run build:win
```
> File `.exe` sau khi đóng gói sẽ nằm trong thư mục `dist-electron/`.

### Đóng gói file cài đặt Mac (.dmg):
```bash
npm run build:mac
```

---

## 2. 🤖 Build Ứng Dụng Android (.apk)

Sử dụng **Capacitor Android**:

### Bước 1: Đồng bộ mã nguồn mới nhất vào thư mục Android
```bash
npm run cap:android:sync
```

### Bước 2: Mở dự án trong Android Studio
```bash
npm run cap:android:open
```
*(Hoặc mở thư mục `android/` trực tiếp từ Android Studio)*

### Bước 3: Xuất file APK trong Android Studio
1. Vào menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Android Studio sẽ tạo file `app-debug.apk` hoặc `app-release.apk` trong `android/app/build/outputs/apk/`.
3. Chép file APK vào điện thoại Android và cài đặt trực tiếp.

---

## 3. 🍎 Build Ứng Dụng iOS (.ipa)

Sử dụng **Capacitor iOS**:

### Bước 1: Đồng bộ mã nguồn mới nhất vào thư mục iOS
```bash
npm run cap:ios:sync
```

### Bước 2: Mở dự án trong Xcode (trên máy Mac)
```bash
npm run cap:ios:open
```
*(Hoặc mở thư mục `ios/App/App.xcworkspace` trực tiếp từ Xcode)*

### Bước 3: Xuất file IPA
1. Chọn target thiết bị: **Any iOS Device (arm64)**.
2. Vào menu **Product** > **Archive**.
3. Bấm **Distribute App** > Chọn **Ad Hoc** hoặc **Development** để xuất file `.ipa`.

---

## ⚡ Bảng Lệnh Nhanh

| Mục đích | Câu lệnh |
|---|---|
| Chạy dev web server | `npm start` |
| Chạy test Electron Desktop | `npm run electron:dev` |
| Build Windows `.exe` | `npm run build:win` |
| Đồng bộ Android | `npm run cap:android:sync` |
| Mở Android Studio | `npm run cap:android:open` |
| Đồng bộ iOS | `npm run cap:ios:sync` |
| Mở Xcode | `npm run cap:ios:open` |
