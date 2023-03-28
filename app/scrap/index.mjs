import { scrapIG } from './lib/ig.mjs';
import { scrapDailyFxTable } from './lib/dailyFx.mjs';
import { scrapMyFx } from './lib/myfxbook.mjs';
import { createWorkbook } from '../../app/util/index.mjs';

function resetDb() {
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
  db.get('RAW_DAILYFX')
    .value()
    .forEach((doc) => {
      if (doc && doc.net_long_percent) doc.net_long_percent = 0;
      if (doc && doc.net_short_percent) doc.net_short_percent = 0;
      if (doc && doc.change_in_longs)
        doc.change_in_longs = {
          Daily: 0,
          Weekly: 0,
        };
      if (doc && doc.change_in_shorts)
        doc.change_in_shorts = {
          Daily: 0,
          Weekly: 0,
        };
      if (doc && doc.change_in_oi)
        doc.change_in_oi = {
          Daily: 0,
          Weekly: 0,
        };
      if (doc && doc.createdAt) doc.createdAt = new Date();
    });
  db.get('RAW_DAILYFX').write();
}

export async function scrapAndSaveOnce() {
  return new Promise((res, rej) => {
    try {
      let { factor, ig_urls, myFxBook_urls, dailyFx_url, ig_counter, myFxBook_counter, interval } = globalThis.getConstant(0);

      if (!factor) throw new Error('Factor is not defined');
      if (!ig_urls) throw new Error('IG_URLs is not defined');
      if (!myFxBook_urls) throw new Error('MYFXBOOK_URLs is not defined');
      if (!dailyFx_url) throw new Error('DAILYFX_URL is not defined');

      resetDb();

      ig_counter = 0;
      myFxBook_counter = 0;
      const ig_counter_max = ig_urls.length - 1; // 64-1
      const myFxBook_counter_max = myFxBook_urls.length - 1; // 36-1

      const scrap = async () => {
        try {
          const promises = [];
          if (ig_counter <= ig_counter_max) promises.push(scrapIG(ig_urls[ig_counter][0], ig_urls[ig_counter][1]));
          else promises.push(Promise.resolve(null));
          if (myFxBook_counter <= myFxBook_counter_max) promises.push(scrapMyFx(myFxBook_urls[myFxBook_counter][0], myFxBook_urls[myFxBook_counter][1]));
          else promises.push(Promise.resolve(null));
          promises.push(scrapDailyFxTable(dailyFx_url));

          const [ig, myfxbook, dailyfxObj] = await Promise.all(promises);
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
          if (dailyfxObj) {
            const dailyfx = Object.values(dailyfxObj).map((x) => ({ ...x, createdAt: new Date().toISOString() }));

            // console.log('dailyfx', dailyfx);
            db.get('RAW_DAILYFX').value().length = 0;
            db.get('RAW_DAILYFX')
              .value()
              .push(...dailyfx);
            db.get('RAW_DAILYFX').write();
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
            res();
          } else setTimeout(scrap, interval * 1000 * 60);
        } catch (e) {
          console.red(`error on scrap`, e?.message);
          rej(e?.message);
        }
      };
      setTimeout(scrap, interval * 1000 * 60);
    } catch (err) {
      console.red('Error in scrapAndSaveOnce ', err.message, err.stack);

      if (db.get('ERROR').value().length > 10) {
        db.get('ERROR')
          .splice(0, db.get('ERROR').value().length - 10)
          .write();
      }
      db.get('ERROR').push({ message: err.message, method: 'calculateFinal', createdAt: new Date().toLocaleString(), trace: err.stack }).write();
    }
  });
}

export function calculate() {
  const ig_keys = getConstant(0)['ig_urls'].map((x) => x[1]);
  const myFxBook_keys = getConstant(0)['myFxBook_urls'].map((x) => x[1]);
  const factor = getConstant(0)['factor'] || 0.3;
  /** @type {string[]} keys */
  const keys = Array.from(new Set([...ig_keys, ...myFxBook_keys]));
  // console.log(keys, keys.length);

  /** @type {Array<Record<'currency'|'long' | 'short'| 'ssi_signal' | 'oi_signal', any>>} final */
  const final = [];
  for (const key of keys) {
    const res = { currency: key, long: '0', short: '0', ssi_signal: 'NA', oi_signal: 'NA' };

    // actual scrapped data
    /** @type {undefined | {currency: string, percent: number, longShort: string, status: 0 | 1}} */
    let raw_ig = db
      .get('RAW_IG')
      .value()
      .find((c) => c && c.currency === key);
    /** @type {undefined | {currency: string, shortPercent: number, status: 0 | 1}} */
    let raw_myfxbook = db
      .get('RAW_MYFXBOOK')
      .value()
      .find((c) => c && c.currency === key);
    /** @type {undefined | {currency: string, trading_bias: string, net_long_percent: number, net_short_percent: number, change_in_longs: { Daily: number, Weekly: number }, change_in_shorts: { Daily: number, Weekly: number }, change_in_oi: { Daily: number, Weekly: number }}} */
    let raw_dailyfx = db
      .get('RAW_DAILYFX')
      .value()
      .find((c) => c && c.currency === key);
    //

    // ############ scrapped data transformation ############
    // --------------------- MYFXBOOK -----------------------
    const final_myfxbook = { currency: key, percent: '0.00', long: '0.00', short: '0.00', ssi_signal: '' };
    {
      let long = 0;
      let short = 0;
      if (raw_myfxbook) {
        if (typeof raw_myfxbook.shortPercent === 'number' && raw_myfxbook.status) {
          short = raw_myfxbook.shortPercent;
          long = 1 - short;
          //
          final_myfxbook.percent = raw_myfxbook.shortPercent.toFixed(2);
        }
      }
      const signal = Math.abs(long - short) > factor ? (long > short ? 'BEARISH' : 'BULLISH') : 'FLAT';
      //
      final_myfxbook.long = long.toFixed(2);
      final_myfxbook.short = short.toFixed(2);
      final_myfxbook.ssi_signal = signal;
    }
    // ------------------------------------------------------

    // ------------------------ IG --------------------------
    const final_ig = { currency: key, percent: '0.00', longShort: 'NA', long: '0.00', short: '0.00', signal: '', ssi_signal: '' };
    {
      let long = 0;
      let short = 0;
      if (raw_ig) {
        // here no need to check status bcz for fail case longShort -> 'NA'
        if (raw_ig.longShort === 'long') {
          long = raw_ig.percent;
          short = 1 - long;
        } else if (raw_ig.longShort === 'short') {
          short = raw_ig.percent;
          long = 1 - short;
          //
          final_ig.percent = raw_ig.percent.toFixed(2);
          final_ig.longShort = raw_ig.longShort;
        }
      }
      const signal = Math.abs(long - short) > factor ? (long > short ? 'BEARISH' : 'BULLISH') : 'FLAT';
      /** @type { "BEARISH" | "BULLISH" | "FLAT"} */
      let ssi_signal = 'FLAT';
      if (signal !== 'FLAT') ssi_signal = signal;
      else if (final_myfxbook.ssi_signal !== 'FLAT') ssi_signal = final_myfxbook.ssi_signal;
      //
      final_ig.long = long.toFixed(2);
      final_ig.short = short.toFixed(2);
      final_ig.signal = signal;
      final_ig.ssi_signal = ssi_signal;
    }
    // ------------------------------------------------------

    // ---------------------- DAILYFX -----------------------
    const final_dailyfx = {
      currency: key,
      oi_signal: raw_dailyfx ? raw_dailyfx.trading_bias : 'NA',
      net_long_percent: raw_dailyfx ? raw_dailyfx.net_long_percent : 0,
      net_short_percent: raw_dailyfx ? raw_dailyfx.net_short_percent : 0,
      change_in_longs: raw_dailyfx ? raw_dailyfx.change_in_longs : { Daily: 0, Weekly: 0 },
      change_in_shorts: raw_dailyfx ? raw_dailyfx.change_in_shorts : { Daily: 0, Weekly: 0 },
      change_in_oi: raw_dailyfx ? raw_dailyfx.change_in_oi : { Daily: 0, Weekly: 0 },
    };
    // ------------------------------------------------------

    // ######################################################

    // ############# FINAL RESPONSE GENERATION  #############
    // --------------- OI SIGNAL FROM DAILYFX ---------------
    let oi_signal = 'NA';
    if (raw_dailyfx) oi_signal = final_dailyfx.oi_signal;
    //
    res.long = final_ig.long;
    res.short = final_ig.short;
    res.ssi_signal = final_ig.ssi_signal;
    res.oi_signal = oi_signal;

    // console.log(raw_ig.status); // 0 : not found(contains default val), 1: found(contains exact val)

    // when currency not found in ig (meaning it will have default value) so, fetch from myfxbook
    if (!raw_ig || !raw_ig.status) {
      res.long = final_myfxbook.long;
      res.short = final_myfxbook.short;
      res.ssi_signal = final_myfxbook.ssi_signal;
      res.oi_signal = oi_signal;
    }

    // ------------------------------------------------------
    // ------------------------------------------------------
    // ------------------------------------------------------
    // ######################################################

    final.push(res);
  }

  // console.log(final);
  return final;
}
