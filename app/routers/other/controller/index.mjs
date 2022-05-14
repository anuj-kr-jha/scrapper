import { scrapAndSave } from '../../../scrap/index.mjs';

export const c = {
    ping: (req, res, next) => {
        try {
            req.data = { err: false, _data: 'OK (/other/ping)', info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };
        } finally {
            return next();
        }
    },
    send: (req, res, next) => {
        try {
            if (req.data?.err) return res.send('server error');
            if (!req.data) return res.send('server error');
            res.send(req.data._data);
        } catch (err) {
            console.error({ name: err.name, msg: err.message, err });
            res.send('server error');
        }
    },
    json: (req, res, next) => {
        try {
            if (req.data?.err) return res.send('server error');
            if (!req.data) return res.send('server error');
            res.json(req.data._data);
        } catch (err) {
            console.error({ name: err.name, msg: err.message, err });
            res.send('server error');
        }
    },
    //
    recent: async (req, res, next) => {
        try {
            const { FX } = low.Final[0];
            req.data = { err: false, _data: { FX: FX }, info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };

            low._Error.splice(9, 1, { message: err.message, method: 'recent', createdAt: new Date().toISOString(), trace: err.stack });
            await low.db.write();
        } finally {
            return next();
        }
    },
    recent_old: async (req, res, next) => {
        try {
            const { FX } = JSON.parse(JSON.stringify(low.Final[0]));
            for(let item of FX ) {
                delete item.long;
                delete item.short;
            }
            req.data = { err: false, _data: { FX: FX }, info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };

            low._Error.splice(9, 1, { message: err.message, method: 'recent_old', createdAt: new Date().toISOString(), trace: err.stack });
            await low.db.write();
        } finally {
            return next();
        }
    },
    scrap_now: async (req, res, next) => {
        try {
            await scrapAndSave();
            await low.db.write();
            const { FX } = low.Final[0];
            req.data = { err: false, _data: { FX: FX }, info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };

            low._Error.splice(9, 1, { message: err.message, method: 'scrap_now', createdAt: new Date().toISOString(), trace: err.stack });
            await low.db.write();
        } finally {
            return next();
        }
    },
};
