use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeArgs {
    /// Child-directed treatment: non-personalized, G-rated ads and no
    /// consent form. Required while the app targets under-13 players.
    pub child_directed: bool,
    #[serde(default)]
    pub test_device_ids: Vec<String>,
    /// Test builds only: "eea" or "us" makes UMP behave as if the device were in
    /// that region, so the consent flow can be exercised anywhere.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub debug_geography: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeResult {
    pub can_request_ads: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadAdArgs {
    pub ad_unit_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RewardedResult {
    pub rewarded: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FirstInstallTime {
    /// Epoch milliseconds the app was first installed or bought; absent when unknown.
    #[serde(default)]
    pub time: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyOptionsStatus {
    /// The region requires a way to revisit consent (EEA/UK, regulated US states).
    pub required: bool,
}
