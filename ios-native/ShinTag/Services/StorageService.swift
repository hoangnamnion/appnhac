import Foundation
import UIKit

// MARK: - StorageService
// Saves audio files and artwork to app's Documents/Music directory
// Files persist permanently — not affected by iOS cache clearing
class StorageService {
    static let shared = StorageService()

    let documentsURL: URL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    private let musicFolder: URL
    private let artworkFolder: URL
    private let metadataFile: URL

    private init() {
        musicFolder = documentsURL.appendingPathComponent("Music")
        artworkFolder = documentsURL.appendingPathComponent("Artwork")
        metadataFile = documentsURL.appendingPathComponent("tracks.json")
        try? FileManager.default.createDirectory(at: musicFolder, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: artworkFolder, withIntermediateDirectories: true)
    }

    // MARK: - Audio
    func saveAudio(data: Data, trackId: String, ext: String = "mp3") -> String? {
        let filename = "\(trackId).\(ext)"
        let url = musicFolder.appendingPathComponent(filename)
        do {
            try data.write(to: url, options: .atomic)
            return "Music/\(filename)"
        } catch {
            print("❌ StorageService.saveAudio failed: \(error)")
            return nil
        }
    }

    func saveArtwork(data: Data, trackId: String) -> String? {
        let filename = "\(trackId).jpg"
        let url = artworkFolder.appendingPathComponent(filename)
        do {
            let compressed = UIImage(data: data)?.jpegData(compressionQuality: 0.85) ?? data
            try compressed.write(to: url, options: .atomic)
            return "Artwork/\(filename)"
        } catch {
            print("❌ StorageService.saveArtwork failed: \(error)")
            return nil
        }
    }

    func audioURL(for track: Track) -> URL? {
        guard let path = track.audioPath else { return nil }
        return documentsURL.appendingPathComponent(path)
    }

    func artworkData(for track: Track) -> Data? {
        guard let path = track.artworkPath else { return nil }
        return try? Data(contentsOf: documentsURL.appendingPathComponent(path))
    }

    // MARK: - Metadata Persistence (JSON)
    func saveTrackMetadata(_ tracks: [Track]) {
        do {
            let data = try JSONEncoder().encode(tracks)
            try data.write(to: metadataFile, options: .atomic)
        } catch {
            print("❌ StorageService.saveMetadata failed: \(error)")
        }
    }

    func loadTrackMetadata() -> [Track] {
        guard let data = try? Data(contentsOf: metadataFile),
              let tracks = try? JSONDecoder().decode([Track].self, from: data) else {
            return []
        }
        return tracks
    }

    // MARK: - Delete
    func deleteTrackFiles(_ track: Track) {
        if let path = track.audioPath {
            try? FileManager.default.removeItem(at: documentsURL.appendingPathComponent(path))
        }
        if let path = track.artworkPath {
            try? FileManager.default.removeItem(at: documentsURL.appendingPathComponent(path))
        }
    }

    // MARK: - Storage Size
    func totalStorageUsed() -> Int64 {
        var size: Int64 = 0
        let folders = [musicFolder, artworkFolder]
        for folder in folders {
            if let contents = try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: [.fileSizeKey]) {
                for url in contents {
                    let fileSize = (try? url.resourceValues(forKeys: [.fileSizeKey]))?.fileSize ?? 0
                    size += Int64(fileSize)
                }
            }
        }
        return size
    }
}
