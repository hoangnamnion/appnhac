import SwiftUI

@main
struct ShinTagApp: App {
    let trackStore = TrackStore()
    let audioService = AudioService.shared
    let syncService = SyncService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(trackStore)
                .environmentObject(audioService)
                .environmentObject(syncService)
                .preferredColorScheme(.dark)
        }
    }
}
