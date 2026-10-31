use tauri::{AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime>(_app: &AppHandle<R>) -> crate::Result<AdMob<R>> {
    Ok(AdMob(std::marker::PhantomData))
}

/// AdMob has no desktop SDK. Loads fail so callers skip the ad and carry on.
pub struct AdMob<R: Runtime>(std::marker::PhantomData<fn() -> R>);

impl<R: Runtime> AdMob<R> {
    pub async fn initialize(&self, _args: InitializeArgs) -> crate::Result<InitializeResult> {
        Ok(InitializeResult {
            can_request_ads: false,
        })
    }

    pub async fn load_interstitial(&self, _args: LoadAdArgs) -> crate::Result<()> {
        Err(crate::Error::AdMob("Ads are not supported on desktop".into()))
    }

    pub async fn show_interstitial(&self) -> crate::Result<()> {
        Err(crate::Error::AdMob("Ads are not supported on desktop".into()))
    }

    pub async fn load_rewarded(&self, _args: LoadAdArgs) -> crate::Result<()> {
        Err(crate::Error::AdMob("Ads are not supported on desktop".into()))
    }

    pub async fn show_rewarded(&self) -> crate::Result<RewardedResult> {
        Err(crate::Error::AdMob("Ads are not supported on desktop".into()))
    }

    pub async fn first_install_time(&self) -> crate::Result<FirstInstallTime> {
        Ok(FirstInstallTime { time: None })
    }

    pub async fn privacy_options_status(&self) -> crate::Result<PrivacyOptionsStatus> {
        Ok(PrivacyOptionsStatus { required: false })
    }

    pub async fn show_privacy_options(&self) -> crate::Result<InitializeResult> {
        Err(crate::Error::AdMob("Ads are not supported on desktop".into()))
    }
}
