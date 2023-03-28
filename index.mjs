import './env.mjs';
import nsh from 'node-schedule';
import { init_lowdb } from './app/util/index.mjs';
import { server } from './server/index.mjs';
import { resetDb, scrapAndSaveOnce } from './app/scrap/index.mjs';

const { scheduleJob, cancelJob } = nsh;
globalThis.scheduleJob = scheduleJob;
globalThis.cancelJob = cancelJob;

async function exception(ex, type) {
  console.error(`we have ${type}, ${ex.message}, ${ex.stack}`);
  db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
  process.exit(1);
}
process.once('uncaughtException', (ex) => exception(ex, 'uncaughtException'));
process.once('unhandledRejection', (ex) => exception(ex, 'unhandledRejection'));

(async () => {
  try {
    await init_lowdb();
    resetDb();
    await server.initialize();
    await scrapAndSaveOnce(); // uncomment to scrap on restart
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
        console.red(`error on daily_schedular. reason: ${err.message}, stack: ${err.stack}`);
        db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
      }
    }, 1000);
  } catch (err) {
    console.info(':-(');
    console.error(`reason: ${err.message}, stack: ${err.stack}`);
    db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
  }
})();
