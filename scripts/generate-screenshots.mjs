import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";
import { join } from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const APP_URL = "http://localhost:5199";
const OUT_DIR = join(import.meta.dirname, "..", "fastlane", "screenshots", "en-US");

const DEVICES = [
  { name: "iPhone_55", width: 1242, height: 2208, scale: 3, appW: 414, appH: 736 },
  { name: "iPhone_65", width: 1284, height: 2778, scale: 3, appW: 428, appH: 926 },
  { name: "iPhone_67", width: 1290, height: 2796, scale: 3, appW: 430, appH: 932 },
  { name: "iPad_129",  width: 2048, height: 2732, scale: 2, appW: 1024, appH: 1366 },
];

// Helper: click element by text content
async function clickByText(page, text) {
  await page.evaluate((t) => {
    const all = [...document.querySelectorAll("button, [role='button']")];
    const el = all.find(e => e.textContent?.trim() === t);
    if (el) el.click();
  }, text);
  await new Promise(r => setTimeout(r, 400));
}

// Helper: click nth frame thumbnail
async function clickFrame(page, index) {
  await page.evaluate((idx) => {
    const frameRow = document.querySelectorAll('[class*="MuiStack-root"] > [class*="MuiBox-root"]');
    // Frame items are in the row that has the scrollable frame picker
    const allBoxes = [...document.querySelectorAll(".MuiBox-root")];
    const framePicker = allBoxes.filter(b =>
      b.style?.cursor === "pointer" || b.getAttribute("style")?.includes("cursor: pointer")
    );
    // Fallback: look for boxes inside the frame Stack
    const stacks = document.querySelectorAll(".MuiStack-root");
    for (const stack of stacks) {
      if (stack.style?.overflowX === "auto" || stack.getAttribute("style")?.includes("overflow")) {
        const children = [...stack.children];
        if (children[idx]) { children[idx].click(); return; }
      }
    }
    // Last fallback: click by cursor style in computed styles
    const clickable = allBoxes.filter(b => window.getComputedStyle(b).cursor === "pointer");
    if (clickable[idx]) clickable[idx].click();
  }, index);
  await new Promise(r => setTimeout(r, 400));
}

// Helper: set color input value
async function setColor(page, index, color) {
  await page.evaluate((idx, c) => {
    const inputs = document.querySelectorAll('input[type="color"]');
    if (inputs[idx]) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      nativeSetter.call(inputs[idx], c);
      inputs[idx].dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, index, color);
  await new Promise(r => setTimeout(r, 300));
}

// Helper: set text input value
async function setText(page, value) {
  await page.evaluate((v) => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      nativeSetter.call(ta, v);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, value);
  await new Promise(r => setTimeout(r, 300));
}

// Helper: open icon picker and select icon by index
async function selectIcon(page, index) {
  // Click the "Add" button
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const addBtn = btns.find(b => b.textContent?.trim() === "Add" || b.textContent?.trim() === "Change");
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  // Click the icon in the popover
  await page.evaluate((idx) => {
    const popover = document.querySelector(".MuiPopover-paper");
    if (popover) {
      const iconBtns = popover.querySelectorAll("button");
      if (iconBtns[idx]) iconBtns[idx].click();
    }
  }, index);
  await new Promise(r => setTimeout(r, 400));
}

async function compositeScreenshot(browser, appScreenshot, device, shot) {
  const compositorPage = await browser.newPage();
  await compositorPage.setViewport({ width: device.width, height: device.height, deviceScaleFactor: 1 });

  const headlineFontSize = device.name.startsWith("iPad") ? 80 : 60;
  const subtitleFontSize = device.name.startsWith("iPad") ? 38 : 26;
  const appImgWidth = device.name.startsWith("iPad") ? "68%" : "80%";
  const headlineEscaped = shot.headline.replace(/\n/g, "<br>");
  const appImgBase64 = Buffer.from(appScreenshot).toString("base64");

  const html = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${device.width}px;
    height: ${device.height}px;
    background: ${shot.bgGradient};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
    overflow: hidden;
  }
  .header {
    padding-top: ${Math.round(device.height * 0.055)}px;
    text-align: center;
    flex-shrink: 0;
  }
  .headline {
    font-size: ${headlineFontSize}px;
    font-weight: 700;
    color: ${shot.textColor};
    line-height: 1.12;
    letter-spacing: -1px;
  }
  .subtitle {
    font-size: ${subtitleFontSize}px;
    font-weight: 400;
    color: ${shot.textColor};
    opacity: 0.8;
    margin-top: ${Math.round(headlineFontSize * 0.4)}px;
  }
  .phone-frame {
    margin-top: ${Math.round(device.height * 0.03)}px;
    width: ${appImgWidth};
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }
  .phone-frame img {
    width: 100%;
    height: auto;
    object-fit: cover;
    object-position: top;
    border-radius: ${device.name.startsWith("iPad") ? 28 : 36}px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.35);
  }
</style></head><body>
  <div class="header">
    <div class="headline">${headlineEscaped}</div>
    <div class="subtitle">${shot.subtitle}</div>
  </div>
  <div class="phone-frame">
    <img src="data:image/png;base64,${appImgBase64}" />
  </div>
</body></html>`;

  await compositorPage.setContent(html, { waitUntil: "load", timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  const filename = `${device.name}_${shot.suffix}.png`;
  const filepath = join(OUT_DIR, filename);
  await compositorPage.screenshot({ path: filepath, type: "png" });
  console.log(`  ${filename} (${device.width}x${device.height})`);
  await compositorPage.close();
}

const SCREENSHOTS = [
  {
    suffix: "01_create",
    headline: "Create Beautiful<br>QR Codes",
    subtitle: "Frames, icons, colors & titles.",
    bgGradient: "linear-gradient(160deg, #1565C0, #42A5F5)",
    textColor: "#ffffff",
    setup: async (page) => {
      await setText(page, "https://example.com");
      await clickFrame(page, 2); // bold frame
      await selectIcon(page, 0); // wifi icon
    },
  },
  {
    suffix: "02_frames",
    headline: "14 Decorative<br>Frame Styles",
    subtitle: "Make your QR codes stand out.",
    bgGradient: "linear-gradient(160deg, #1B2838, #2E4057)",
    textColor: "#4eeaac",
    setup: async (page) => {
      await setText(page, "myportfolio.dev");
      await setColor(page, 0, "#4eeaac"); // foreground teal
      await clickFrame(page, 7); // badge frame
      await selectIcon(page, 5); // heart icon
    },
  },
  {
    suffix: "03_read",
    headline: "Read & Decode<br>QR Codes",
    subtitle: "Scan from any image instantly.",
    bgGradient: "linear-gradient(160deg, #2E7D32, #66BB6A)",
    textColor: "#ffffff",
    setup: async (page) => {
      await clickByText(page, "Read");
    },
  },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  mkdirSync(OUT_DIR, { recursive: true });
  // Remove old screenshots
  const { readdirSync, unlinkSync } = await import("fs");
  for (const f of readdirSync(OUT_DIR)) {
    if (f.endsWith(".png")) unlinkSync(join(OUT_DIR, f));
  }

  for (const device of DEVICES) {
    console.log(`\n${device.name} (${device.width}x${device.height}):`);

    for (const shot of SCREENSHOTS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: device.appW,
        height: device.appH,
        deviceScaleFactor: device.scale,
      });

      await page.goto(APP_URL, { waitUntil: "networkidle0", timeout: 15000 });
      await new Promise(r => setTimeout(r, 800));

      try {
        await shot.setup(page);
      } catch (e) {
        console.warn(`  Warning [${shot.suffix}]: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 600));

      const appScreenshot = await page.screenshot({ type: "png" });
      await compositeScreenshot(browser, appScreenshot, device, shot);
      await page.close();
    }
  }

  await browser.close();
  console.log("\nDone!");
}

main().catch(console.error);
