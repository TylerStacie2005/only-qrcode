/** Ad placement and cadence. The phone apps are free and show one interstitial after a completed use. */

const isAndroid = /android/i.test(navigator.userAgent);

// Debug builds (tauri dev, tauri build --debug) use Google's sample units, which always
// serve test ads; clicking live ads while testing gets the AdMob account banned.
const useTestAds = import.meta.env.DEV || import.meta.env.TAURI_ENV_DEBUG === "true";

/**
 * Live interstitial units from the AdMob console (Only QR Code, Android and iOS). An empty
 * id disables ads in release builds on that platform.
 */
const LIVE_INTERSTITIAL = {
  android: "ca-app-pub-6808961846456830/4525184818",
  ios: "ca-app-pub-6808961846456830/5315969413",
} as const;

export const AD_UNITS = {
  INTERSTITIAL: useTestAds
    ? isAndroid
      ? "ca-app-pub-3940256099942544/1033173712"
      : "ca-app-pub-3940256099942544/4411468910"
    : isAndroid
    ? LIVE_INTERSTITIAL.android
    : LIVE_INTERSTITIAL.ios,
} as const;

export const ADS = {
  /** General-audience utility: ad requests are not child-directed. */
  CHILD_DIRECTED: false,
  /** An ad at every break (a finished scan result or generated code), but never within this gap. */
  USES_BETWEEN_INTERSTITIALS: 1,
  MIN_MS_BETWEEN_INTERSTITIALS: 60_000,
} as const;

/**
 * Installs before this moment (2026-11-15 00:00 UTC) count as purchases, so those people stay
 * ad-free even though they have no local data. The price drops to free once the ads build is
 * approved, which must happen before this date so no paying customer lands after it.
 */
export const PAID_UNTIL = Date.UTC(2026, 10, 15);

/** localStorage key holding the one-time past-buyer decision. */
export const ADS_STORAGE_KEY = "only_qrcode_ads";
