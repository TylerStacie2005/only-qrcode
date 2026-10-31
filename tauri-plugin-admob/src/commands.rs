use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::AdMobExt;

#[command]
pub(crate) async fn initialize<R: Runtime>(
    app: AppHandle<R>,
    child_directed: bool,
    test_device_ids: Option<Vec<String>>,
    debug_geography: Option<String>,
) -> crate::Result<InitializeResult> {
    app.admob()
        .initialize(InitializeArgs {
            child_directed,
            test_device_ids: test_device_ids.unwrap_or_default(),
            debug_geography,
        })
        .await
}

#[command]
pub(crate) async fn load_interstitial<R: Runtime>(
    app: AppHandle<R>,
    ad_unit_id: String,
) -> crate::Result<()> {
    app.admob()
        .load_interstitial(LoadAdArgs { ad_unit_id })
        .await
}

#[command]
pub(crate) async fn show_interstitial<R: Runtime>(app: AppHandle<R>) -> crate::Result<()> {
    app.admob().show_interstitial().await
}

#[command]
pub(crate) async fn load_rewarded<R: Runtime>(
    app: AppHandle<R>,
    ad_unit_id: String,
) -> crate::Result<()> {
    app.admob().load_rewarded(LoadAdArgs { ad_unit_id }).await
}

#[command]
pub(crate) async fn show_rewarded<R: Runtime>(app: AppHandle<R>) -> crate::Result<RewardedResult> {
    app.admob().show_rewarded().await
}

#[command]
pub(crate) async fn privacy_options_status<R: Runtime>(
    app: AppHandle<R>,
) -> crate::Result<PrivacyOptionsStatus> {
    app.admob().privacy_options_status().await
}

#[command]
pub(crate) async fn show_privacy_options<R: Runtime>(
    app: AppHandle<R>,
) -> crate::Result<InitializeResult> {
    app.admob().show_privacy_options().await
}

#[command]
pub(crate) async fn first_install_time<R: Runtime>(
    app: AppHandle<R>,
) -> crate::Result<FirstInstallTime> {
    app.admob().first_install_time().await
}
