import './env.mjs';
import nsh from 'node-schedule';
import { createWorkbook, init_lowdb } from './app/util/index.mjs';
import { server } from './server/index.mjs';
import { scrapAndSaveOnce } from './app/scrap/index.mjs';

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
    await server.initialize();
    await scrapAndSaveOnce();
    await createWorkbook();
  } catch (err) {
    console.info(':-(');
    console.error(`reason: ${err.message}, stack: ${err.stack}`);
    db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
  } finally {
    console.cyan('exiting ...');
    process.exit(0);
  }
})();
