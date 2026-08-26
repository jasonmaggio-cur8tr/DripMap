/**
 * Beanie Ladder renderer.
 *
 * Captures ./beanie-ladder.html at 1080x1920 as 300 PNG frames into ./frames,
 * then assembles them into ./out/beanie-ladder.mp4 (H.264, yuv420p).
 *
 * Fails loudly on any missing precondition. There is no degraded path.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(ROOT, 'assets');
const FRAMES_DIR = path.join(ROOT, 'frames');
const OUT_DIR = path.join(ROOT, 'out');
const PAGE = path.join(ROOT, 'beanie-ladder.html');

const REQUIRED_ASSETS = ['consultant.png', 'owner.png', 'roaster.png', 'barista.png'];

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_S = 10;
const FRAME_COUNT = FPS * DURATION_S; // 300

function assertAssets() {
  const missing = REQUIRED_ASSETS.filter(
    (name) => !fs.existsSync(path.join(ASSETS_DIR, name))
  );
  if (missing.length > 0) {
    throw new Error(
      `./assets is incomplete — missing: ${missing.join(', ')}. ` +
      'All four panel PNGs are required before rendering.'
    );
  }
}

function assertFfmpeg() {
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    throw new Error('ffmpeg binary not resolved from ffmpeg-static. Run: npm install');
  }
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function captureFrames() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--font-render-hinting=none', '--force-color-profile=srgb'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    page.on('pageerror', (err) => {
      throw err;
    });

    await page.goto(`file://${PAGE}`, { waitUntil: 'networkidle0' });

    await page.evaluate(() => window.beanieLadder.ready);
    await page.evaluate(() => window.beanieLadder.stopClock());

    for (let i = 0; i < FRAME_COUNT; i += 1) {
      await page.evaluate((t) => {
        window.beanieLadder.seek(t);
        return new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        );
      }, i / FPS);

      await page.screenshot({
        path: path.join(FRAMES_DIR, `frame-${String(i).padStart(3, '0')}.png`),
        type: 'png',
        captureBeyondViewport: false,
      });
    }
  } finally {
    await browser.close();
  }
}

function assertFrameCount() {
  const frames = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith('.png'));
  if (frames.length !== FRAME_COUNT) {
    throw new Error(`Frame count is ${frames.length}, expected ${FRAME_COUNT}.`);
  }
}

function encode() {
  const output = path.join(OUT_DIR, 'beanie-ladder.mp4');
  execFileSync(ffmpegPath, [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(FRAMES_DIR, 'frame-%03d.png'),
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level', '4.0',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-movflags', '+faststart',
    output,
  ], { stdio: 'inherit' });
  return output;
}

assertAssets();
assertFfmpeg();

resetDir(FRAMES_DIR);
fs.mkdirSync(OUT_DIR, { recursive: true });

await captureFrames();
assertFrameCount();

const output = encode();
console.log(`Rendered ${FRAME_COUNT} frames -> ${output}`);
