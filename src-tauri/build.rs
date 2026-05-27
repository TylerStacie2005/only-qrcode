fn main() {
  tauri_build::build();

  // `save_image_to_photos` is defined in Sources/only-qrcode/SaveToPhotos.m
  // and linked by Xcode when assembling the final .app. The standalone cargo
  // cdylib link doesn't see that .o, so allow the symbol to be resolved at
  // final-link time on iOS.
  if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("ios") {
    println!("cargo:rustc-cdylib-link-arg=-Wl,-undefined,dynamic_lookup");
  }
}
