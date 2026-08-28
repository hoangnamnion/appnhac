import Foundation

// MARK: - SyncService
// Communicates with Supabase REST API
// No SDK needed — pure URLSession
class SyncService: ObservableObject {
    static let supabaseURL = "https://jsiitousrcbcmioqkmwe.supabase.co"
    static let anonKey = "sb_publishable_9B1qziXbUeZzD1wxZn0ltw_-4DVpBlu"

    @Published var isSyncing: Bool = false
    @Published var lastError: String?

    private var session: URLSession = .shared

    private func baseRequest(path: String, method: String = "GET") -> URLRequest {
        var request = URLRequest(url: URL(string: "\(Self.supabaseURL)/rest/v1\(path)")!)
        request.httpMethod = method
        request.setValue("Bearer \(Self.anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        return request
    }

    // MARK: - Fetch All Tracks From Cloud
    func fetchTracks() async throws -> [Track] {
        var request = baseRequest(path: "/tracks?select=*&order=created_at.desc")
        request.httpMethod = "GET"

        let (data, _) = try await session.data(for: request)
        let supabaseTracks = try JSONDecoder().decode([SupabaseTrack].self, from: data)
        return supabaseTracks.map { $0.toTrack() }
    }

    // MARK: - Upload Track (audio + artwork to Storage, row to DB)
    func uploadTrack(track: inout Track, audioData: Data, artworkData: Data?) async throws {
        await MainActor.run { isSyncing = true }

        // 1. Upload audio to Supabase Storage
        let audioPath = "\(track.id)/audio.mp3"
        let audioStorageURL = "\(Self.supabaseURL)/storage/v1/object/music-files/\(audioPath)"
        var audioRequest = URLRequest(url: URL(string: audioStorageURL)!)
        audioRequest.httpMethod = "POST"
        audioRequest.setValue("Bearer \(Self.anonKey)", forHTTPHeaderField: "Authorization")
        audioRequest.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
        audioRequest.setValue("audio/mpeg", forHTTPHeaderField: "Content-Type")
        audioRequest.httpBody = audioData
        _ = try await session.data(for: audioRequest)
        track.audioUrl = "\(Self.supabaseURL)/storage/v1/object/public/music-files/\(audioPath)"

        // 2. Upload artwork to Supabase Storage
        if let artworkData = artworkData {
            let coverPath = "\(track.id)/cover.jpg"
            let coverStorageURL = "\(Self.supabaseURL)/storage/v1/object/music-files/\(coverPath)"
            var coverRequest = URLRequest(url: URL(string: coverStorageURL)!)
            coverRequest.httpMethod = "POST"
            coverRequest.setValue("Bearer \(Self.anonKey)", forHTTPHeaderField: "Authorization")
            coverRequest.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
            coverRequest.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
            coverRequest.httpBody = artworkData
            _ = try await session.data(for: coverRequest)
            track.coverUrl = "\(Self.supabaseURL)/storage/v1/object/public/music-files/\(coverPath)"
        }

        // 3. Insert track row into Supabase DB
        var dbRequest = baseRequest(path: "/tracks", method: "POST")
        let body: [String: Any] = [
            "id": track.id,
            "title": track.title,
            "artist": track.artist,
            "album": track.album,
            "year": track.year,
            "duration": track.duration,
            "audio_url": track.audioUrl ?? "",
            "cover_url": track.coverUrl ?? "",
            "sync_status": "synced"
        ]
        dbRequest.httpBody = try JSONSerialization.data(withJSONObject: body)
        _ = try await session.data(for: dbRequest)

        track.syncStatus = .synced
        await MainActor.run { isSyncing = false }
    }

    // MARK: - Download Audio to Local Documents
    func downloadAudio(from urlString: String, trackId: String) async throws -> String? {
        guard let url = URL(string: urlString) else { return nil }
        let (data, _) = try await session.data(from: url)
        return StorageService.shared.saveAudio(data: data, trackId: trackId)
    }

    func downloadArtwork(from urlString: String, trackId: String) async throws -> String? {
        guard let url = URL(string: urlString) else { return nil }
        let (data, _) = try await session.data(from: url)
        return StorageService.shared.saveArtwork(data: data, trackId: trackId)
    }

    // MARK: - Delete Track
    func deleteTrack(id: String) async throws {
        var request = baseRequest(path: "/tracks?id=eq.\(id)", method: "DELETE")
        _ = try await session.data(for: request)
    }
}
