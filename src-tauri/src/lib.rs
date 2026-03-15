use base64::Engine;
use tauri::command;

#[cfg(target_os = "ios")]
mod ios {
    use std::ffi::{c_void, CString};
    use std::os::raw::c_char;

    extern "C" {
        fn dlsym(handle: *mut c_void, symbol: *const c_char) -> *mut c_void;
    }

    const RTLD_DEFAULT: *mut c_void = -2isize as *mut c_void;

    pub fn save_to_photos(path: &str) -> Result<(), String> {
        let c_path = CString::new(path).map_err(|e| e.to_string())?;
        let sym_name = CString::new("save_image_to_photos").unwrap();
        let sym = unsafe { dlsym(RTLD_DEFAULT, sym_name.as_ptr()) };
        if sym.is_null() {
            return Err("save_image_to_photos symbol not found".into());
        }
        let func: extern "C" fn(*const c_char) -> i32 =
            unsafe { std::mem::transmute(sym) };
        let result = func(c_path.as_ptr());
        if result == 0 {
            Ok(())
        } else {
            Err("Failed to save image to Photos".into())
        }
    }
}

#[command]
fn save_qr_to_photos(base64_data: String) -> Result<(), String> {
    let data = base64::engine::general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| e.to_string())?;

    let tmp_dir = std::env::temp_dir();
    let tmp_path = tmp_dir.join("qrcode.png");
    std::fs::write(&tmp_path, &data).map_err(|e| e.to_string())?;

    #[cfg(target_os = "ios")]
    {
        ios::save_to_photos(tmp_path.to_str().ok_or("Invalid path")?)?;
    }

    #[cfg(not(target_os = "ios"))]
    {
        return Err("Save to Photos is only supported on iOS".into());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_qr_to_photos])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
