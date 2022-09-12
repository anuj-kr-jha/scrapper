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
            if (!req.data) return res.send('server error');
            if (req.data.err) return res.send('server error');
            res.send(req.data._data);
        } catch (err) {
            console.error({ name: err.name, msg: err.message, err });
            res.send('server error');
        }
    },
    json: (req, res, next) => {
        try {
            if (!req.data) return res.send('server error');
            if (req.data.err) return res.send('server error');
            res.json(req.data._data);
        } catch (err) {
            console.error({ name: err.name, msg: err.message, err });
            res.send('server error');
        }
    },
    //
    recent: async (req, res, next) => {
        try {
            if (db.get('FINAL').value().length == 0) {
                await scrapAndSave();
                const { FX } = db.get('FINAL').value()[0];
                return (req.data = { err: false, _data: { FX: FX }, info: '' });
            }
            const { FX } = db.get('FINAL').value()[0];
            req.data = { err: false, _data: { FX: FX }, info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };
            db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
        } finally {
            return next();
        }
    },
    recent_old: async (req, res, next) => {
        try {
            if (db.get('FINAL').value().length == 0) {
                await scrapAndSave();
                const { FX } = JSON.parse(JSON.stringify(db.get('FINAL').value()[0]));
                for (let item of FX) {
                    delete item.long;
                    delete item.short;
                }
                return (req.data = { err: false, _data: { FX: FX }, info: '' });
            }
            const { FX } = JSON.parse(JSON.stringify(db.get('FINAL').value()[0]));
            for (let item of FX) {
                delete item.long;
                delete item.short;
            }
            req.data = { err: false, _data: { FX: FX }, info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };
            db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
        } finally {
            return next();
        }
    },
    scrap_now: async (req, res, next) => {
        try {
            await scrapAndSave();
            const { FX } = db.get('FINAL').value()[0];
            req.data = { err: false, _data: { FX: FX }, info: '' };
        } catch (err) {
            req.data = { err: true, _data: null, info: err.message };
            db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
        } finally {
            return next();
        }
    },
};
