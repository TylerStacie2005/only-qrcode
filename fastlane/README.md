fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload screenshots and metadata to App Store Connect

### ios testflight_submit

```sh
[bundle exec] fastlane ios testflight_submit
```

Submit build to TestFlight

### ios cancel_review

```sh
[bundle exec] fastlane ios cancel_review
```

Cancel pending App Store review

### ios submit_for_review

```sh
[bundle exec] fastlane ios submit_for_review
```

Submit for App Store review

----


## Android

### android deploy

```sh
[bundle exec] fastlane android deploy
```

Upload AAB to Google Play internal testing track

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
