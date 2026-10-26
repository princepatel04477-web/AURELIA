const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const qaDir = path.join(__dirname, '..', 'qa');
if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'collections', path: '/collections' },
  { name: 'piece', path: '/collections/aurelia-solitaire' },
  { name: 'bespoke', path: '/bespoke' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function checkImageFlatness(imagePath) {
  try {
    const { data, info } = await sharp(imagePath)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Check if image is completely solid flat color (std deviation < 1)
    let sum = 0;
    let sumSq = 0;
    const pixelCount = (info.width * info.height) / 4;
    
    for (let i = 0; i < data.length; i += 4 * info.channels) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
    }
    
    const mean = sum / pixelCount;
    const variance = (sumSq / pixelCount) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    
    // Truly blank viewport with no text/imagery will have nearly 0 standard deviation
    return stdDev < 0.8;
  } catch (e) {
    return false;
  }
}

async function runQA() {
  const issues = [];
  console.log('Starting QA screenshot capture & checks...');

  for (const disableWebGL of [false, true]) {
    const modeName = disableWebGL ? 'no-webgl' : 'normal';
    console.log(`\n--- Mode: ${modeName} ---`);

    const launchArgs = disableWebGL ? ['--disable-webgl'] : [];
    const browser = await chromium.launch({
      channel: 'chrome',
      args: launchArgs,
      headless: true,
    });

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      for (const p of PAGES) {
        const url = `http://localhost:3000${p.path}`;
        console.log(`Navigating to ${url} [${vp.name}, ${modeName}]`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Scroll through to load any lazy assets
        await page.evaluate(async () => {
          const totalHeight = document.documentElement.scrollHeight;
          const step = window.innerHeight;
          for (let y = 0; y < totalHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });

        // Wait for all images to complete loading
        await page.evaluate(async () => {
          const imgs = Array.from(document.querySelectorAll('img'));
          await Promise.all(
            imgs.map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
                setTimeout(resolve, 2000);
              });
            })
          );
        });

        await page.waitForTimeout(500);

        // Check for visible error overlays
        const errorOverlay = await page.evaluate(() => {
          const bodyText = document.body.innerText || '';
          if (
            bodyText.includes('Application error') ||
            bodyText.includes('client-side exception') ||
            bodyText.includes('Unhandled Runtime Error')
          ) {
            return bodyText.slice(0, 300);
          }
          return null;
        });

        if (errorOverlay) {
          issues.push({
            page: p.name,
            mode: modeName,
            viewport: vp.name,
            type: 'visible error overlay',
            detail: errorOverlay,
          });
        }

        // Check for broken images
        const brokenImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.src || img.getAttribute('src'));
        });

        if (brokenImages.length > 0) {
          issues.push({
            page: p.name,
            mode: modeName,
            viewport: vp.name,
            type: 'broken images',
            detail: brokenImages,
          });
        }

        // Get total scroll height
        const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        const steps = Math.ceil(totalHeight / vp.height);

        for (let step = 0; step < steps; step++) {
          const scrollY = step * vp.height;
          await page.evaluate((y) => window.scrollTo(0, y), scrollY);
          await page.waitForTimeout(250);

          const filename = `${p.name}_${vp.name}_${modeName}_step${step + 1}.png`;
          const filePath = path.join(qaDir, filename);
          await page.screenshot({ path: filePath });

          // Check if viewport is truly blank/flat
          const isBlank = await checkImageFlatness(filePath);
          if (isBlank) {
            issues.push({
              page: p.name,
              mode: modeName,
              viewport: vp.name,
              step: step + 1,
              type: 'blank viewport',
              detail: `Solid blank viewport detected on ${filename}`,
            });
          }
        }
      }

      await context.close();
    }

    await browser.close();
  }

  console.log('\n===========================================');
  console.log('QA RUN COMPLETE. Summary:');
  console.log(`Total issues detected: ${issues.length}`);
  if (issues.length > 0) {
    console.log(JSON.stringify(issues, null, 2));
  } else {
    console.log('ALL CHECKS PASSED: ZERO ISSUES DETECTED!');
  }
  console.log('===========================================\n');
}

runQA().catch((err) => {
  console.error(err);
  process.exit(1);
});
