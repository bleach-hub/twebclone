#!/usr/bin/env node
// Download DB-IP's free monthly Country-Lite .mmdb to data/geoip-country.mmdb.
// Public download, no license key. Tries current month then walks back a few
// months until one resolves (the new month's file may not be live on day 1).

import {createWriteStream, existsSync, mkdirSync} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createGunzip} from 'node:zlib';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'data');
const OUT_FILE = resolve(OUT_DIR, 'geoip-country.mmdb');

function monthsBack(n) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function tryFetch(ym) {
  const url = `https://download.db-ip.com/free/dbip-country-lite-${ym}.mmdb.gz`;
  process.stdout.write(`→ ${url} … `);
  const res = await fetch(url);
  if(!res.ok) {
    console.log(`HTTP ${res.status}`);
    return false;
  }
  console.log('OK, downloading');
  mkdirSync(OUT_DIR, {recursive: true});
  await pipeline(res.body, createGunzip(), createWriteStream(OUT_FILE));
  return true;
}

if(existsSync(OUT_FILE) && !process.argv.includes('--force')) {
  console.log(`Already present: ${OUT_FILE} (use --force to redownload)`);
  process.exit(0);
}

for(let i = 0; i < 4; i++) {
  if(await tryFetch(monthsBack(i))) {
    console.log(`Saved: ${OUT_FILE}`);
    process.exit(0);
  }
}

console.error('error: could not fetch DB-IP Country Lite for any of the last 4 months');
process.exit(1);
