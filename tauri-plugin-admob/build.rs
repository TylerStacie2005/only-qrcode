use std::{env, path::PathBuf};

const COMMANDS: &[&str] = &[
    "initialize",
    "load_interstitial",
    "show_interstitial",
    "load_rewarded",
    "show_rewarded",
    "privacy_options_status",
    "show_privacy_options",
    "first_install_time",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();

    // The app crate also builds a cdylib on iOS, which must resolve the SDK
    // symbols at link time. Point it at the static xcframeworks SwiftPM just
    // downloaded; Xcode links the same SDK into the app via project.yml.
    // (cfg(target_os) would describe the host here, so read TARGET instead.)
    let target = env::var("TARGET").unwrap_or_default();
    if !target.contains("apple-ios") {
        return;
    }
    let slice = if target.ends_with("-sim") || target.starts_with("x86_64") {
        "ios-arm64_x86_64-simulator"
    } else {
        "ios-arm64"
    };
    let artifacts = PathBuf::from(env::var("OUT_DIR").unwrap())
        .join("swift-rs/tauri-plugin-admob/artifacts");
    for (package, framework) in [
        ("swift-package-manager-google-mobile-ads", "GoogleMobileAds"),
        (
            "swift-package-manager-google-user-messaging-platform",
            "UserMessagingPlatform",
        ),
    ] {
        let dir = artifacts
            .join(package)
            .join(framework)
            .join(format!("{framework}.xcframework"))
            .join(slice);
        println!("cargo:rustc-link-search=framework={}", dir.display());
        println!("cargo:rustc-link-lib=framework={framework}");
    }
}
