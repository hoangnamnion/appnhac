import SwiftUI

struct ContentView: View {
    @EnvironmentObject var audioService: AudioService

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView {
                LibraryView()
                    .tabItem {
                        Label("Thư Viện", systemImage: "music.note.list")
                    }

                UploadView()
                    .tabItem {
                        Label("Tạo Nhạc", systemImage: "plus.circle.fill")
                    }

                SettingsView()
                    .tabItem {
                        Label("Cài Đặt", systemImage: "gear")
                    }
            }
            .accentColor(AppTheme.blue)

            // Mini Player always on top above tab bar
            if audioService.currentTrack != nil {
                MiniPlayerView()
                    .padding(.bottom, 49) // tab bar height
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: audioService.currentTrack != nil)
    }
}
