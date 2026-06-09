/**
 * Generates Key Wallet PNG icons for the browser extension.
 * Run with: node browser-extension/generate-icons.mjs
 * Output: browser-extension/icons/icon{16,48,128}.png
 *         public/pwa-192.png  public/pwa-512.png  (for PWA)
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Minimal PNG encoder ───────────────────────────────────────────────────────
function u32(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  const tbl = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tbl[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = tbl[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const tb = Buffer.from(type);
  const crcVal = crc32(Buffer.concat([tb, data]));
  return Buffer.concat([u32(data.length), tb, data, u32(crcVal)]);
}

function encodePNG(width, height, rgba) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    rows.push(0); // filter none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rows.push(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]);
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = chunk('IHDR', Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])]));
  const idat = chunk('IDAT', deflateSync(Buffer.from(rows)));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// ── Drawing helpers ───────────────────────────────────────────────────────────
function setPixel(rgba, width, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const i = (y * width + x) * 4;
  const fa = a / 255;
  const ba = rgba[i + 3] / 255;
  const out = fa + ba * (1 - fa);
  if (out === 0) return;
  rgba[i]     = Math.round((r * fa + rgba[i]     * ba * (1 - fa)) / out);
  rgba[i + 1] = Math.round((g * fa + rgba[i + 1] * ba * (1 - fa)) / out);
  rgba[i + 2] = Math.round((b * fa + rgba[i + 2] * ba * (1 - fa)) / out);
  rgba[i + 3] = Math.round(out * 255);
}

function fillRect(rgba, w, x, y, rw, rh, r, g, b, a = 255) {
  for (let py = y; py < y + rh; py++)
    for (let px = x; px < x + rw; px++)
      setPixel(rgba, w, px, py, r, g, b, a);
}

function fillCircle(rgba, w, cx, cy, radius, r, g, b, a = 255) {
  const x0 = Math.floor(cx - radius), x1 = Math.ceil(cx + radius);
  const y0 = Math.floor(cy - radius), y1 = Math.ceil(cy + radius);
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const d = Math.hypot(px - cx, py - cy);
      const alpha = Math.max(0, Math.min(1, radius - d + 0.5));
      if (alpha > 0) setPixel(rgba, w, px, py, r, g, b, Math.round(a * alpha));
    }
  }
}

function fillRoundedRect(rgba, w, x, y, rw, rh, cr, r, g, b, a = 255) {
  cr = Math.min(cr, rw / 2, rh / 2);
  // Corners
  fillCircle(rgba, w, x + cr,      y + cr,      cr, r, g, b, a);
  fillCircle(rgba, w, x + rw - cr, y + cr,      cr, r, g, b, a);
  fillCircle(rgba, w, x + cr,      y + rh - cr, cr, r, g, b, a);
  fillCircle(rgba, w, x + rw - cr, y + rh - cr, cr, r, g, b, a);
  // Edges
  fillRect(rgba, w, x + cr, y,         rw - cr * 2, rh,          r, g, b, a);
  fillRect(rgba, w, x,      y + cr,    cr,          rh - cr * 2, r, g, b, a);
  fillRect(rgba, w, x + rw - cr, y + cr, cr,        rh - cr * 2, r, g, b, a);
}

// Draw line segment with given thickness
function drawLine(rgba, w, x1, y1, x2, y2, thick, r, g, b, a = 255) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    fillCircle(rgba, w, cx, cy, thick / 2, r, g, b, a);
  }
}

// Point-in-polygon (ray cast)
function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// ── Draw Key Wallet icon at given size ────────────────────────────────────────
function drawIcon(size) {
  const rgba = new Uint8Array(size * size * 4);
  const s = size;

  // Background: #0078D4 (0, 120, 212) rounded rect
  const cr = Math.round(s * 0.2);
  fillRoundedRect(rgba, s, 0, 0, s, s, cr, 0, 120, 212);

  // Shield shape (white) — hexagonal with pointed bottom
  const shield = [
    [0.50, 0.12],
    [0.83, 0.28],
    [0.83, 0.54],
    [0.50, 0.87],
    [0.17, 0.54],
    [0.17, 0.28],
  ].map(([x, y]) => [x * s, y * s]);

  for (let py = 0; py < s; py++) {
    for (let px = 0; px < s; px++) {
      if (inPoly(px, py, shield)) {
        setPixel(rgba, s, px, py, 255, 255, 255);
      }
    }
  }

  // Checkmark inside shield (blue) — thicker for visibility
  const thick = Math.max(1.5, s * 0.07);
  const cx = s * 0.5, cy = s * 0.5;
  // Checkmark: left arm  (0.30,0.52) → (0.44,0.65)
  //            right arm (0.44,0.65) → (0.72,0.37)
  const ax = s * 0.30, ay = s * 0.52;
  const bx = s * 0.44, by = s * 0.65;
  const dx = s * 0.72, dy = s * 0.37;

  drawLine(rgba, s, ax, ay, bx, by, thick, 0, 120, 212);
  drawLine(rgba, s, bx, by, dx, dy, thick, 0, 120, 212);

  return rgba;
}

// ── Generate all icon sizes ───────────────────────────────────────────────────
const SIZES = [
  { size: 16,  file: resolve(__dir, 'icons/icon16.png') },
  { size: 48,  file: resolve(__dir, 'icons/icon48.png') },
  { size: 128, file: resolve(__dir, 'icons/icon128.png') },
  { size: 192, file: resolve(__dir, '../artifacts/personal-key-wallet/public/pwa-192.png') },
  { size: 512, file: resolve(__dir, '../artifacts/personal-key-wallet/public/pwa-512.png') },
];

mkdirSync(resolve(__dir, 'icons'), { recursive: true });

for (const { size, file } of SIZES) {
  const rgba = drawIcon(size);
  const png = encodePNG(size, size, rgba);
  writeFileSync(file, png);
  console.log(`✓ ${file} (${size}×${size})`);
}

console.log('\n✅ All icons generated!');
console.log('Next: Load browser-extension/ as unpacked extension in Chrome/Firefox.');
