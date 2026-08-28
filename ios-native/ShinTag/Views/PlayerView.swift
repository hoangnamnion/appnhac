import SwiftUI

struct PlayerView: View {
    @EnvironmentObject var audioService: AudioService
    @Environment(\.dismiss) var dismiss
    @State private var isDraggingSeek = false
    @State private var dragValue: Double = 0

    var body: some View {
        ZStack {
            // Background gradient based on artwork
            AppTheme.backgroundPrimary.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                header
                    .padding(.top, 20)
                    .padding(.horizontal, 24)

                Spacer()

                // Artwork
                artwork
                    .padding(.horizontal, 32)

                Spacer()

                // Metadata
                metadata
                    .padding(.horizontal, 24)
                    .padding(.bottom, 16)

                // Seek Bar
                seekBar
                    .padding(.horizontal, 24)

                // Controls
                controls
                    .padding(.horizontal, 24)
                    .padding(.top, 24)
                    .padding(.bottom, 40)
            }
        }
    }

    // MARK: - Header
    var header: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.down")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
            }

            Spacer()
            Text("ĐANG PHÁT")
                .font(.system(size: 12, weight: .bold, design: .default))
                .kerning(1.5)
                .foregroundColor(AppTheme.textSecondary)
            Spacer()

            Button { } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 20))
                    .foregroundColor(AppTheme.textPrimary)
            }
        }
    }

    // MARK: - Artwork
    var artwork: some View {
        Group {
            if let track = audioService.currentTrack,
               let data = StorageService.shared.artworkData(for: track),
               let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(maxWidth: .infinity)
                    .aspectRatio(1, contentMode: .fit)
                    .cornerRadius(AppTheme.cornerRadiusLarge)
                    .shadow(color: .black.opacity(0.4), radius: 30, y: 20)
                    .scaleEffect(audioService.isPlaying ? 1.0 : 0.92)
                    .animation(.spring(response: 0.5, dampingFraction: 0.7), value: audioService.isPlaying)
            } else if let track = audioService.currentTrack, let coverUrl = track.coverUrl {
                AsyncImage(url: URL(string: coverUrl)) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(maxWidth: .infinity)
                            .aspectRatio(1, contentMode: .fit)
                            .cornerRadius(AppTheme.cornerRadiusLarge)
                            .shadow(color: .black.opacity(0.4), radius: 30, y: 20)
                    default:
                        placeholderArt
                    }
                }
            } else {
                placeholderArt
            }
        }
    }

    var placeholderArt: some View {
        ZStack {
            AppTheme.blueGradient
            Image(systemName: "music.note")
                .font(.system(size: 80))
                .foregroundColor(.white.opacity(0.5))
        }
        .aspectRatio(1, contentMode: .fit)
        .cornerRadius(AppTheme.cornerRadiusLarge)
        .shadow(color: .black.opacity(0.4), radius: 30, y: 20)
    }

    // MARK: - Metadata
    var metadata: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(audioService.currentTrack?.title ?? "Chưa Chọn Bài")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                    .lineLimit(1)

                Text(audioService.currentTrack?.artist ?? "Nghệ Sĩ")
                    .font(.system(size: 17))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(1)
            }
            Spacer()
        }
    }

    // MARK: - Seek Bar
    var seekBar: some View {
        VStack(spacing: 4) {
            Slider(
                value: Binding(
                    get: { isDraggingSeek ? dragValue : audioService.currentTime },
                    set: { newVal in
                        isDraggingSeek = true
                        dragValue = newVal
                    }
                ),
                in: 0...(audioService.duration > 0 ? audioService.duration : 1),
                onEditingChanged: { editing in
                    if !editing {
                        audioService.seek(to: dragValue)
                        isDraggingSeek = false
                    }
                }
            )
            .tint(AppTheme.textPrimary)

            HStack {
                Text(formatTime(isDraggingSeek ? dragValue : audioService.currentTime))
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(AppTheme.textTertiary)
                Spacer()
                Text(formatTime(audioService.duration))
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(AppTheme.textTertiary)
            }
        }
    }

    // MARK: - Controls
    var controls: some View {
        HStack(spacing: 0) {
            Button { audioService.previous() } label: {
                Image(systemName: "backward.fill")
                    .font(.system(size: 28))
                    .foregroundColor(AppTheme.textPrimary)
            }
            .frame(maxWidth: .infinity)

            Button { audioService.togglePlay() } label: {
                Image(systemName: audioService.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 72))
                    .foregroundColor(AppTheme.textPrimary)
                    .scaleEffect(audioService.isPlaying ? 1.0 : 0.95)
                    .animation(.spring(response: 0.2), value: audioService.isPlaying)
            }
            .frame(maxWidth: .infinity)

            Button { audioService.next() } label: {
                Image(systemName: "forward.fill")
                    .font(.system(size: 28))
                    .foregroundColor(AppTheme.textPrimary)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func formatTime(_ seconds: Double) -> String {
        guard seconds.isFinite && seconds >= 0 else { return "0:00" }
        let m = Int(seconds) / 60
        let s = Int(seconds) % 60
        return String(format: "%d:%02d", m, s)
    }
}

// MARK: - Mini Player
struct MiniPlayerView: View {
    @EnvironmentObject var audioService: AudioService
    @State private var showFullPlayer = false

    var body: some View {
        HStack(spacing: 12) {
            // Thumbnail
            AsyncArtwork(track: audioService.currentTrack ?? Track())
                .frame(width: 44, height: 44)
                .cornerRadius(8)

            // Title/Artist
            VStack(alignment: .leading, spacing: 2) {
                Text(audioService.currentTrack?.title ?? "")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                    .lineLimit(1)
                Text(audioService.currentTrack?.artist ?? "")
                    .font(.system(size: 12))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(1)
            }

            Spacer()

            // Play/Pause
            Button { audioService.togglePlay() } label: {
                Image(systemName: audioService.isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 20))
                    .foregroundColor(AppTheme.textPrimary)
            }

            // Next
            Button { audioService.next() } label: {
                Image(systemName: "forward.fill")
                    .font(.system(size: 18))
                    .foregroundColor(AppTheme.textPrimary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .cornerRadius(AppTheme.cornerRadiusMedium)
        .padding(.horizontal, 8)
        .shadow(color: .black.opacity(0.3), radius: 10, y: 4)
        .onTapGesture { showFullPlayer = true }
        .fullScreenCover(isPresented: $showFullPlayer) {
            PlayerView()
        }
    }
}
