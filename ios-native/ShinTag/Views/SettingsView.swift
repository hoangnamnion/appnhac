import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var trackStore: TrackStore

    var usedStorage: String {
        let bytes = StorageService.shared.totalStorageUsed()
        return ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundPrimary.ignoresSafeArea()
                List {
                    Section("Cloud") {
                        HStack {
                            Label("Supabase URL", systemImage: "cloud.fill")
                                .foregroundColor(AppTheme.textPrimary)
                            Spacer()
                            Text("jsiitousrc...")
                                .font(.caption)
                                .foregroundColor(AppTheme.textTertiary)
                        }
                        .listRowBackground(AppTheme.backgroundCard)
                    }

                    Section("Bộ Nhớ") {
                        HStack {
                            Label("Đã Dùng", systemImage: "internaldrive.fill")
                                .foregroundColor(AppTheme.textPrimary)
                            Spacer()
                            Text(usedStorage)
                                .foregroundColor(AppTheme.textSecondary)
                        }
                        HStack {
                            Label("Số Bài Hát", systemImage: "music.note")
                                .foregroundColor(AppTheme.textPrimary)
                            Spacer()
                            Text("\(trackStore.tracks.count) bài")
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                    .listRowBackground(AppTheme.backgroundCard)

                    Section("Ứng Dụng") {
                        HStack {
                            Label("Phiên Bản", systemImage: "info.circle")
                                .foregroundColor(AppTheme.textPrimary)
                            Spacer()
                            Text("1.0.0 Native Swift")
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                    .listRowBackground(AppTheme.backgroundCard)
                }
                .scrollContentBackground(.hidden)
                .listStyle(.insetGrouped)
            }
            .navigationTitle("Cài Đặt ⚙️")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(AppTheme.backgroundPrimary, for: .navigationBar)
        }
    }
}
