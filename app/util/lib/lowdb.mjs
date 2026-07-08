import fs from 'fs';
import path from 'path';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

const adapter = new FileSync('./db.json');
const db = low(adapter);

const CSV_DIR = path.join(process.cwd(), 'csvs');

// errors are read straight from pm2's stderr log (see ecosystem.config.cjs error_file). no separate store.
export const ERROR_LOG_FILE = path.join(process.cwd(), 'logs', 'scrapper-error.log');
const MAX_ERRORS = 10;

// node runtime noise we don't want in the error api (warnings, deprecations, not real app errors).
const ERROR_LOG_NOISE = /\(node:\d+\)|ExperimentalWarning|DeprecationWarning|Warning:/i;

// last `limit` real error lines (newest last). noise + blanks dropped. missing file -> [].
export function readErrorLog(limit = MAX_ERRORS) {
  try {
    return fs
      .readFileSync(ERROR_LOG_FILE, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !ERROR_LOG_NOISE.test(l))
      .slice(-limit);
  } catch {
    return [];
  }
}

// truncate the error log file (no-op if missing).
export function clearErrorLog() {
  try {
    if (fs.existsSync(ERROR_LOG_FILE)) fs.writeFileSync(ERROR_LOG_FILE, '');
  } catch (e) {
    console.error('clearErrorLog failed:', e.message);
  }
}

// map of logical source name -> csv filename
export const URL_CSV_FILES = { ig: 'ig.csv', myfxbook: 'myfxbook.csv' };

// parse csvs/<name>.csv (header: symbol,url) -> [[url, symbol], ...] to match legacy [x[0]=url, x[1]=symbol] shape.
export function loadUrlCsv(name) {
  const file = path.join(CSV_DIR, name);
  const text = fs.readFileSync(file, 'utf8');
  return text
    .split(/\r?\n/)
    .slice(1) // drop header
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(','); // symbol may contain no comma; url has none
      return [l.slice(i + 1).trim(), l.slice(0, i).trim()];
    });
}

// write [[url, symbol], ...] tuples to csvs/<name>.csv with header symbol,url.
export function saveUrlCsv(name, tuples) {
  if (!Array.isArray(tuples)) throw new Error('urls must be an array of [url, symbol]');
  const rows = tuples.map((t, i) => {
    if (!Array.isArray(t) || t.length < 2) throw new Error(`urls[${i}] must be [url, symbol]`);
    const url = String(t[0]).trim();
    const symbol = String(t[1]).trim();
    if (!url || !symbol) throw new Error(`urls[${i}] has empty url or symbol`);
    if (url.includes(',') || symbol.includes(',')) throw new Error(`urls[${i}] must not contain commas`);
    return `${symbol},${url}`;
  });
  fs.mkdirSync(CSV_DIR, { recursive: true });
  fs.writeFileSync(path.join(CSV_DIR, name), `symbol,url\n${rows.join('\n')}\n`);
}

export async function init_lowdb() {
  db.defaults({ CONSTANT: [], RAW_IG: [], RAW_MYFXBOOK: [], FINAL: [], MYFX_SESSION: '' }).write();
  global.db = db;
  // url lists live in csvs/*.csv now, not db.json. merge them into the constant on read.
  global.getConstant = (idx) => {
    const c = db.get('CONSTANT').value()[idx];
    if (!c) return c;
    return { ...c, ig_urls: loadUrlCsv('ig.csv'), myFxBook_urls: loadUrlCsv('myfxbook.csv') };
  };

  // single error logger. writes to stderr -> pm2 captures it in logs/scrapper-error.log (what the error API reads).
  global.logError = (message, method = 'unknown', trace = '') => {
    console.error(`[${method}] ${message}${trace ? ` | ${trace}` : ''}`);
  };
}
