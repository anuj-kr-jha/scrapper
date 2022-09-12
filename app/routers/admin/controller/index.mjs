import { scrapAndSave } from '../../../scrap/index.mjs';

export const c = {
    ping: (req, res, next) => {
        try {
            req.data = { err: false, _data: 'OK (/admin/ping)', info: '' };
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
    update: async (req, res, next) => {
        try {
            const { factor, ig_urls, myFxBook_urls, dailyFx_url } = req.body;
            const old_constant = getConstant(0);
            const data = {
                factor: factor || old_constant.factor,
                ig_urls: ig_urls && ig_urls.length > 0 ? ig_urls : old_constant.ig_urls,
                myFxBook_urls: myFxBook_urls && myFxBook_urls.length > 0 ? myFxBook_urls : old_constant.myFxBook_urls,
                dailyFx_url: dailyFx_url || old_constant.dailyFx_url,
                created_at: new Date().toISOString(),
            };

            db.get('CONSTANT').unshift(data).write();
            db.get('CONSTANT').splice(1).write();

            req.data = { err: false, _data: getConstant(0), info: '' };
        } catch (err) {
            console.error(`error on admin/update  reason: ${err.message}, trace: ${err.stack}`);
            req.data = { err: true, _data: null, info: err.message };

            db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
        } finally {
            next();
            await scrapAndSave();
        }
    },
    health_check: async (req, res, next) => {
        const errors = db.get('ERROR').value();
        return res.json(errors);
    },

    resetAll: async (req, res, next) => {
        db.set('ERROR', []).write();
        db.set('MYFXBOOK', []).write();
        db.set('IG', []).write();
        db.set('DAILYFX', []).write();
        db.set('FINAL', []).write();

        return res.send('ok');
    },
    resetLog: async (req, res, next) => {
        db.set('ERROR', []).write();

        return res.send('ok');
    },
};
