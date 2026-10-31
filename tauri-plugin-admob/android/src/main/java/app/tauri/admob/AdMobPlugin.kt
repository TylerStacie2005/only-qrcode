package app.tauri.admob

import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentDebugSettings
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

@InvokeArg
class InitializeArgs {
    var childDirected: Boolean = true
    var testDeviceIds: List<String>? = null
    var debugGeography: String? = null
}

@InvokeArg
class LoadAdArgs {
    lateinit var adUnitId: String
}

@TauriPlugin
class AdMobPlugin(private val activity: Activity) : Plugin(activity) {

    private var interstitial: InterstitialAd? = null
    private var rewarded: RewardedAd? = null

    // region Initialize

    @Command
    fun initialize(invoke: Invoke) {
        val args = invoke.parseArgs(InitializeArgs::class.java)

        val config = RequestConfiguration.Builder()
        if (args.childDirected) {
            config.setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
            config.setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
            config.setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
        }
        args.testDeviceIds?.let { config.setTestDeviceIds(it) }
        MobileAds.setRequestConfiguration(config.build())

        val paramsBuilder = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(args.childDirected)
        Log.i(TAG, "Initializing, debug geography ${args.debugGeography ?: "none"}")
        debugGeography(args.debugGeography)?.let { geography ->
            // Test builds only: behave as if the device were in a regulated region, and forget
            // any consent state from earlier runs so the flow starts like a fresh install.
            UserMessagingPlatform.getConsentInformation(activity).reset()
            paramsBuilder.setConsentDebugSettings(
                ConsentDebugSettings.Builder(activity).setDebugGeography(geography).build()
            )
        }
        val params = paramsBuilder.build()
        val consentInfo = UserMessagingPlatform.getConsentInformation(activity)

        // Consent has to be gathered before the SDK starts so the first
        // request already carries the user's choice (EEA/UK only).
        activity.runOnUiThread {
            consentInfo.requestConsentInfoUpdate(
                activity,
                params,
                {
                    Log.i(TAG, "Consent info updated: status ${statusName(consentInfo.consentStatus)}, form available ${consentInfo.isConsentFormAvailable}, privacy options ${consentInfo.privacyOptionsRequirementStatus}")
                    UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                        formError?.let { Log.w(TAG, "Consent form failed: ${it.message}") }
                        startSdk(invoke, consentInfo.canRequestAds())
                    }
                },
                { requestError ->
                    // Nothing to gate on: without a usable consent configuration (no message set
                    // up for this app id, or no network) UMP reports canRequestAds=false forever,
                    // which would silently disable ads. Start the SDK as an app without UMP would.
                    Log.w(TAG, "Consent info update failed, starting without it: ${requestError.message}")
                    startSdk(invoke, true)
                }
            )
        }
    }

    /** Android's consent status is a plain int; name it so logs read the same as iOS. */
    private fun statusName(status: Int): String = when (status) {
        ConsentInformation.ConsentStatus.NOT_REQUIRED -> "NOT_REQUIRED"
        ConsentInformation.ConsentStatus.REQUIRED -> "REQUIRED"
        ConsentInformation.ConsentStatus.OBTAINED -> "OBTAINED"
        else -> "UNKNOWN"
    }

    private fun startSdk(invoke: Invoke, canRequestAds: Boolean) {
        val consentInfo = UserMessagingPlatform.getConsentInformation(activity)
        Log.i(TAG, "Consent status ${statusName(consentInfo.consentStatus)}, privacy options ${consentInfo.privacyOptionsRequirementStatus}, canRequestAds $canRequestAds")
        if (!canRequestAds) {
            invoke.resolve(JSObject().put("canRequestAds", false))
            return
        }
        // Google recommends initializing off the main thread.
        Thread {
            MobileAds.initialize(activity) {
                invoke.resolve(JSObject().put("canRequestAds", true))
            }
        }.start()
    }

    private fun debugGeography(name: String?): Int? = when (name) {
        "eea" -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA
        "us" -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_REGULATED_US_STATE
        else -> null
    }

    // endregion

    // region Privacy options

    /** Epoch milliseconds the app was first installed; resolves empty when unknown. */
    @Command
    fun firstInstallTime(invoke: Invoke) {
        try {
            val pm = activity.packageManager
            val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getPackageInfo(activity.packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(activity.packageName, 0)
            }
            invoke.resolve(JSObject().put("time", info.firstInstallTime))
        } catch (e: Exception) {
            invoke.resolve(JSObject())
        }
    }

    /** Whether the region requires a way to revisit consent (EEA/UK, regulated US states). */
    @Command
    fun privacyOptionsStatus(invoke: Invoke) {
        val status = UserMessagingPlatform.getConsentInformation(activity).privacyOptionsRequirementStatus
        invoke.resolve(JSObject().put("required", status == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED))
    }

    /**
     * Reopen the consent form so the player can change their choice. Resolves when it
     * closes, with whether ads may still be requested.
     */
    @Command
    fun showPrivacyOptions(invoke: Invoke) {
        activity.runOnUiThread {
            UserMessagingPlatform.showPrivacyOptionsForm(activity) { formError ->
                if (formError != null) {
                    Log.w(TAG, "Privacy options form failed: ${formError.message}")
                    invoke.reject(formError.message)
                } else {
                    val consentInfo = UserMessagingPlatform.getConsentInformation(activity)
                    invoke.resolve(JSObject().put("canRequestAds", consentInfo.canRequestAds()))
                }
            }
        }
    }

    // endregion

    // region Interstitial

    @Command
    fun loadInterstitial(invoke: Invoke) {
        val args = invoke.parseArgs(LoadAdArgs::class.java)

        activity.runOnUiThread {
            InterstitialAd.load(
                activity,
                args.adUnitId,
                AdRequest.Builder().build(),
                object : InterstitialAdLoadCallback() {
                    override fun onAdLoaded(ad: InterstitialAd) {
                        interstitial = ad
                        invoke.resolve()
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        invoke.reject(error.message)
                    }
                }
            )
        }
    }

    @Command
    fun showInterstitial(invoke: Invoke) {
        activity.runOnUiThread {
            val ad = interstitial
            if (ad == null) {
                invoke.reject("Interstitial not loaded")
                return@runOnUiThread
            }
            // An ad can only be shown once; the caller loads the next one.
            interstitial = null
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    invoke.resolve()
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    invoke.reject(error.message)
                }
            }
            ad.show(activity)
        }
    }

    // endregion

    // region Rewarded

    @Command
    fun loadRewarded(invoke: Invoke) {
        val args = invoke.parseArgs(LoadAdArgs::class.java)

        activity.runOnUiThread {
            RewardedAd.load(
                activity,
                args.adUnitId,
                AdRequest.Builder().build(),
                object : RewardedAdLoadCallback() {
                    override fun onAdLoaded(ad: RewardedAd) {
                        rewarded = ad
                        invoke.resolve()
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        invoke.reject(error.message)
                    }
                }
            )
        }
    }

    @Command
    fun showRewarded(invoke: Invoke) {
        activity.runOnUiThread {
            val ad = rewarded
            if (ad == null) {
                invoke.reject("Rewarded ad not loaded")
                return@runOnUiThread
            }
            rewarded = null
            var earned = false
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    invoke.resolve(JSObject().put("rewarded", earned))
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    invoke.reject(error.message)
                }
            }
            ad.show(activity) { earned = true }
        }
    }

    // endregion

    companion object {
        private const val TAG = "AdMob"
    }
}
