/**
 * Minimal JSON scanner that reports duplicate object keys.
 * JSON.parse silently keeps the LAST duplicate, which drops whole sections
 * of a message file without any error, so it has to be caught before parsing.
 */
export function findDuplicateKeys(text) {
  let i = 0;
  let line = 1;
  const dups = [];
  const BACKSLASH = String.fromCharCode(92);

  const skipWs = () => {
    while (i < text.length && /\s/.test(text[i])) {
      if (text[i] === '\n') line++;
      i++;
    }
  };

  const readString = () => {
    let s = '';
    i++; // opening quote
    while (text[i] !== '"') {
      if (text[i] === BACKSLASH) {
        s += text[i] + text[i + 1];
        i += 2;
      } else {
        s += text[i++];
      }
    }
    i++; // closing quote
    return s;
  };

  const readValue = (path) => {
    skipWs();
    const c = text[i];
    if (c === '{') {
      i++;
      const seen = new Map();
      skipWs();
      if (text[i] === '}') {
        i++;
        return;
      }
      for (;;) {
        skipWs();
        const keyLine = line;
        const key = readString();
        skipWs();
        i++; // colon
        const keyPath = path ? `${path}.${key}` : key;
        if (seen.has(key)) {
          dups.push({ path: keyPath, line: keyLine, firstLine: seen.get(key) });
        } else {
          seen.set(key, keyLine);
        }
        readValue(keyPath);
        skipWs();
        if (text[i] === ',') {
          i++;
          continue;
        }
        i++; // closing brace
        return;
      }
    } else if (c === '[') {
      i++;
      skipWs();
      if (text[i] === ']') {
        i++;
        return;
      }
      for (;;) {
        readValue(`${path}[]`);
        skipWs();
        if (text[i] === ',') {
          i++;
          continue;
        }
        i++; // closing bracket
        return;
      }
    } else if (c === '"') {
      readString();
    } else {
      while (i < text.length && !/[,}\]\s]/.test(text[i])) i++;
    }
  };

  readValue('');
  return dups;
}
