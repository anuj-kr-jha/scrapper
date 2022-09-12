import './env.mjs';
import nsh from 'node-schedule';
import { init_lowdb } from './app/util/index.mjs';
import { server } from './server/index.mjs';
import { scrapAndSave } from './app/scrap/index.mjs';

const { scheduleJob, cancelJob } = nsh;

process.env.UV_THREADPOOL_SIZE = '1';

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
        scrapAndSave();
        scheduleJob('job_scrap', '*/2 * * * *', async () => {
            if (process.env.NODE_ENV == 'dev') console.log('scrap start @', new Date().toLocaleString('en-US', { timeZoneName: 'short' }));
            await scrapAndSave();
            if (process.env.NODE_ENV == 'dev') console.log('scrap finished @', new Date().toLocaleString('en-US', { timeZoneName: 'short' }, '\n'));
        }); // run every 5 minute
    } catch (err) {
        console.info(':-(');
        console.error(`reason: ${err.message}, stack: ${err.stack}`);
        db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
    }
})();
