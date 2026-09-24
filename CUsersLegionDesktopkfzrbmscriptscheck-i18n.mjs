#!/usr/bin/env node
/**
 * Check that all i18n keys exist in all language files (de.json, en.json, mk.json)
 * Also detects mojibake (incorrect encoding) issues
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

// Check for mojibake patterns - UTF-8 decoded as wrong encoding
function detectMojibake(text, lang) {
  if (typeof text !== 'string') return null;

  // These patterns indicate mojibake - UTF-8 misinterpreted as Latin-1 or similar
  // These are ALWAYS wrong regardless of language:
  const universalMojibakePatterns = [
    'Ã¤', // UTF-8 ä decoded as Latin-1
    'Ã¶', // UTF-8 ö decoded as Latin-1
    'Ã¼', // UTF-8 ü decoded as Latin-1
    'Ã', // Broken UTF-8 indicator
  ];

  // Language-specific: German and English should not have Cyrillic mojibake patterns
  const germanEnglishMojibakePatterns = [
    'Гњ', // UTF-8 Cyrillic bytes misinterpreted
    'Гђ',
    'РЎ',
  ];

  // Check universal patterns
  for (const pattern of universalMojibakePatterns) {
    if (text.includes(pattern)) {
      return pattern;
    }
  }

  // Check language-specific patterns
  if (lang === 'de' || lang === 'en') {
    for (const pattern of germanEnglishMojibakePatterns) {
      if (text.includes(pattern)) {
        return pattern;
      }
    }
  }

  return null;
}

// Recursively check all values for mojibake
function checkMojibakeInObject(obj, lang, prefix = '') {
  const issues = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      issues.push(...checkMojibakeInObject(value, lang, fullKey));
    } else if (typeof value === 'string') {
      const mojibake = detectMojibake(value, lang);
      if (mojibake) {
        issues.push({ key: fullKey, value, pattern: mojibake });
      }
    }
  }
  return issues;
}

// Check for mojibake in all language files
let hasMojibake = false;
const mojibakeIssues = {};

for (const lang of languages) {
  const issues = checkMojibakeInObject(messages[lang], lang);
  if (issues.length > 0) {
    mojibakeIssues[lang] = issues;
    hasMojibake = true;
  }
}

if (hasMojibake) {
  console.error('\n❌ ENCODING ISSUES (MOJIBAKE) DETECTED:\n');
  for (const lang of languages) {
    if (mojibakeIssues[lang] && mojibakeIssues[lang].length > 0) {
      console.error(`${lang}.json has ${mojibakeIssues[lang].length} mojibake issue(s):`);
      mojibakeIssues[lang].forEach(issue => {
        const snippet = issue.value.length > 50 ? issue.value.substring(0, 47) + '...' : issue.value;
        console.error(`  - ${issue.key}: "${snippet}"`);
        console.error(`    Suspicious pattern: ${issue.pattern}`);
      });
      console.error('');
    }
  }
  process.exit(1);
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
  console.log('✅ No encoding issues (mojibake) detected!');
  console.log(`Total keys: ${allKeys.size}`);
  console.log('Languages: de, en, mk');
  process.exit(0);
}
