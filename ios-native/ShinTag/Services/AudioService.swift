import AVFoundation
import MediaPlayer
import Combine
import UIKit

@MainActor
class AudioService: ObservableObject {
    static let shared = AudioService()

    // MARK: - Published State
    @Published var currentTrack: Track?
    @Published var isPlaying: Bool = false
    @Published var currentTime: Double = 0
    @Published var duration: Double = 0
    @Published var volume: Float = 1.0

    // MARK: - Private
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var playlist: [Track] = []
    private var currentIndex: Int = 0

    private init() {
        setupAudioSession()
        setupRemoteCommandCenter()
    }

    // MARK: - Audio Session
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .default,
                options: [.allowBluetooth, .allowAirPlay]
            )
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("❌ AudioService: Failed to configure audio session: \(error)")
        }
    }

    // MARK: - Play
    func play(track: Track, in playlist: [Track] = []) {
        self.playlist = playlist.isEmpty ? [track] : playlist
        self.currentIndex = self.playlist.firstIndex(where: { $0.id == track.id }) ?? 0
        loadAndPlay(track: track)
    }

    private func loadAndPlay(track: Track) {
        stopTimeObserver()

        var url: URL?
        // Prefer local file, fallback to cloud URL
        if let localURL = StorageService.shared.audioURL(for: track),
           FileManager.default.fileExists(atPath: localURL.path) {
            url = localURL
        } else if let cloudURL = track.audioUrl.flatMap({ URL(string: $0) }) {
            url = cloudURL
        }

        guard let audioURL = url else {
            print("❌ AudioService: No audio source for track \(track.id)")
            return
        }

        let item = AVPlayerItem(url: audioURL)
        if player == nil {
            player = AVPlayer(playerItem: item)
        } else {
            player?.replaceCurrentItem(with: item)
        }

        currentTrack = track
        duration = track.duration

        // Observe duration when loaded
        NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.handleTrackEnded()
            }
        }

        player?.play()
        isPlaying = true

        setupTimeObserver()
        updateNowPlaying(track: track)
    }

    func togglePlay() {
        if isPlaying { pause() } else { resume() }
    }

    func pause() {
        player?.pause()
        isPlaying = false
        updateNowPlayingPlaybackState()
    }

    func resume() {
        player?.play()
        isPlaying = true
        updateNowPlayingPlaybackState()
    }

    func seek(to seconds: Double) {
        let time = CMTime(seconds: seconds, preferredTimescale: 600)
        player?.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
        currentTime = seconds
    }

    func next() {
        guard !playlist.isEmpty else { return }
        currentIndex = (currentIndex + 1) % playlist.count
        loadAndPlay(track: playlist[currentIndex])
    }

    func previous() {
        guard !playlist.isEmpty else { return }
        if currentTime > 3 {
            seek(to: 0)
            return
        }
        currentIndex = (currentIndex - 1 + playlist.count) % playlist.count
        loadAndPlay(track: playlist[currentIndex])
    }

    private func handleTrackEnded() {
        if currentIndex + 1 < playlist.count {
            next()
        } else {
            isPlaying = false
            currentTime = 0
            seek(to: 0)
        }
    }

    // MARK: - Time Observer
    private func setupTimeObserver() {
        let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self = self else { return }
            self.currentTime = time.seconds

            if let item = self.player?.currentItem {
                let dur = item.duration.seconds
                if dur.isFinite && dur > 0 {
                    self.duration = dur
                }
            }
            self.updateNowPlayingPositionState()
        }
    }

    private func stopTimeObserver() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
    }

    // MARK: - Lock Screen / Control Center (MPNowPlayingInfoCenter)
    private func updateNowPlaying(track: Track) {
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: track.title,
            MPMediaItemPropertyArtist: track.artist,
            MPMediaItemPropertyAlbumTitle: track.album,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: 1.0
        ]

        // Artwork
        if let artworkData = StorageService.shared.artworkData(for: track),
           let image = UIImage(data: artworkData) {
            info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: CGSize(width: 512, height: 512)) { _ in image }
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func updateNowPlayingPositionState() {
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func updateNowPlayingPlaybackState() {
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    // MARK: - Remote Control (Tai nghe, Apple Watch, CarPlay)
    private func setupRemoteCommandCenter() {
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.addTarget { [weak self] _ in
            self?.resume(); return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.pause(); return .success
        }
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.togglePlay(); return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.next(); return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.previous(); return .success
        }
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let e = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self?.seek(to: e.positionTime)
            return .success
        }
    }
}
