#!/usr/bin/env node
/**
 * Check that all i18n keys exist in all language files (de.json, en.json, mk.json)
 * Usage: node scripts/check-i18n.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '..', 'messages');

const languages = ['de', 'en', 'mk'];
const messages = {};

// Load all message files
for (const lang of languages) {
  const filePath = path.join(messagesDir, `${lang}.json`);
  try {
    messages[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error loading ${lang}.json:`, err.message);
    process.exit(1);
  }
}

// Recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get all unique keys across all languages
const allKeys = new Set();
for (const lang of languages) {
  const keys = getAllKeys(messages[lang]);
  keys.forEach(k => allKeys.add(k));
}

// Check for missing keys
let hasMissing = false;
const missing = {};

for (const lang of languages) {
  missing[lang] = [];
}

for (const key of Array.from(allKeys).sort()) {
  for (const lang of languages) {
    const keys = getAllKeys(messages[lang]);
    if (!keys.includes(key)) {
      missing[lang].push(key);
      hasMissing = true;
    }
  }
}

if (hasMissing) {
  console.error('\n❌ MISSING TRANSLATION KEYS FOUND:\n');
  for (const lang of languages) {
    if (missing[lang].length > 0) {
      console.error(`${lang}.json is missing ${missing[lang].length} key(s):`);
      missing[lang].forEach(k => console.error(`  - ${k}`));
      console.error('');
    }
  }
  process.exit(1);
} else {
  console.log('✅ All translation keys are present in all language files!');
  console.log(`Total keys: ${allKeys.size}`);
  console.log('Languages: de, en, mk');
  process.exit(0);
}
