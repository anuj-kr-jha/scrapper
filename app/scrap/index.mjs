import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { scrapIG } from './lib/ig.mjs';
import { fetchMyFxOutlook } from './lib/myfxbook.mjs';
import { writeExcel } from '../util/lib/excel.mjs';

const POSTBACK_URL = process.env.POSTBACK_URL || 'http://95.111.231.83/api/forex_ssi/myfxbook';
const POSTBACK_RETRIES = 2; // total attempts = retries + 1
const HISTORY_DIR = path.join(process.cwd(), 'history');

// local (env.TZ) timestamp as yyyy-mm-ddThh-mm-ss  (process.env.TZ makes Date getters local)
// NOTE: time parts use '-' not ':' — Windows filenames cannot contain ':'.
function localStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

// save the postback payload to history/<local-timestamp>.{json,xlsx}. non-fatal.
async function saveHistory(body) {
  try {
    if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
    const stamp = localStamp();
    const jsonFile = path.join(HISTORY_DIR, `${stamp}.json`);
    const xlsxFile = path.join(HISTORY_DIR, `${stamp}.xlsx`);
    fs.writeFileSync(jsonFile, JSON.stringify(body, null, 2));
    await writeExcel(body.MYFXBOOK, xlsxFile);
    console.green('📁 history saved', jsonFile, '+', xlsxFile);
  } catch (err) {
    console.red('❌ ', `saveHistory failed: ${err.message}`);
    global.logError(`saveHistory failed: ${err.message}`, 'saveHistory', err.stack);
  }
}

// POST the computed signals (same body as GET /other/recent) to the external endpoint.
// runs after every completed session. non-fatal: logs on failure, never throws.
async function postSessionResult() {
  const body = { MYFXBOOK: calculate() };
  db.set('FINAL', body.MYFXBOOK).write(); // store computed result (exactly what we POST)
  await saveHistory(body); // persist the exact payload (json + xlsx) BEFORE posting
  for (let attempt = 0; attempt <= POSTBACK_RETRIES; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 3000 * attempt));
      await axios.post(POSTBACK_URL, body, { timeout: 30e3, headers: { 'Content-Type': 'application/json' } });
      console.green('✅ session result posted to', POSTBACK_URL);
      return;
    } catch (err) {
      if (attempt < POSTBACK_RETRIES) continue;
      const reason = `postSessionResult failed :(, reason: ${err.message}, url: ${POSTBACK_URL}`;
      console.red('❌ ', reason);
      global.logError(reason, 'postSessionResult', err.stack);
    }
  }
}

export function resetDb() {
  db.get('RAW_IG')
    .value()
    .forEach((doc) => {
      if (doc && doc.percent) doc.percent = 0;
      if (doc && doc.longShort) doc.longShort = 'NA';
      if (doc && doc.status) doc.status = 0;
      if (doc && doc.createdAt) doc.createdAt = new Date();
    });
  db.get('RAW_IG').write();
  //
  db.get('RAW_MYFXBOOK')
    .value()
    .forEach((doc) => {
      if (doc && doc.shortPercent) doc.shortPercent = 0;
      if (doc && doc.status) doc.status = 0;
      if (doc && doc.createdAt) doc.createdAt = new Date();
    });
  db.get('RAW_MYFXBOOK').write();
  //
  db.set('FINAL', []).write(); // clear computed result
}

// guard: only one scrape session at a time (boot scrape + scheduler must not overlap)
let sessionRunning = false;

export async function scrapAndSaveOnce() {
  if (sessionRunning) {
    console.yellow('scrape session already running, skipping');
    return;
  }
  sessionRunning = true;

  return new Promise((res, rej) => {
    const done = (fn, arg) => {
      sessionRunning = false;
      fn(arg);
    };
    try {
      let { factor, ig_urls, myFxBook_urls, ig_counter, myFxBook_counter, interval } = globalThis.getConstant(0);

      if (!factor) throw new Error('Factor is not defined');
      if (!ig_urls) throw new Error('IG_URLs is not defined');
      if (!myFxBook_urls) throw new Error('MYFXBOOK_URLs is not defined');

      // resetDb();

      ig_counter = 0;
      myFxBook_counter = 0;
      const ig_counter_max = ig_urls.length - 1; // 64-1
      const myFxBook_counter_max = myFxBook_urls.length - 1; // 36-1

      // myfxbook: whole community outlook fetched ONCE per session (step 0), then read per-step from this map
      let myfxMap = null;

      const scrap = async () => {
        try {
          if (myFxBook_counter === 0 && myfxMap === null) myfxMap = await fetchMyFxOutlook(true);

          const ig = ig_counter <= ig_counter_max ? await scrapIG(ig_urls[ig_counter][0], ig_urls[ig_counter][1]) : null;

          let myfxbook = null;
          if (myFxBook_counter <= myFxBook_counter_max) {
            const name = String(myFxBook_urls[myFxBook_counter][1]).toUpperCase();
            myfxbook = myfxMap && myfxMap[name] ? { ...myfxMap[name] } : { currency: name, shortPercent: 0, status: 0 };
          }

          if (ig) {
            // console.log('ig', ig);
            db.get('RAW_IG').value()[ig_counter] = { ...ig, createdAt: new Date().toISOString() };
            db.get('RAW_IG').write();
          }

          if (myfxbook) {
            // console.log('myfxbook', myfxbook);
            db.get('RAW_MYFXBOOK').value()[myFxBook_counter] = { ...myfxbook, createdAt: new Date().toISOString() };
            db.get('RAW_MYFXBOOK').write();
          }

          //
          db.get('CONSTANT').value()[0]['ig_counter'] = ig_counter;
          db.get('CONSTANT').value()[0]['myFxBook_counter'] = myFxBook_counter;
          db.get('CONSTANT').write();

          // const ig_url = ig_urls[ig_counter][0];
          // const myFxBook_url = ig_urls[ig_counter][0];

          //
          if (ig_counter <= ig_counter_max) console.green('✅', new Date().toLocaleString(), ig, `ig [${ig_counter}/${ig_counter_max}]`);
          if (myFxBook_counter <= myFxBook_counter_max) console.green('✅', new Date().toLocaleString(), myfxbook, `myFxBook [${myFxBook_counter}/${myFxBook_counter_max}]`);

          //
          ig_counter++;
          myFxBook_counter++;

          //
          if (ig_counter > ig_counter_max && myFxBook_counter > myFxBook_counter_max) {
            console.green(`All done :)`);
            await postSessionResult(); // push computed signals to external api
            done(res);
          } else {
            // read interval fresh each step so /admin/update changes take effect immediately (no restart)
            const liveInterval = Number(globalThis.getConstant(0).interval) || interval;
            setTimeout(scrap, liveInterval * 1000); // interval = seconds
          }
        } catch (e) {
          console.red(`error on scrap`, e.message);
          global.logError(e.message, 'scrap', e.stack);
          done(rej, e.message);
        }
      };
      scrap(); // first step immediately; subsequent steps spaced by `interval`
    } catch (err) {
      console.red('Error in scrapAndSaveOnce ', err.message, err.stack);
      global.logError(err.message, 'scrapAndSaveOnce', err.stack);
      done(rej, err.message);
    }
  });
}

export function calculate() {
  const ig_keys = getConstant(0)['ig_urls'].map((x) => x[1]);
  const myFxBook_keys = getConstant(0)['myFxBook_urls'].map((x) => x[1]);
  /** @type {string[]} all currencies, MyFXBook order first then IG-only */
  const keys = Array.from(new Set([...myFxBook_keys, ...ig_keys]));

  const round2 = (n) => Number(Number(n).toFixed(2));

  /** @type {Array<{currency: string, shortPercent: number, status: 0|1, createdAt: string}>} */
  const final = [];
  for (const key of keys) {
    /** @type {undefined | {currency: string, percent: number, longShort: string, status: 0|1, createdAt: string}} */
    const raw_ig = db
      .get('RAW_IG')
      .value()
      .find((c) => c && c.currency === key);
    /** @type {undefined | {currency: string, shortPercent: number, status: 0|1, createdAt: string}} */
    const raw_myfxbook = db
      .get('RAW_MYFXBOOK')
      .value()
      .find((c) => c && c.currency === key);

    // IG short ratio (derive from longShort + percent)
    let igShort = 0;
    if (raw_ig && raw_ig.status) {
      if (raw_ig.longShort === 'short') igShort = raw_ig.percent;
      else if (raw_ig.longShort === 'long') igShort = 1 - raw_ig.percent;
    }

    // source priority: IG (if scraped ok) -> MyFXBook -> default 0
    let shortPercent = 0;
    let status = 0;
    let createdAt = (raw_ig && raw_ig.createdAt) || (raw_myfxbook && raw_myfxbook.createdAt) || new Date().toISOString();

    if (raw_ig && raw_ig.status) {
      shortPercent = igShort;
      status = 1;
      createdAt = raw_ig.createdAt;
    } else if (raw_myfxbook && raw_myfxbook.status) {
      shortPercent = raw_myfxbook.shortPercent;
      status = 1;
      createdAt = raw_myfxbook.createdAt;
    }

    final.push({ currency: key, shortPercent: round2(shortPercent), status, createdAt });
  }

  return final;
}
