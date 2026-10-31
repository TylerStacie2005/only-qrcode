use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;
mod error;
mod models;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

pub use error::{Error, Result};
pub use models::*;

#[cfg(desktop)]
use desktop::AdMob;
#[cfg(mobile)]
use mobile::AdMob;

pub trait AdMobExt<R: Runtime> {
    fn admob(&self) -> &AdMob<R>;
}

impl<R: Runtime, T: Manager<R>> AdMobExt<R> for T {
    fn admob(&self) -> &AdMob<R> {
        self.state::<AdMob<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("admob")
        .invoke_handler(tauri::generate_handler![
            commands::initialize,
            commands::load_interstitial,
            commands::show_interstitial,
            commands::load_rewarded,
            commands::show_rewarded,
            commands::privacy_options_status,
            commands::show_privacy_options,
            commands::first_install_time,
        ])
        .setup(|app, _api| {
            #[cfg(mobile)]
            let admob = mobile::init(app, _api)?;
            #[cfg(desktop)]
            let admob = desktop::init(app)?;

            app.manage(admob);
            Ok(())
        })
        .build()
}
