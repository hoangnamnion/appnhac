import Foundation
import Combine

@MainActor
class TrackStore: ObservableObject {
    @Published var tracks: [Track] = []
    @Published var isLoading: Bool = false
    @Published var searchQuery: String = ""

    var filteredTracks: [Track] {
        if searchQuery.isEmpty { return tracks }
        return tracks.filter {
            $0.title.localizedCaseInsensitiveContains(searchQuery) ||
            $0.artist.localizedCaseInsensitiveContains(searchQuery) ||
            $0.album.localizedCaseInsensitiveContains(searchQuery)
        }
    }

    private let storage = StorageService.shared

    init() {
        loadFromDisk()
    }

    func loadFromDisk() {
        tracks = storage.loadTrackMetadata()
    }

    func addTrack(_ track: Track) {
        tracks.insert(track, at: 0)
        storage.saveTrackMetadata(tracks)
    }

    func updateTrack(_ track: Track) {
        if let idx = tracks.firstIndex(where: { $0.id == track.id }) {
            tracks[idx] = track
            storage.saveTrackMetadata(tracks)
        }
    }

    func deleteTrack(_ track: Track) {
        tracks.removeAll { $0.id == track.id }
        storage.deleteTrackFiles(track)
        storage.saveTrackMetadata(tracks)
    }

    func mergeFromCloud(_ cloudTracks: [Track]) {
        for cloudTrack in cloudTracks {
            if let idx = tracks.firstIndex(where: { $0.id == cloudTrack.id }) {
                // Update cloud metadata but keep local paths
                var merged = cloudTrack
                merged.audioPath = tracks[idx].audioPath
                merged.artworkPath = tracks[idx].artworkPath
                tracks[idx] = merged
            } else {
                tracks.append(cloudTrack)
            }
        }
        tracks.sort { $0.createdAt > $1.createdAt }
        storage.saveTrackMetadata(tracks)
    }
}
