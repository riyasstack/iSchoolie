import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = 'screenshots/qa';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {};

async function prepare(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ischoolie-theme', 'light');
    } catch {}
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 20000 });
  await page.waitForTimeout(1000);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 1400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function captureSections(page, prefix) {
  await page.addStyleTag({ content: 'header{display:none!important}' });
  const sections = page.locator('main > section');
  const count = await sections.count();
  for (let i = 0; i < count; i += 1) {
    const section = sections.nth(i);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(320);
    const id = (await section.getAttribute('id')) || `section-${i + 1}`;
    await section.screenshot({ path: `${OUT}/${prefix}-${String(i + 1).padStart(2, '0')}-${id}.png` });
  }
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(320);
  await footer.screenshot({ path: `${OUT}/${prefix}-footer.png` });
  console.log(`sections captured: ${prefix}`);
}

for (const [name, width, height, allSections] of [
  ['1440', 1440, 1000, true],
  ['1920', 1920, 1080, false],
  ['1024', 1024, 900, false],
  ['768', 768, 900, false],
  ['390', 390, 844, true],
  ['375', 375, 812, false],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text().slice(0, 200));
  });
  page.on('pageerror', (err) => errors.push(`PAGE: ${err.message.slice(0, 200)}`));

  try {
    await prepare(page);
    const info = await page.evaluate(() => {
      const broken = Array.from(document.images)
        .filter((img) => img.offsetParent !== null && (!img.complete || img.naturalWidth === 0))
        .map((img) => img.currentSrc || img.src);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        height: document.documentElement.scrollHeight,
        brokenImages: broken,
        h1: document.querySelector('h1')?.textContent?.trim(),
        h2Count: document.querySelectorAll('h2').length,
      };
    });
    await page.screenshot({ path: `${OUT}/${name}-00-hero.png` });
    if (allSections) await captureSections(page, name);
    report[name] = { ...(info || {}), errors: errors.slice(0, 8) };
    console.log(`captured ${name}`, JSON.stringify({ info: info ?? null, errorCount: errors.length }));
  } catch (error) {
    report[name] = { failed: String(error).slice(0, 300), errors: errors.slice(0, 8) };
    console.log(`FAILED ${name}`, String(error).slice(0, 200));
  }
  await page.close();
}

// Desktop interactions.
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await prepare(page);
  const explore = page.getByRole('button', { name: /Explore/ });
  await explore.click();
  await page.waitForTimeout(350);
  const megaOpen = await explore.getAttribute('aria-expanded');
  await page.screenshot({ path: `${OUT}/interaction-megamenu.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const megaAfterEscape = await explore.getAttribute('aria-expanded');

  await page.locator('header button[aria-label="Search iSchoolie"]').click();
  await page.waitForTimeout(300);
  await page.locator('input[aria-label="Search iSchoolie"]').fill('institutions');
  await page.waitForTimeout(250);
  const searchResults = await page.locator('[aria-label="Search iSchoolie"] a').count();
  await page.screenshot({ path: `${OUT}/interaction-search.png` });
  await page.keyboard.press('Escape');

  await page.locator('#faq').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const faqButtons = page.locator('#faq button[aria-expanded]');
  await faqButtons.nth(1).click();
  await page.waitForTimeout(400);
  const faqExpanded = await faqButtons.nth(1).getAttribute('aria-expanded');
  await page.screenshot({ path: `${OUT}/interaction-faq.png` });

  report.interactions = { megaOpen, megaAfterEscape, searchResults, faqExpanded };
  console.log('interactions', JSON.stringify(report.interactions));
  await page.close();
} catch (error) {
  report.interactions = { failed: String(error).slice(0, 300) };
  console.log('FAILED interactions', String(error).slice(0, 200));
}

// Mobile menu.
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await prepare(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(450);
  const drawer = page.locator('#mobile-navigation');
  const drawerVisible = await drawer.evaluate((el) => getComputedStyle(el).opacity);
  await page.screenshot({ path: `${OUT}/mobile-menu-390.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  report.mobileMenu = {
    drawerVisible,
    drawerAfterEscape: await drawer.evaluate((el) => getComputedStyle(el).opacity),
  };
  console.log('mobileMenu', JSON.stringify(report.mobileMenu));
  await page.close();
} catch (error) {
  report.mobileMenu = { failed: String(error).slice(0, 300) };
  console.log('FAILED mobile menu', String(error).slice(0, 200));
}

await browser.close();
fs.writeFileSync(`${OUT}/qa-report.json`, JSON.stringify(report, null, 2));
console.log('REPORT', JSON.stringify(report, null, 2));
