#!/usr/bin/env python3
"""
Link the Google Mobile Ads SDK into the generated Xcode project.

src-tauri/gen/apple is not tracked, so run this after every `tauri ios init`.
It adds the GoogleMobileAds Swift package to project.yml (same version as
tauri-plugin-admob/ios/Package.swift) and regenerates the project with xcodegen.
Never add -ObjC: every Tauri plugin bundles its own Tauri.o and the flag causes
hundreds of duplicate symbols.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GEN = ROOT / "src-tauri" / "gen" / "apple"
PROJECT = GEN / "project.yml"
PACKAGE_SWIFT = ROOT / "tauri-plugin-admob" / "ios" / "Package.swift"


def sdk_version() -> str:
    m = re.search(r'google-mobile-ads\.git",\s*exact:\s*"([^"]+)"', PACKAGE_SWIFT.read_text())
    if not m:
        sys.exit("could not read the GoogleMobileAds version from Package.swift")
    return m.group(1)


def main() -> None:
    if not PROJECT.exists():
        sys.exit("run `pnpm exec tauri ios init` first")
    text = PROJECT.read_text()
    version = sdk_version()
    changed = False
    if "GoogleMobileAds:" not in text:
        block = (
            "packages:\n"
            "  # Links the Mobile Ads SDK into the app; tauri-plugin-admob compiles against\n"
            "  # the same version (keep both in step).\n"
            "  GoogleMobileAds:\n"
            "    url: https://github.com/googleads/swift-package-manager-google-mobile-ads.git\n"
            f"    exactVersion: {version}\n"
        )
        text, n = re.subn(r"(?m)^(configs:)", block + r"\1", text, count=1)
        if n != 1:
            sys.exit("could not find the configs block in project.yml")
        changed = True
    if "- package: GoogleMobileAds" not in text:
        text, n = re.subn(r"(      - sdk: WebKit\.framework\n)", r"\1      - package: GoogleMobileAds\n", text, count=1)
        if n != 1:
            sys.exit("could not find the WebKit dependency in project.yml")
        changed = True
    if changed:
        PROJECT.write_text(text)
        print("project.yml updated")
    subprocess.run(["xcodegen", "generate"], cwd=GEN, check=True)
    print("Xcode project regenerated with GoogleMobileAds", version)


if __name__ == "__main__":
    main()
