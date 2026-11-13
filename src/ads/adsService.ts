/**
 * Interstitial ads through tauri-plugin-admob. Everything here is best effort: on macOS,
 * in the browser, for past buyers, when the person declined consent, or when an ad fails
 * to load, the app simply carries on without one.
 */

import { isTauri } from "@tauri-apps/api/core";
import { AD_UNITS, ADS, ADS_STORAGE_KEY, PAID_UNTIL } from "./constants";

let canRequestAds = false;
let interstitialReady = false;
let interstitialLoading = false;
let usesSinceAd = 0;
// Most sessions reach a single break, so the first one may show an ad; the gap applies between ads.
let lastAdAt = 0;

/**
 * True only in the iOS and Android apps. macOS and the browser never show ads. iPadOS web
 * views report a Mac user agent, so a touch screen is what tells an iPad from a Mac.
 */
const onPhone = () => {
  const ua = navigator.userAgent;
  return isTauri() && (/android|iphone|ipad/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1));
};

/**
 * Past buyers stay ad-free. On the first launch of an ads version, any existing app data in
 * localStorage, or an install date before the app turned free, means the person bought the
 * paid app. The answer is stored once so later launches cannot change it. Call before
 * anything else writes.
 */
async function resolveAdFree(): Promise<boolean> {
  try {
    const stored = localStorage.getItem(ADS_STORAGE_KEY);
    if (stored) return JSON.parse(stored).adFree === true;
  } catch { /* unreadable flag: decide again */ }

  let adFree = false;
  try {
    adFree = Object.keys(localStorage).some((k) => k !== ADS_STORAGE_KEY);
  } catch { /* storage unavailable: treated as a new install */ }
  if (!adFree) {
    // The paid app kept no local data, so the install date is the real signal.
    try {
      const { firstInstallTime } = await import("tauri-plugin-admob-api");
      const installedAt = await firstInstallTime();
      adFree = installedAt !== null && installedAt < PAID_UNTIL;
    } catch { /* unknown install date: keep the answer above */ }
  }
  try {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify({ adFree }));
  } catch { /* storage unavailable: decided again next launch */ }
  return adFree;
}

/**
 * Decide ad-free status, then gather consent and start the SDK. Call once at launch,
 * before the app can write anything. Resolves when the decision is made (not when the
 * SDK finishes), so it is safe to await before rendering.
 */
export async function initAds(): Promise<void> {
  if (!onPhone()) return;
  if (await resolveAdFree()) return;
  if (!AD_UNITS.INTERSTITIAL) return;
  void startSdk();
}

async function startSdk(): Promise<void> {
  try {
    const { initialize } = await import("tauri-plugin-admob-api");
    ({ canRequestAds } = await initialize({ childDirected: ADS.CHILD_DIRECTED }));
    void preloadInterstitial();
  } catch (e) {
    console.warn("[Ads] initialize failed:", e);
  }
}

async function preloadInterstitial(): Promise<void> {
  if (!canRequestAds || interstitialReady || interstitialLoading) return;
  interstitialLoading = true;
  try {
    const { loadInterstitial } = await import("tauri-plugin-admob-api");
    await loadInterstitial(AD_UNITS.INTERSTITIAL);
    interstitialReady = true;
  } catch (e) {
    console.warn("[Ads] interstitial load failed:", e);
  } finally {
    interstitialLoading = false;
  }
}

/**
 * Call at a natural break after a completed use (leaving a scan result or a generated
 * code). Shows an interstitial when enough uses and time have passed since the last one,
 * and resolves after the person dismisses it. A no-op wherever ads are off.
 */
export async function maybeShowInterstitial(): Promise<void> {
  if (!canRequestAds) return;
  usesSinceAd++;
  const due =
    usesSinceAd >= ADS.USES_BETWEEN_INTERSTITIALS &&
    Date.now() - lastAdAt >= ADS.MIN_MS_BETWEEN_INTERSTITIALS;
  if (!due || !interstitialReady) {
    // Retry a load that failed earlier (no fill, offline).
    void preloadInterstitial();
    return;
  }
  interstitialReady = false;
  try {
    const { showInterstitial } = await import("tauri-plugin-admob-api");
    await showInterstitial();
  } catch (e) {
    console.warn("[Ads] interstitial show failed:", e);
  }
  usesSinceAd = 0;
  lastAdAt = Date.now();
  void preloadInterstitial();
}
