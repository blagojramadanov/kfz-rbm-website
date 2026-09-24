#!/usr/bin/env node
/**
 * Check that all i18n keys exist in all language files (de.json, en.json, mk.json)
 * Also detects:
 *  - duplicate keys inside a message file (JSON.parse silently keeps the last one)
 *  - mojibake
 *  - keys used in code (resolved against their useTranslations/getTranslations
 *    namespace) that are missing from any locale
 *  - {placeholder} mismatches between locales
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findDuplicateKeys } from './lib/json-dups.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const messagesDir = path.join(rootDir, 'messages');

const languages = ['de', 'en', 'mk'];
const messages = {};

for (const lang of languages) {
  const filePath = path.join(messagesDir, `${lang}.json`);
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    if (text.charCodeAt(0) === 0xfeff) {
      console.error(`\n❌ ${lang}.json starts with a BOM; write it as UTF-8 without BOM.`);
      process.exit(1);
    }
    const dups = findDuplicateKeys(text);
    if (dups.length > 0) {
      console.error(`\n❌ DUPLICATE KEYS in ${lang}.json (the last one silently wins and shadows the rest):`);
      dups.forEach(d => console.error(`  - ${d.path} (line ${d.line}, first defined at line ${d.firstLine})`));
      process.exit(1);
    }
    messages[lang] = JSON.parse(text);
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

// Recursively list source files (no external glob dependency)
function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// Scan code for translator calls. next-intl keys are ALWAYS relative to the
// namespace passed to useTranslations()/getTranslations(); a dotted key is not
// an absolute path. Each call is resolved against the nearest preceding
// declaration of the same variable in the same file.
function scanCodeForKeys() {
  const usedKeys = new Map(); // full key -> first file using it
  const dynamicPrefixes = new Map(); // parent path of `${...}` keys -> first file
  const files = ['app', 'components', 'lib'].flatMap((d) =>
    fs.existsSync(path.join(rootDir, d)) ? listSourceFiles(path.join(rootDir, d)) : []
  );

  const declRe = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(([^)]*)\)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(rootDir, file).split(path.sep).join('/');

    const decls = [];
    let dm;
    while ((dm = declRe.exec(content)) !== null) {
      const arg = dm[2];
      const nsMatch = arg.match(/^\s*["'`]([^"'`]+)["'`]\s*$/) || arg.match(/namespace\s*:\s*["'`]([^"'`]+)["'`]/);
      decls.push({ name: dm[1], index: dm.index, ns: nsMatch ? nsMatch[1] : '' });
    }
    // Translators passed as parameters, e.g. (t: ReturnType<typeof useTranslations>) => ...
    // The caller's namespace is unknown, so they are checked as root-level keys.
    const paramRe = /\b(\w+)\s*:\s*ReturnType<typeof\s+(?:useTranslations|getTranslations)>/g;
    while ((dm = paramRe.exec(content)) !== null) {
      decls.push({ name: dm[1], index: dm.index, ns: '' });
    }
    if (decls.length === 0) continue;

    const names = [...new Set(decls.map((d) => d.name))];
    // name(...), name.has(...), name.rich(...) with a string/template literal first argument
    const callRe = new RegExp(
      String.raw`\b(${names.join('|')})(\.has|\.rich|\.raw|\.markup)?\s*\(\s*(["'` + '`' + String.raw`])((?:(?!\3)[^\\])*)\3`,
      'g'
    );
    let cm;
    while ((cm = callRe.exec(content)) !== null) {
      const [, name, method, , key] = cm;
      if (method === '.has') continue; // guarded lookup: missing keys are handled at runtime
      const decl = decls.filter((d) => d.name === name && d.index < cm.index).pop();
      if (!decl) continue;
      const full = decl.ns ? `${decl.ns}.${key}` : key;
      if (key.includes('${')) {
        const prefix = full.slice(0, full.indexOf('${'));
        const parent = prefix.endsWith('.') ? prefix.slice(0, -1) : prefix.split('.').slice(0, -1).join('.');
        if (!dynamicPrefixes.has(parent)) dynamicPrefixes.set(parent, rel);
      } else if (!usedKeys.has(full)) {
        usedKeys.set(full, rel);
      }
    }
  }

  return { usedKeys, dynamicPrefixes };
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

const isObject = (v) => typeof v === 'object' && v !== null;
const resolvePath = (obj, keyPath) =>
  keyPath.split('.').reduce((o, k) => (isObject(o) ? o[k] : undefined), obj);

// Check that {placeholders} match across locales
const placeholders = (str) =>
  typeof str === 'string' ? [...str.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',') : '';
const placeholderIssues = [];
for (const key of allKeys) {
  const sets = languages.map(l => placeholders(resolvePath(messages[l], key)));
  if (new Set(sets).size > 1) {
    placeholderIssues.push(`${key}: ${languages.map((l, i) => `${l}={${sets[i]}}`).join(' ')}`);
  }
}
if (placeholderIssues.length > 0) {
  console.error('\n❌ PLACEHOLDER MISMATCH BETWEEN LOCALES:\n');
  placeholderIssues.forEach(i => console.error(`  - ${i}`));
  process.exit(1);
}

// Check for keys used in code but missing from message files
console.log('\n📝 Scanning code for translation keys...');
const { usedKeys, dynamicPrefixes } = scanCodeForKeys();
console.log(`   Found ${usedKeys.size} unique keys used in code (+ ${dynamicPrefixes.size} dynamic key prefixes)`);

let codeHasIssues = false;
const missingInMessages = {};

for (const lang of languages) {
  missingInMessages[lang] = [];

  for (const [usedKey, file] of usedKeys) {
    // The key must resolve to a string; an object or nothing renders the raw key
    if (typeof resolvePath(messages[lang], usedKey) !== 'string') {
      missingInMessages[lang].push(`${usedKey}  (${file})`);
      codeHasIssues = true;
    }
  }
  for (const [parent, file] of dynamicPrefixes) {
    if (!isObject(resolvePath(messages[lang], parent))) {
      missingInMessages[lang].push(`${parent}.<dynamic>  (${file})`);
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
console.log('✅ No duplicate keys; placeholders match across locales!');
console.log(`\n📊 Summary:`);
console.log(`   Total keys in message files: ${allKeys.size}`);
console.log(`   Keys used in code: ${usedKeys.size}`);
console.log(`   Languages: de, en, mk`);
process.exit(0);
