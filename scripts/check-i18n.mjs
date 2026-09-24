#!/usr/bin/env node
/**
 * Check that all i18n keys exist in all language files (de.json, en.json, mk.json)
 * Also detects mojibake and scans code for unused translation keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const messagesDir = path.join(rootDir, 'messages');

const languages = ['de', 'en', 'mk'];
const messages = {};

for (const lang of languages) {
  const filePath = path.join(messagesDir, `${lang}.json`);
  try {
    messages[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error loading ${lang}.json:`, err.message);
    process.exit(1);
  }
}

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

function hasMojibake(str, lang) {
  if (typeof str !== 'string') return false;

  // UTF-8 misinterpreted as Latin-1 patterns
  const universalMojibake = ['Ã', 'Ã¤', 'Ã¶', 'Ã¼'];
  for (const char of universalMojibake) {
    if (str.includes(char)) {
      return true;
    }
  }

  // Cyrillic mojibake in German/English (should never appear)
  if (lang === 'de' || lang === 'en') {
    const cyrillicMojibake = ['Гњ', 'Гђ', 'РЎ'];
    for (const char of cyrillicMojibake) {
      if (str.includes(char)) {
        return true;
      }
    }
  }

  // Macedonian mojibake detection: two-character pairs indicating broken encoding
  if (lang === 'mk') {
    const macedonianMojibakePairs = [
      'Р°', 'Рё', 'Рѕ', 'РЅ', 'Р»', 'Рµ', 'С‚', 'СЃ', 'Рќ', 'Рџ',
      'Р¤', 'Р¥', 'Р¦', 'Р§', 'Р¨', 'Р©', 'Рє', 'Рї', 'РЃ', 'РЄ'
    ];

    for (const pair of macedonianMojibakePairs) {
      if (str.includes(pair)) {
        return true;
      }
    }
  }

  return false;
}

function checkValues(obj, lang) {
  const issues = [];

  function traverse(current, prefix) {
    for (const [key, value] of Object.entries(current)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, fullKey);
      } else if (typeof value === 'string' && hasMojibake(value, lang)) {
        issues.push({ key: fullKey, value });
      }
    }
  }

  traverse(obj, '');
  return issues;
}

// Scan code for t("key") calls with namespace support
function scanCodeForKeys() {
  const usedKeys = new Set();

  // Find all .tsx, .ts, .jsx, .js files in app/ and components/
  const files = globSync([
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
  ], { cwd: rootDir, nodir: true });

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Extract namespace from useTranslations("namespace") or getTranslations("namespace") or getTranslations({namespace: "ns"})
      let namespace = null;

      // Match: useTranslations("namespace") or getTranslations("namespace")
      const nsPattern1 = /(?:useTranslations|getTranslations)\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/;
      const match1 = content.match(nsPattern1);
      if (match1) {
        namespace = match1[1];
      }

      // Match: getTranslations({namespace: "ns"})
      const nsPattern2 = /getTranslations\s*\(\s*{\s*namespace\s*:\s*["'`]([^"'`]+)["'`]\s*}\s*\)/;
      const match2 = content.match(nsPattern2);
      if (match2) {
        namespace = match2[1];
      }

      // Pattern to match t("key"), t('key'), t(`key`)
      const keyPattern = /\bt\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
      let match;

      while ((match = keyPattern.exec(content)) !== null) {
        const key = match[1];
        // Skip keys that contain template variable interpolations
        if (key.includes('${')) {
          continue;
        }
        // If we have a namespace and the key doesn't already contain a dot (not a full path), prepend namespace
        if (namespace && !key.includes('.')) {
          usedKeys.add(`${namespace}.${key}`);
        } else {
          usedKeys.add(key);
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  return usedKeys;
}

// Check for mojibake
let hasMojibakeIssues = false;
const mojibakeIssues = {};

for (const lang of languages) {
  const issues = checkValues(messages[lang], lang);
  if (issues.length > 0) {
    mojibakeIssues[lang] = issues;
    hasMojibakeIssues = true;
  }
}

if (hasMojibakeIssues) {
  console.error('\n❌ ENCODING ISSUES (MOJIBAKE) DETECTED:\n');
  for (const lang of languages) {
    if (mojibakeIssues[lang] && mojibakeIssues[lang].length > 0) {
      console.error(`${lang}.json has ${mojibakeIssues[lang].length} mojibake issue(s):`);
      mojibakeIssues[lang].slice(0, 5).forEach(issue => {
        const snippet = issue.value.length > 50 ? issue.value.substring(0, 47) + '...' : issue.value;
        console.error(`  - ${issue.key}: "${snippet}"`);
      });
      if (mojibakeIssues[lang].length > 5) {
        console.error(`  ... and ${mojibakeIssues[lang].length - 5} more`);
      }
    }
  }
  process.exit(1);
}

// Check for missing keys in message files
const allKeys = new Set();
for (const lang of languages) {
  const keys = getAllKeys(messages[lang]);
  keys.forEach(k => allKeys.add(k));
}

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
  console.error('\n❌ MISSING TRANSLATION KEYS IN MESSAGE FILES:\n');
  for (const lang of languages) {
    if (missing[lang].length > 0) {
      console.error(`${lang}.json is missing ${missing[lang].length} key(s):`);
      missing[lang].forEach(k => console.error(`  - ${k}`));
    }
  }
  process.exit(1);
}

// Check for keys used in code but missing from message files
console.log('\n📝 Scanning code for translation keys...');
const usedKeys = scanCodeForKeys();
console.log(`   Found ${usedKeys.size} unique keys used in code`);

let codeHasIssues = false;
const missingInMessages = {};

for (const lang of languages) {
  missingInMessages[lang] = [];
  const messageKeys = new Set(getAllKeys(messages[lang]));

  for (const usedKey of usedKeys) {
    if (!messageKeys.has(usedKey)) {
      missingInMessages[lang].push(usedKey);
      codeHasIssues = true;
    }
  }
}

if (codeHasIssues) {
  console.error('\n❌ KEYS USED IN CODE BUT MISSING FROM MESSAGE FILES:\n');
  for (const lang of languages) {
    if (missingInMessages[lang].length > 0) {
      console.error(`${lang}.json is missing ${missingInMessages[lang].length} key(s) used in code:`);
      missingInMessages[lang].sort().forEach(k => console.error(`  - ${k}`));
    }
  }
  process.exit(1);
}

// Success!
console.log('✅ All translation keys are present in all language files!');
console.log('✅ No encoding issues (mojibake) detected!');
console.log('✅ All keys used in code are defined in message files!');
console.log(`\n📊 Summary:`);
console.log(`   Total keys in message files: ${allKeys.size}`);
console.log(`   Keys used in code: ${usedKeys.size}`);
console.log(`   Languages: de, en, mk`);
process.exit(0);
