import SwiftUI

enum AppTheme {
    // MARK: - Colors
    static let blue = Color(red: 0/255, green: 122/255, blue: 255/255)
    static let blueDark = Color(red: 0/255, green: 80/255, blue: 200/255)
    static let green = Color(red: 52/255, green: 199/255, blue: 89/255)
    static let red = Color(red: 255/255, green: 59/255, blue: 48/255)
    static let backgroundPrimary = Color(red: 10/255, green: 12/255, blue: 16/255)
    static let backgroundSecondary = Color(red: 18/255, green: 20/255, blue: 26/255)
    static let backgroundCard = Color(red: 26/255, green: 28/255, blue: 36/255)
    static let textPrimary = Color.white
    static let textSecondary = Color(white: 0.6)
    static let textTertiary = Color(white: 0.4)
    static let separator = Color(white: 0.15)

    // MARK: - Gradient
    static let blueGradient = LinearGradient(
        colors: [blue, Color(red: 0/255, green: 198/255, blue: 255/255)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: - Corner Radius
    static let cornerRadiusSmall: CGFloat = 8
    static let cornerRadiusMedium: CGFloat = 14
    static let cornerRadiusLarge: CGFloat = 22

    // MARK: - Shadows
    static func cardShadow() -> some View {
        EmptyView()
    }
}

// MARK: - View Extensions
extension View {
    func shinTagCard() -> some View {
        self
            .background(AppTheme.backgroundCard)
            .cornerRadius(AppTheme.cornerRadiusMedium)
    }

    func pressEffect() -> some View {
        self.buttonStyle(PressEffectButtonStyle())
    }
}

struct PressEffectButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}
