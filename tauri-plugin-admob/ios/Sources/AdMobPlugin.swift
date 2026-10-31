import GoogleMobileAds
import StoreKit
import SwiftRs
import Tauri
import UIKit
import UserMessagingPlatform
import WebKit

struct InitializeArgs: Decodable {
    let childDirected: Bool
    let testDeviceIds: [String]?
    let debugGeography: String?
}

struct LoadAdArgs: Decodable {
    let adUnitId: String
}

class AdMobPlugin: Plugin {

    private var interstitial: InterstitialAd?
    private var rewarded: RewardedAd?

    /// Show invoke waiting for the ad to be dismissed.
    private var pendingShowInvoke: Invoke?
    private var earnedReward = false

    // MARK: - Initialize

    @objc public func initialize(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(InitializeArgs.self)

        DispatchQueue.main.async {
            let config = MobileAds.shared.requestConfiguration
            if args.childDirected {
                config.tagForChildDirectedTreatment = true
                config.tagForUnderAgeOfConsent = true
                config.maxAdContentRating = .general
            }
            if let ids = args.testDeviceIds, !ids.isEmpty {
                config.testDeviceIdentifiers = ids
            }

            let params = RequestParameters()
            params.isTaggedForUnderAgeOfConsent = args.childDirected
            NSLog("[AdMob] Initializing, debug geography %@", args.debugGeography ?? "none")
            if let geography = Self.debugGeography(args.debugGeography) {
                // Test builds only: behave as if the device were in a regulated region, and forget
                // any consent state from earlier runs so the flow starts like a fresh install.
                ConsentInformation.shared.reset()
                let debug = DebugSettings()
                debug.geography = geography
                params.debugSettings = debug
            }

            // Consent has to be gathered before the SDK starts so the first
            // request already carries the user's choice (EEA/UK only).
            ConsentInformation.shared.requestConsentInfoUpdate(with: params) { [weak self] error in
                if let error = error {
                    // Nothing to gate on: without a usable consent configuration (no message set
                    // up for this app id, or no network) UMP reports canRequestAds=false forever,
                    // which would silently disable ads. Start the SDK as an app without UMP would.
                    NSLog("[AdMob] Consent info update failed, starting without it: %@", error.localizedDescription)
                    self?.startSdk(invoke, force: true)
                    return
                }
                let consent = ConsentInformation.shared
                NSLog("[AdMob] Consent info updated: status %@, form %ld, privacy options %@", Self.name(consent.consentStatus), consent.formStatus.rawValue, Self.name(consent.privacyOptionsRequirementStatus))
                guard let vc = self?.topViewController() else {
                    self?.startSdk(invoke)
                    return
                }
                ConsentForm.loadAndPresentIfRequired(from: vc) { error in
                    if let error = error {
                        NSLog("[AdMob] Consent form failed: %@", error.localizedDescription)
                    }
                    self?.startSdk(invoke)
                }
            }
        }
    }

    private func startSdk(_ invoke: Invoke, force: Bool = false) {
        let consent = ConsentInformation.shared
        let canRequestAds = force || consent.canRequestAds
        NSLog(
            "[AdMob] Consent status %@, privacy options %@, canRequestAds %d",
            Self.name(consent.consentStatus), Self.name(consent.privacyOptionsRequirementStatus), canRequestAds)
        guard canRequestAds else {
            invoke.resolve(["canRequestAds": false])
            return
        }
        MobileAds.shared.start { _ in
            invoke.resolve(["canRequestAds": true])
        }
    }

    /// Names for the consent enums, so logs read the same as Android.
    private static func name(_ status: ConsentStatus) -> String {
        switch status {
        case .notRequired: return "NOT_REQUIRED"
        case .required: return "REQUIRED"
        case .obtained: return "OBTAINED"
        default: return "UNKNOWN"
        }
    }

    private static func name(_ status: PrivacyOptionsRequirementStatus) -> String {
        switch status {
        case .notRequired: return "NOT_REQUIRED"
        case .required: return "REQUIRED"
        default: return "UNKNOWN"
        }
    }

    private static func debugGeography(_ name: String?) -> DebugGeography? {
        switch name {
        case "eea": return .EEA
        case "us": return .regulatedUSState
        default: return nil
        }
    }

    // MARK: - Privacy options

    /// Whether the region requires a way to revisit consent (EEA/UK, regulated US states).
    @objc public func privacyOptionsStatus(_ invoke: Invoke) throws {
        DispatchQueue.main.async {
            let required = ConsentInformation.shared.privacyOptionsRequirementStatus == .required
            invoke.resolve(["required": required])
        }
    }

    /// Epoch milliseconds the app was first downloaded: the verified App Store original
    /// purchase date on iOS 16+, else the creation date of the app's Library folder.
    /// Resolves empty when neither is available.
    @objc public func firstInstallTime(_ invoke: Invoke) throws {
        Task {
            if #available(iOS 16.0, *) {
                if let result = try? await AppTransaction.shared, case .verified(let transaction) = result {
                    invoke.resolve(["time": Int64(transaction.originalPurchaseDate.timeIntervalSince1970 * 1000)])
                    return
                }
            }
            let library = (NSHomeDirectory() as NSString).appendingPathComponent("Library")
            if let created = (try? FileManager.default.attributesOfItem(atPath: library))?[.creationDate] as? Date {
                invoke.resolve(["time": Int64(created.timeIntervalSince1970 * 1000)])
            } else {
                invoke.resolve([:])
            }
        }
    }

    /// Reopen the consent form so the player can change their choice. Resolves when it
    /// closes, with whether ads may still be requested.
    @objc public func showPrivacyOptions(_ invoke: Invoke) throws {
        DispatchQueue.main.async { [weak self] in
            guard let vc = self?.topViewController() else {
                invoke.reject("No view controller to present from")
                return
            }
            ConsentForm.presentPrivacyOptionsForm(from: vc) { error in
                if let error = error {
                    NSLog("[AdMob] Privacy options form failed: %@", error.localizedDescription)
                    invoke.reject(error.localizedDescription)
                    return
                }
                invoke.resolve(["canRequestAds": ConsentInformation.shared.canRequestAds])
            }
        }
    }

    // MARK: - Interstitial

    @objc public func loadInterstitial(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(LoadAdArgs.self)

        DispatchQueue.main.async { [weak self] in
            InterstitialAd.load(with: args.adUnitId, request: Request()) { ad, error in
                if let error = error {
                    NSLog("[AdMob] Interstitial load failed: %@", error.localizedDescription)
                    invoke.reject(error.localizedDescription)
                    return
                }
                ad?.fullScreenContentDelegate = self
                self?.interstitial = ad
                invoke.resolve()
            }
        }
    }

    @objc public func showInterstitial(_ invoke: Invoke) throws {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let ad = self.interstitial else {
                invoke.reject("Interstitial not loaded")
                return
            }
            guard let vc = self.topViewController() else {
                invoke.reject("No view controller to present from")
                return
            }
            // An ad can only be shown once; the caller loads the next one.
            self.interstitial = nil
            self.pendingShowInvoke = invoke
            ad.present(from: vc)
        }
    }

    // MARK: - Rewarded

    @objc public func loadRewarded(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(LoadAdArgs.self)

        DispatchQueue.main.async { [weak self] in
            RewardedAd.load(with: args.adUnitId, request: Request()) { ad, error in
                if let error = error {
                    invoke.reject(error.localizedDescription)
                    return
                }
                ad?.fullScreenContentDelegate = self
                self?.rewarded = ad
                invoke.resolve()
            }
        }
    }

    @objc public func showRewarded(_ invoke: Invoke) throws {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let ad = self.rewarded else {
                invoke.reject("Rewarded ad not loaded")
                return
            }
            guard let vc = self.topViewController() else {
                invoke.reject("No view controller to present from")
                return
            }
            self.rewarded = nil
            self.earnedReward = false
            self.pendingShowInvoke = invoke
            ad.present(from: vc) { [weak self] in
                self?.earnedReward = true
            }
        }
    }

    // MARK: - Helpers

    private func topViewController() -> UIViewController? {
        guard
            let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first,
            let rootVC = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        else {
            NSLog("[AdMob] No root view controller found")
            return nil
        }
        var topVC = rootVC
        while let presented = topVC.presentedViewController {
            topVC = presented
        }
        return topVC
    }
}

// MARK: - FullScreenContentDelegate

extension AdMobPlugin: FullScreenContentDelegate {
    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        guard let invoke = pendingShowInvoke else { return }
        pendingShowInvoke = nil
        if ad is RewardedAd {
            invoke.resolve(["rewarded": earnedReward])
        } else {
            invoke.resolve()
        }
    }

    func ad(
        _ ad: FullScreenPresentingAd,
        didFailToPresentFullScreenContentWithError error: Error
    ) {
        guard let invoke = pendingShowInvoke else { return }
        pendingShowInvoke = nil
        invoke.reject(error.localizedDescription)
    }
}

@_cdecl("init_plugin_admob")
func initPlugin() -> Plugin {
    return AdMobPlugin()
}
