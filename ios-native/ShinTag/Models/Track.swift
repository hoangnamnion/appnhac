import Foundation
import SwiftUI

// MARK: - Track Model
struct Track: Identifiable, Codable, Equatable, Hashable {
    var id: String
    var title: String
    var artist: String
    var album: String
    var year: Int
    var duration: Double
    var audioPath: String?      // Local Documents path
    var artworkPath: String?    // Local Documents path
    var audioUrl: String?       // Supabase Storage URL
    var coverUrl: String?       // Supabase Storage URL
    var syncStatus: SyncStatus
    var createdAt: Date

    // MARK: - Computed
    var isOffline: Bool {
        return audioPath != nil
    }

    var localAudioURL: URL? {
        guard let path = audioPath else { return nil }
        return StorageService.shared.documentsURL.appendingPathComponent(path)
    }

    var localArtworkURL: URL? {
        guard let path = artworkPath else { return nil }
        return StorageService.shared.documentsURL.appendingPathComponent(path)
    }

    var artworkImage: UIImage? {
        guard let url = localArtworkURL,
              let data = try? Data(contentsOf: url) else {
            // Try cloud URL
            return nil
        }
        return UIImage(data: data)
    }

    var formattedDuration: String {
        guard duration > 0 else { return "0:00" }
        let mins = Int(duration) / 60
        let secs = Int(duration) % 60
        return String(format: "%d:%02d", mins, secs)
    }

    // MARK: - Init
    init(id: String = "track_\(Int(Date().timeIntervalSince1970 * 1000))_\(Int.random(in: 1000...9999))",
         title: String = "",
         artist: String = "",
         album: String = "ShinTag Music",
         year: Int = Calendar.current.component(.year, from: Date()),
         duration: Double = 0,
         audioPath: String? = nil,
         artworkPath: String? = nil,
         audioUrl: String? = nil,
         coverUrl: String? = nil,
         syncStatus: SyncStatus = .local,
         createdAt: Date = Date()) {
        self.id = id
        self.title = title
        self.artist = artist
        self.album = album
        self.year = year
        self.duration = duration
        self.audioPath = audioPath
        self.artworkPath = artworkPath
        self.audioUrl = audioUrl
        self.coverUrl = coverUrl
        self.syncStatus = syncStatus
        self.createdAt = createdAt
    }
}

// MARK: - SyncStatus
enum SyncStatus: String, Codable, CaseIterable {
    case local = "local"
    case synced = "synced"
    case uploading = "uploading"
    case downloading = "downloading"
    case error = "error"

    var label: String {
        switch self {
        case .local: return "Trên Máy"
        case .synced: return "Đã Đồng Bộ"
        case .uploading: return "Đang Upload..."
        case .downloading: return "Đang Tải..."
        case .error: return "Lỗi"
        }
    }

    var color: Color {
        switch self {
        case .local: return AppTheme.textSecondary
        case .synced: return AppTheme.green
        case .uploading, .downloading: return AppTheme.blue
        case .error: return AppTheme.red
        }
    }
}

// MARK: - Supabase API models
struct SupabaseTrack: Codable {
    let id: String
    let title: String?
    let artist: String?
    let album: String?
    let year: Int?
    let duration: Double?
    let audio_url: String?
    let cover_url: String?
    let created_at: String?
    let sync_status: String?

    func toTrack() -> Track {
        var t = Track()
        t.id = id
        t.title = title ?? "Unknown Title"
        t.artist = artist ?? "Unknown Artist"
        t.album = album ?? "ShinTag Music"
        t.year = year ?? 2026
        t.duration = duration ?? 0
        t.audioUrl = audio_url
        t.coverUrl = cover_url
        t.syncStatus = .synced
        return t
    }
}
