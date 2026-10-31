// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "tauri-plugin-admob",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "tauri-plugin-admob",
            type: .static,
            targets: ["tauri-plugin-admob"]
        ),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api"),
        // Keep in step with the GoogleMobileAds package in src-tauri/gen/apple/project.yml,
        // which is what actually links the SDK into the app.
        .package(
            url: "https://github.com/googleads/swift-package-manager-google-mobile-ads.git",
            exact: "13.11.0"
        ),
    ],
    targets: [
        .target(
            name: "tauri-plugin-admob",
            dependencies: [
                .product(name: "Tauri", package: "Tauri"),
                .product(name: "GoogleMobileAds", package: "swift-package-manager-google-mobile-ads"),
            ],
            path: "Sources"
        ),
    ]
)
