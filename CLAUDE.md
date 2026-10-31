# Only QR Code

Follows the shared conventions for Tyler's personal Tauri apps:
**[/Users/tmecham/dev/tyler/CONVENTIONS.md](/Users/tmecham/dev/tyler/CONVENTIONS.md)**

That file is the source of truth for build / dev scripts, versioning, commit conventions, branching, fastlane lanes + shared credentials, iOS / Android signing, `.gitignore` baseline, and Tauri config conventions.

## About

Minimal, no-frills QR code scanner / generator for mobile. Utility app, not a game.

## App-specific notes

- Identifier follows utility pattern: `com.<author>.onlyqrcode`
- Package manager: pnpm
- Ads (iOS and Android only): local `tauri-plugin-admob` (interstitial, UMP consent, not child-directed). Wiring is `src/ads/adsService.ts`; cadence and the `CHILD_DIRECTED` flag are `ADS` in `src/ads/constants.ts`. The break is `maybeShowInterstitial()` in `App.tsx`: when the person leaves the Create or Read tab with a generated code or a scan result showing (`handleModeChange`), and after Save to Photos or a completed web share. Never before a result is shown or mid-decode
- The Mac build never shows ads: `onPhone()` in `adsService.ts` (includes the iPad Mac-UA plus touch check) makes every ad call a no-op on macOS and in the browser, and `admob:default` lives only in `src-tauri/capabilities/mobile.json`
- Past buyers stay ad-free: the first phone launch of an ads version stores `{"adFree": bool}` under localStorage `only_qrcode_ads`, true when another localStorage key exists or the plugin's `firstInstallTime()` (Android `firstInstallTime`, iOS StoreKit `AppTransaction.originalPurchaseDate` with the Library folder creation date as fallback) is before `PAID_UNTIL` in `constants.ts` (2026-11-15 UTC; the price must drop to free before then). The paid app kept no local data, so the install date is the real signal. `main.tsx` awaits the decision before rendering
- AdMob (pub-6808961846456830): Android app ~9611979634, iOS app ~5838266486. App ids: `tauri-plugin-admob/android/src/main/res/values/strings.xml` and `GADApplicationIdentifier` in `src-tauri/Info.ios.plist` (Tauri merges it into the iOS Info.plist only). Live interstitial units: `LIVE_INTERSTITIAL` in `src/ads/constants.ts` (an empty id disables ads in release builds). Debug builds use Google's test units via `TAURI_ENV_DEBUG`, so never click real ads while testing. Android keeps the AD_ID permission
- `src-tauri/gen` is untracked, so iOS links GoogleMobileAds by running `pnpm ios:ads` (`scripts/ios-ads.py`) after every `tauri ios init` and before building. Do not add `-ObjC`: every Tauri plugin bundles its own `Tauri.o`, so it causes duplicate symbols
