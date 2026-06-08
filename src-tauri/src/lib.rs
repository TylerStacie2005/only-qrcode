use base64::Engine;
use tauri::command;

#[cfg(target_os = "ios")]
mod ios {
    use std::ffi::{c_char, CString};

    extern "C" {
        fn save_image_to_photos(path: *const c_char) -> i32;
        fn read_clipboard_image_to_file(path: *const c_char) -> i32;
    }

    pub fn save_to_photos(path: &str) -> Result<(), String> {
        let c_path = CString::new(path).map_err(|e| e.to_string())?;
        let result = unsafe { save_image_to_photos(c_path.as_ptr()) };
        match result {
            0 => Ok(()),
            -2 => Err("Photo library permission denied".into()),
            _ => Err("Failed to save image to Photos".into()),
        }
    }

    pub fn read_clipboard_image(path: &str) -> Result<(), String> {
        let c_path = CString::new(path).map_err(|e| e.to_string())?;
        let result = unsafe { read_clipboard_image_to_file(c_path.as_ptr()) };
        match result {
            0 => Ok(()),
            -1 => Err("No image on the clipboard".into()),
            _ => Err("Failed to read clipboard image".into()),
        }
    }
}

#[cfg(target_os = "android")]
mod android {
    use jni::objects::{JObject, JValue};
    use jni::JavaVM;

    pub fn save_to_gallery(bytes: &[u8], filename: &str) -> Result<(), String> {
        let ctx = ndk_context::android_context();
        let vm = unsafe { JavaVM::from_raw(ctx.vm().cast()) }
            .map_err(|e| format!("JavaVM::from_raw: {e}"))?;
        let mut env = vm
            .attach_current_thread()
            .map_err(|e| format!("attach_current_thread: {e}"))?;

        let context = unsafe { JObject::from_raw(ctx.context().cast()) };

        let class = env
            .find_class("com/tylermecham/onlyqrcode/SaveToGallery")
            .map_err(|e| format!("find_class: {e}"))?;
        let jbytes = env
            .byte_array_from_slice(bytes)
            .map_err(|e| format!("byte_array_from_slice: {e}"))?;
        let jname = env
            .new_string(filename)
            .map_err(|e| format!("new_string: {e}"))?;

        let result = env
            .call_static_method(
                &class,
                "saveImage",
                "(Landroid/content/Context;[BLjava/lang/String;)Ljava/lang/String;",
                &[
                    JValue::Object(&context),
                    JValue::Object(&jbytes),
                    JValue::Object(&jname),
                ],
            )
            .map_err(|e| format!("call_static_method: {e}"))?;

        if env.exception_check().unwrap_or(false) {
            let _ = env.exception_clear();
            return Err("Java exception during save".into());
        }

        let obj = result.l().map_err(|e| format!("result.l: {e}"))?;
        if obj.is_null() {
            Ok(())
        } else {
            let msg: String = env
                .get_string((&obj).into())
                .map_err(|e| format!("get_string: {e}"))?
                .into();
            Err(msg)
        }
    }

    pub fn read_clipboard_image() -> Result<String, String> {
        let ctx = ndk_context::android_context();
        let vm = unsafe { JavaVM::from_raw(ctx.vm().cast()) }
            .map_err(|e| format!("JavaVM::from_raw: {e}"))?;
        let mut env = vm
            .attach_current_thread()
            .map_err(|e| format!("attach_current_thread: {e}"))?;

        let context = unsafe { JObject::from_raw(ctx.context().cast()) };

        let class = env
            .find_class("com/tylermecham/onlyqrcode/ClipboardImage")
            .map_err(|e| format!("find_class: {e}"))?;

        let result = env
            .call_static_method(
                &class,
                "read",
                "(Landroid/content/Context;)Ljava/lang/String;",
                &[JValue::Object(&context)],
            )
            .map_err(|e| format!("call_static_method: {e}"))?;

        if env.exception_check().unwrap_or(false) {
            let _ = env.exception_clear();
            return Err("Java exception while reading clipboard".into());
        }

        let obj = result.l().map_err(|e| format!("result.l: {e}"))?;
        let value: String = env
            .get_string((&obj).into())
            .map_err(|e| format!("get_string: {e}"))?
            .into();

        if value == "none" {
            Err("No image on the clipboard".into())
        } else if let Some(b64) = value.strip_prefix("ok:") {
            Ok(b64.to_string())
        } else if let Some(err) = value.strip_prefix("error:") {
            Err(err.to_string())
        } else {
            Err("Unexpected clipboard result".into())
        }
    }

    pub fn share_image(bytes: &[u8], filename: &str) -> Result<(), String> {
        let ctx = ndk_context::android_context();
        let vm = unsafe { JavaVM::from_raw(ctx.vm().cast()) }
            .map_err(|e| format!("JavaVM::from_raw: {e}"))?;
        let mut env = vm
            .attach_current_thread()
            .map_err(|e| format!("attach_current_thread: {e}"))?;

        let context = unsafe { JObject::from_raw(ctx.context().cast()) };

        let class = env
            .find_class("com/tylermecham/onlyqrcode/ShareImage")
            .map_err(|e| format!("find_class: {e}"))?;
        let jbytes = env
            .byte_array_from_slice(bytes)
            .map_err(|e| format!("byte_array_from_slice: {e}"))?;
        let jname = env
            .new_string(filename)
            .map_err(|e| format!("new_string: {e}"))?;

        let result = env
            .call_static_method(
                &class,
                "share",
                "(Landroid/content/Context;[BLjava/lang/String;)Ljava/lang/String;",
                &[
                    JValue::Object(&context),
                    JValue::Object(&jbytes),
                    JValue::Object(&jname),
                ],
            )
            .map_err(|e| format!("call_static_method: {e}"))?;

        if env.exception_check().unwrap_or(false) {
            let _ = env.exception_clear();
            return Err("Java exception during share".into());
        }

        let obj = result.l().map_err(|e| format!("result.l: {e}"))?;
        if obj.is_null() {
            Ok(())
        } else {
            let msg: String = env
                .get_string((&obj).into())
                .map_err(|e| format!("get_string: {e}"))?
                .into();
            Err(msg)
        }
    }
}

#[command]
fn save_qr_to_photos(base64_data: String) -> Result<(), String> {
    let data = base64::engine::general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "ios")]
    {
        let tmp_path = std::env::temp_dir().join("qrcode.png");
        std::fs::write(&tmp_path, &data).map_err(|e| e.to_string())?;
        ios::save_to_photos(tmp_path.to_str().ok_or("Invalid path")?)?;
        return Ok(());
    }

    #[cfg(target_os = "android")]
    {
        let filename = format!(
            "qrcode-{}.png",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0)
        );
        android::save_to_gallery(&data, &filename)?;
        return Ok(());
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = data;
        Err("Save to Photos is only supported on mobile".into())
    }
}

#[command]
fn share_qr_image(base64_data: String) -> Result<(), String> {
    let data = base64::engine::general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "android")]
    {
        android::share_image(&data, "qrcode.png")?;
        return Ok(());
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = data;
        Err("Native share is only supported on Android".into())
    }
}

#[command]
fn read_clipboard_image() -> Result<String, String> {
    #[cfg(target_os = "ios")]
    {
        let tmp_path = std::env::temp_dir().join("clipboard-qr.png");
        ios::read_clipboard_image(tmp_path.to_str().ok_or("Invalid path")?)?;
        let data = std::fs::read(&tmp_path).map_err(|e| e.to_string())?;
        let _ = std::fs::remove_file(&tmp_path);
        return Ok(base64::engine::general_purpose::STANDARD.encode(&data));
    }

    #[cfg(target_os = "android")]
    {
        return android::read_clipboard_image();
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        Err("Reading the clipboard image is only supported on mobile".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_qr_to_photos,
            share_qr_image,
            read_clipboard_image
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        });

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(tauri_plugin_mcp_bridge::init());
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
