import './env.mjs';
import { scheduleJob, cancelJob } from 'node-schedule';
import { init_lowdb } from './app/util/index.mjs';
import { server } from './server/index.mjs';
import { scrapAndSave } from './app/scrap/index.mjs';

process.env.UV_THREADPOOL_SIZE = '1';

process.once('uncaughtException', async (ex) => {
    console.error(`we have uncaughtException, ${ex.message}, ${ex.stack}`);

    low._Error.splice(9, 1, { message: ex.message, method: 'main', createdAt: new Date().toISOString(), trace: ex.stack });
    await low.db.write();

    process.exit(1);
});
process.once('unhandledRejection', async (ex) => {
    console.error(`we have unhandledRejection, ${ex.message}, ${ex.stack}`);

    low._Error.splice(9, 1, { message: ex.message, method: 'main', createdAt: new Date().toISOString(), trace: ex.stack });
    await low.db.write();

    process.exit(1);
});

(async () => {
    try {
        await init_lowdb();
        await server.initialize();
        scrapAndSave();
        scheduleJob('job_scrap', '*/5 * * * *', async () => {
            if (process.env.NODE_ENV == 'dev') console.log('scrap start @', new Date().toLocaleString('en-US', { timeZone: 'IST', timeZoneName: 'short' }));
            await scrapAndSave();
            if (process.env.NODE_ENV == 'dev') console.log('scrap finished @', new Date().toLocaleString('en-US', { timeZone: 'IST', timeZoneName: 'short' }, '\n'));
        }); // run every 5 minute
    } catch (err) {
        console.info(':-(');
        console.error(`reason: ${err.message}, stack: ${err.stack}`);

        low._Error.splice(9, 1, { message: err.message, method: 'main', createdAt: new Date().toISOString(), trace: err.stack });
        await low.db.write();
    }
})();
