import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outputDir = "/Users/onurseckinsenoglu/Desktop/dsa_visualizer_before_after";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const artifactDir =
  "/Users/onurseckinsenoglu/.gemini/antigravity-cli/brain/075e93ec-b6b0-4621-ac1c-8079ac1c4d11";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const routes = [
    { url: "http://localhost:5173/", name: "01_tree_page" },
    { url: "http://localhost:5173/problems", name: "02_problems_page" },
    { url: "http://localhost:5173/trivia", name: "03_trivia_page" },
    { url: "http://localhost:5173/workspace/bubble-sort", name: "04_workspace_page" },
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route.url}...`);
    await page.goto(route.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000); // Wait for React rendering

    const desktopPath = path.join(outputDir, `${route.name}_after.png`);
    const artifactPath = path.join(artifactDir, `${route.name}_after.png`);

    await page.screenshot({ path: desktopPath, fullPage: true });
    await page.screenshot({ path: artifactPath, fullPage: true });
    console.log(`Saved screenshot to ${desktopPath}`);
  }

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
