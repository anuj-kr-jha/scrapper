import './env.mjs';
import nsh from 'node-schedule';
import { init_lowdb } from './app/util/index.mjs';
import { server } from './server/index.mjs';
import { resetDb, scrapAndSaveOnce } from './app/scrap/index.mjs';

const { scheduleJob, cancelJob } = nsh;
globalThis.scheduleJob = scheduleJob;
globalThis.cancelJob = cancelJob;

function exception(ex, type) {
  console.error(`we have ${type}, ${ex.message}, ${ex.stack}`);
  if (typeof global.logError === 'function') global.logError(ex.message, type, ex.stack);
  process.exit(1);
}
process.once('uncaughtException', (ex) => exception(ex, 'uncaughtException'));
process.once('unhandledRejection', (ex) => exception(ex, 'unhandledRejection'));

(async () => {
  try {
    await init_lowdb();
    resetDb();
    await server.initialize();

    // arm the daily scheduler FIRST (non-blocking), then kick an initial scrape in the background.
    setInterval(async () => {
      try {
        const options = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const { repeat_at } = globalThis.getConstant(0);
        const now = new Date().toLocaleTimeString('en-GB', options);
        if (repeat_at.includes(now)) {
          console.log(now, repeat_at);
          console.log('scrapping started at: ', now);
          await scrapAndSaveOnce();
          console.log('scrapping finished at: ', new Date().toLocaleTimeString('en-GB', options));
        }
      } catch (e) {
        console.red(`error on daily_schedular. reason: ${e.message}, stack: ${e.stack}`);
        global.logError(e.message, 'daily_schedular', e.stack);
      }
    }, 1000);

    // initial scrape on boot — do NOT await, so the scheduler above stays live.
    scrapAndSaveOnce().catch((e) => {
      console.red(`initial scrape failed. reason: ${e.message || e}`);
      global.logError(String(e && e.message ? e.message : e), 'initial_scrape', e && e.stack);
    });
  } catch (err) {
    console.info(':-(');
    console.error(`reason: ${err.message}, stack: ${err.stack}`);
    if (typeof global.logError === 'function') global.logError(err.message, 'startup', err.stack);
  }
})();
