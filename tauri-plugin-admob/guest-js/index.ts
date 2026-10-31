import { invoke } from "@tauri-apps/api/core";

export interface InitializeOptions {
  /**
   * Child-directed treatment: non-personalized, G-rated ads and no consent
   * form. False for this app; its players are adults.
   */
  childDirected: boolean;
  /** Device IDs that always get test ads (logged by the SDK on first request). */
  testDeviceIds?: string[];
  /**
   * Test builds only: make the consent flow behave as if the device were in the
   * EEA or a regulated US state, so the form and privacy options can be checked.
   */
  debugGeography?: "eea" | "us";
}

/**
 * Gather consent (EEA/UK) and start the Mobile Ads SDK. Call once at launch,
 * before loading any ad. Resolves `canRequestAds: false` when the user's
 * consent state does not allow ads; skip ads for the session in that case.
 */
export async function initialize(
  options: InitializeOptions
): Promise<{ canRequestAds: boolean }> {
  return invoke("plugin:admob|initialize", { ...options });
}

/** Load an interstitial. Rejects with the SDK's message when no fill. */
export async function loadInterstitial(adUnitId: string): Promise<void> {
  return invoke("plugin:admob|load_interstitial", { adUnitId });
}

/**
 * Show the loaded interstitial. Resolves when the player dismisses it.
 * Each loaded ad shows once; load the next one afterwards.
 */
export async function showInterstitial(): Promise<void> {
  return invoke("plugin:admob|show_interstitial");
}

/** Load a rewarded ad. Rejects with the SDK's message when no fill. */
export async function loadRewarded(adUnitId: string): Promise<void> {
  return invoke("plugin:admob|load_rewarded", { adUnitId });
}

/**
 * Show the loaded rewarded ad. Resolves on dismiss with whether the player
 * watched long enough to earn the reward.
 */
export async function showRewarded(): Promise<{ rewarded: boolean }> {
  return invoke("plugin:admob|show_rewarded");
}

/**
 * Whether the region requires a way to revisit consent (EEA/UK, and US states
 * with an opt-out). Meaningful once `initialize` has resolved; show a privacy
 * choices button when true.
 */
export async function privacyOptionsRequired(): Promise<boolean> {
  const { required } = await invoke<{ required: boolean }>(
    "plugin:admob|privacy_options_status"
  );
  return required;
}

/**
 * Reopen the consent form so the user can change their choice. Resolves when
 * it closes, with whether ads may still be requested.
 */
export async function showPrivacyOptions(): Promise<{ canRequestAds: boolean }> {
  return invoke("plugin:admob|show_privacy_options");
}

/**
 * Epoch milliseconds the app was first installed (Android) or first downloaded
 * (iOS), or null when unknown or on desktop.
 */
export async function firstInstallTime(): Promise<number | null> {
  const { time } = await invoke<{ time?: number | null }>("plugin:admob|first_install_time");
  return time ?? null;
}
