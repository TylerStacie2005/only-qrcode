use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "app.tauri.admob";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_admob);

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<AdMob<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "AdMobPlugin")?;

    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_admob)?;

    Ok(AdMob(handle))
}

pub struct AdMob<R: Runtime>(tauri::plugin::PluginHandle<R>);

impl<R: Runtime> AdMob<R> {
    pub async fn initialize(&self, args: InitializeArgs) -> crate::Result<InitializeResult> {
        self.0
            .run_mobile_plugin_async("initialize", args)
            .await
            .map_err(Into::into)
    }

    pub async fn load_interstitial(&self, args: LoadAdArgs) -> crate::Result<()> {
        self.0
            .run_mobile_plugin_async("loadInterstitial", args)
            .await
            .map_err(Into::into)
    }

    pub async fn show_interstitial(&self) -> crate::Result<()> {
        self.0
            .run_mobile_plugin_async("showInterstitial", ())
            .await
            .map_err(Into::into)
    }

    pub async fn load_rewarded(&self, args: LoadAdArgs) -> crate::Result<()> {
        self.0
            .run_mobile_plugin_async("loadRewarded", args)
            .await
            .map_err(Into::into)
    }

    pub async fn show_rewarded(&self) -> crate::Result<RewardedResult> {
        self.0
            .run_mobile_plugin_async("showRewarded", ())
            .await
            .map_err(Into::into)
    }

    pub async fn privacy_options_status(&self) -> crate::Result<PrivacyOptionsStatus> {
        self.0
            .run_mobile_plugin_async("privacyOptionsStatus", ())
            .await
            .map_err(Into::into)
    }

    pub async fn first_install_time(&self) -> crate::Result<FirstInstallTime> {
        self.0
            .run_mobile_plugin_async("firstInstallTime", ())
            .await
            .map_err(Into::into)
    }

    pub async fn show_privacy_options(&self) -> crate::Result<InitializeResult> {
        self.0
            .run_mobile_plugin_async("showPrivacyOptions", ())
            .await
            .map_err(Into::into)
    }
}
