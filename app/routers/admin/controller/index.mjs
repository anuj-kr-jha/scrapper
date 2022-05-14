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
    update: async (req, res, next) => {
        try {
            const { factor, ig_urls, myFxBook_urls, dailyFx_url } = req.body;
            const old_constant = low.Constant[0];
            const data = {
                factor: factor || old_constant.factor,
                ig_urls: ig_urls.length > 0 ? ig_urls : old_constant.ig_urls,
                myFxBook_urls: myFxBook_urls.length > 0 ? myFxBook_urls : old_constant.myFxBook_urls,
                dailyFx_url: dailyFx_url || old_constant.dailyFx_url,
                created_at: new Date().toISOString(),
            };
            low.Constant.unshift(data);
            low.Constant.splice(1);
            await low.db.write();
            req.data = { err: false, _data: low.Constant[0], info: '' };
        } catch (err) {
            console.error(`error on admin/update  reason: ${err.message}, trace: ${err.stack}`);
            req.data = { err: true, _data: null, info: err.message };

            low._Error.splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack });
            await low.db.write();
        } finally {
            next();
            await scrapAndSave();
        }
    },
    health_check: async (req, res, next) => {
        const errors = low._Error;

        return res.json(errors);
    },

    reset: async (req, res, next) => {
        low._Error.length = 0;
        low.Final.length = 0;
        low.Dailyfx.length = 0;
        low.Myfxbook.length = 0;
        low.Ig.length = 0;

        await low.db.write();

        return res.send('ok');
    },
};
