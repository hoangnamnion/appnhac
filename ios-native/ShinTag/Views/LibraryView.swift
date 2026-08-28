import SwiftUI

struct LibraryView: View {
    @EnvironmentObject var trackStore: TrackStore
    @EnvironmentObject var audioService: AudioService
    @EnvironmentObject var syncService: SyncService
    @State private var showPlayer = false
    @State private var syncing = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundPrimary.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Search bar
                    searchBar

                    if trackStore.filteredTracks.isEmpty {
                        emptyState
                    } else {
                        trackList
                    }
                }
            }
            .navigationTitle("ShinTag Music 🎵")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(AppTheme.backgroundPrimary, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    syncButton
                }
            }
        }
        .fullScreenCover(isPresented: $showPlayer) {
            PlayerView()
        }
    }

    // MARK: - Search Bar
    var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass").foregroundColor(AppTheme.textSecondary)
            TextField("Tìm bài hát, nghệ sĩ...", text: $trackStore.searchQuery)
                .foregroundColor(AppTheme.textPrimary)
        }
        .padding(10)
        .background(AppTheme.backgroundCard)
        .cornerRadius(AppTheme.cornerRadiusSmall)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }

    // MARK: - Track List
    var trackList: some View {
        List {
            ForEach(trackStore.filteredTracks) { track in
                TrackRow(track: track, isPlaying: audioService.currentTrack?.id == track.id && audioService.isPlaying)
                    .onTapGesture {
                        audioService.play(track: track, in: trackStore.filteredTracks)
                        showPlayer = true
                    }
                    .listRowBackground(AppTheme.backgroundPrimary)
                    .listRowSeparatorTint(AppTheme.separator)
            }
            .onDelete { indexSet in
                indexSet.forEach { i in
                    trackStore.deleteTrack(trackStore.filteredTracks[i])
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }

    // MARK: - Empty State
    var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "music.note.list")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.textTertiary)
            Text("Chưa Có Bài Hát Nào")
                .font(.title3.bold())
                .foregroundColor(AppTheme.textPrimary)
            Text("Bấm tab \"Tạo Nhạc\" để thêm bài hát\nhoặc bấm Sync để tải từ Cloud")
                .font(.subheadline)
                .foregroundColor(AppTheme.textSecondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .padding()
    }

    // MARK: - Sync Button
    var syncButton: some View {
        Button {
            Task {
                syncing = true
                do {
                    let cloudTracks = try await syncService.fetchTracks()
                    trackStore.mergeFromCloud(cloudTracks)
                } catch {
                    print("Sync error: \(error)")
                }
                syncing = false
            }
        } label: {
            if syncing {
                ProgressView().tint(AppTheme.blue)
            } else {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .foregroundColor(AppTheme.blue)
            }
        }
    }
}

// MARK: - Track Row
struct TrackRow: View {
    let track: Track
    let isPlaying: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Artwork
            AsyncArtwork(track: track)
                .frame(width: 52, height: 52)
                .cornerRadius(AppTheme.cornerRadiusSmall)

            // Metadata
            VStack(alignment: .leading, spacing: 3) {
                Text(track.title.isEmpty ? "Untitled Track" : track.title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(isPlaying ? AppTheme.blue : AppTheme.textPrimary)
                    .lineLimit(1)

                Text(track.artist.isEmpty ? "Unknown Artist" : track.artist)
                    .font(.system(size: 13))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Circle()
                        .fill(track.syncStatus.color)
                        .frame(width: 6, height: 6)
                    Text(track.isOffline ? "Offline ✅" : "Cloud ☁️")
                        .font(.system(size: 11))
                        .foregroundColor(AppTheme.textTertiary)
                }
            }

            Spacer()

            // Duration + playing indicator
            VStack(alignment: .trailing, spacing: 4) {
                if isPlaying {
                    Image(systemName: "waveform")
                        .foregroundColor(AppTheme.blue)
                        .symbolEffect(.variableColor.iterative)
                }
                Text(track.formattedDuration)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(AppTheme.textTertiary)
            }
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle())
    }
}

// MARK: - Artwork View
struct AsyncArtwork: View {
    let track: Track
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else if let coverUrl = track.coverUrl {
                AsyncImage(url: URL(string: coverUrl)) { phase in
                    switch phase {
                    case .success(let img): img.resizable().aspectRatio(contentMode: .fill)
                    default: placeholderArtwork
                    }
                }
            } else {
                placeholderArtwork
            }
        }
        .onAppear {
            if let data = StorageService.shared.artworkData(for: track) {
                image = UIImage(data: data)
            }
        }
    }

    var placeholderArtwork: some View {
        ZStack {
            AppTheme.blueGradient
            Image(systemName: "music.note")
                .foregroundColor(.white.opacity(0.7))
                .font(.system(size: 20))
        }
    }
}
