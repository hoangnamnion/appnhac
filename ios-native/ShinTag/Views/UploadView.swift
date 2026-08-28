import SwiftUI
import AVFoundation

struct UploadView: View {
    @EnvironmentObject var trackStore: TrackStore
    @EnvironmentObject var syncService: SyncService

    @State private var title = ""
    @State private var artist = ""
    @State private var album = "ShinTag Music"
    @State private var year = String(Calendar.current.component(.year, from: Date()))
    @State private var selectedAudioURL: URL?
    @State private var selectedArtworkData: Data?
    @State private var artworkUIImage: UIImage?
    @State private var isUploading = false
    @State private var uploadProgress = 0.0
    @State private var uploadMessage = ""
    @State private var showAudioPicker = false
    @State private var showImagePicker = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundPrimary.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 20) {
                        artworkPicker
                        metadataForm
                        audioPicker
                        uploadButton
                        if isUploading {
                            uploadProgressView
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Tạo Nhạc ✨")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(AppTheme.backgroundPrimary, for: .navigationBar)
        }
        .sheet(isPresented: $showAudioPicker) {
            DocumentPickerView(selectedURL: $selectedAudioURL, onSelect: { url in
                if title.isEmpty {
                    title = url.deletingPathExtension().lastPathComponent
                }
            })
        }
        .sheet(isPresented: $showImagePicker) {
            ImagePickerView(imageData: $selectedArtworkData, uiImage: $artworkUIImage)
        }
    }

    // MARK: - Artwork Picker
    var artworkPicker: some View {
        Button { showImagePicker = true } label: {
            ZStack {
                if let img = artworkUIImage {
                    Image(uiImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .cornerRadius(AppTheme.cornerRadiusLarge)
                        .clipped()
                } else {
                    RoundedRectangle(cornerRadius: AppTheme.cornerRadiusLarge)
                        .fill(AppTheme.backgroundCard)
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .overlay {
                            VStack(spacing: 12) {
                                Image(systemName: "photo.badge.plus")
                                    .font(.system(size: 40))
                                    .foregroundColor(AppTheme.textSecondary)
                                Text("Chọn Ảnh Bìa")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(AppTheme.textSecondary)
                            }
                        }
                }
            }
        }
        .pressEffect()
    }

    // MARK: - Metadata Form
    var metadataForm: some View {
        VStack(spacing: 1) {
            formCell(label: "Tên Bài Hát", placeholder: "Ví dụ: Vùng Ký Ức 12", text: $title)
            Divider().background(AppTheme.separator)
            formCell(label: "Nghệ Sĩ", placeholder: "Ví dụ: Cao Văn Nam", text: $artist)
            Divider().background(AppTheme.separator)
            formCell(label: "Album", placeholder: "ShinTag Music 2026", text: $album)
            Divider().background(AppTheme.separator)
            formCell(label: "Năm", placeholder: "2026", text: $year)
        }
        .background(AppTheme.backgroundCard)
        .cornerRadius(AppTheme.cornerRadiusMedium)
    }

    func formCell(label: String, placeholder: String, text: Binding<String>) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15))
                .foregroundColor(AppTheme.textPrimary)
                .frame(width: 110, alignment: .leading)
            TextField(placeholder, text: text)
                .font(.system(size: 15))
                .foregroundColor(AppTheme.textSecondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    // MARK: - Audio Picker
    var audioPicker: some View {
        Button { showAudioPicker = true } label: {
            HStack(spacing: 14) {
                Image(systemName: "music.note")
                    .font(.system(size: 22))
                    .foregroundColor(AppTheme.blue)
                VStack(alignment: .leading, spacing: 3) {
                    Text(selectedAudioURL?.lastPathComponent ?? "Chọn Bài Hát (.mp3 / .m4a)")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(selectedAudioURL != nil ? AppTheme.textPrimary : AppTheme.textSecondary)
                        .lineLimit(1)
                    Text(selectedAudioURL != nil ? "✅ File đã chọn" : "Chạm để chọn từ Files")
                        .font(.system(size: 12))
                        .foregroundColor(AppTheme.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding(16)
            .background(AppTheme.backgroundCard)
            .cornerRadius(AppTheme.cornerRadiusMedium)
        }
        .pressEffect()
    }

    // MARK: - Upload Button
    var uploadButton: some View {
        Button {
            Task { await uploadTrack() }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "icloud.and.arrow.up.fill")
                Text("Tạo File & Lưu Bài Hát")
                    .fontWeight(.bold)
            }
            .font(.system(size: 17))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                (selectedAudioURL == nil || title.isEmpty || isUploading)
                ? AppTheme.backgroundCard
                : AppTheme.blueGradient.opacity(1).eraseToAnyView()
            )
            .cornerRadius(AppTheme.cornerRadiusMedium)
        }
        .disabled(selectedAudioURL == nil || title.isEmpty || isUploading)
    }

    // MARK: - Progress
    var uploadProgressView: some View {
        VStack(spacing: 10) {
            ProgressView(value: uploadProgress)
                .tint(AppTheme.blue)
            Text(uploadMessage)
                .font(.system(size: 13))
                .foregroundColor(AppTheme.textSecondary)
        }
        .padding(16)
        .background(AppTheme.backgroundCard)
        .cornerRadius(AppTheme.cornerRadiusMedium)
    }

    // MARK: - Upload Logic
    func uploadTrack() async {
        guard let audioURL = selectedAudioURL else { return }
        isUploading = true
        uploadProgress = 0.1
        uploadMessage = "⏳ Đang đọc file audio..."

        do {
            let audioData = try Data(contentsOf: audioURL)
            uploadProgress = 0.3

            // Create track
            var track = Track(
                title: title,
                artist: artist,
                album: album,
                year: Int(year) ?? 2026
            )

            // Get duration
            let asset = AVURLAsset(url: audioURL)
            let duration = try? await asset.load(.duration)
            track.duration = duration.map { $0.seconds } ?? 0

            uploadMessage = "💾 Đang lưu vào Documents..."
            uploadProgress = 0.5

            // Save locally first
            if let savedPath = StorageService.shared.saveAudio(data: audioData, trackId: track.id) {
                track.audioPath = savedPath
            }

            if let artData = selectedArtworkData,
               let savedPath = StorageService.shared.saveArtwork(data: artData, trackId: track.id) {
                track.artworkPath = savedPath
            }

            uploadMessage = "☁️ Đang upload lên Supabase Cloud..."
            uploadProgress = 0.7

            try await syncService.uploadTrack(
                track: &track,
                audioData: audioData,
                artworkData: selectedArtworkData
            )

            uploadProgress = 1.0
            uploadMessage = "✅ Hoàn thành!"

            await MainActor.run {
                trackStore.addTrack(track)
                resetForm()
            }
        } catch {
            uploadMessage = "❌ Lỗi: \(error.localizedDescription)"
        }

        isUploading = false
    }

    func resetForm() {
        title = ""
        artist = ""
        album = "ShinTag Music"
        selectedAudioURL = nil
        selectedArtworkData = nil
        artworkUIImage = nil
        uploadProgress = 0
        uploadMessage = ""
    }
}

// MARK: - Helpers
extension View {
    func eraseToAnyView() -> AnyView { AnyView(self) }
}
