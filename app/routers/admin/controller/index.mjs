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
      const { factor, ig_urls, myFxBook_urls, dailyFx_url, interval_pattern, interval_excel } = req.body;
      const old_constant = getConstant(0);
      let ig_counter = old_constant.ig_counter || 0; // -1 resume, 0 stop
      let myFxBook_counter = old_constant.myFxBook_counter || 0; // -1 resume, 0 stop

      if (typeof req.body.ig_counter === 'number') {
        if (req.body.ig_counter === -1) {
        } else ig_counter = req.body.ig_counter || 0;
      }
      if (typeof req.body.myFxBook_counter === 'number') {
        if (req.body.myFxBook_counter === -1) {
        } else myFxBook_counter = req.body.myFxBook_counter || 0;
      }

      const data = {
        factor: factor || old_constant.factor,
        ig_counter: ig_counter,
        myFxBook_counter: myFxBook_counter,
        interval_pattern: interval_pattern || old_constant.interval_pattern,
        interval_excel: interval_excel || old_constant.interval_excel,
        dailyFx_url: dailyFx_url || old_constant.dailyFx_url,
        ig_urls: ig_urls && ig_urls.length > 0 ? ig_urls : old_constant.ig_urls,
        myFxBook_urls: myFxBook_urls && myFxBook_urls.length > 0 ? myFxBook_urls : old_constant.myFxBook_urls,
        created_at: new Date().toISOString(),
      };

      db.get('CONSTANT').unshift(data).write();
      db.get('CONSTANT').splice(1).write();

      if (globalThis.cancelJob('scrap-ig-myfxbook-dailyfx')) {
        console.log('config updated');
        console.log('jobs cancelled : scrap-ig-myfxbook-dailyfx');
        await scrapAndSave();
        console.log('jobs restarted : scrap-ig-myfxbook-dailyfx');
      } else {
        throw new Error('failed to cancel and restart job "scrap-ig-myfxbook-dailyfx"');
      }

      req.data = { err: false, _data: getConstant(0), info: '' };
    } catch (err) {
      console.error(`error on admin/update  reason: ${err.message}, trace: ${err.stack}`);
      req.data = { err: true, _data: null, info: err.message };

      db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
    } finally {
      next();
      // await scrapAndSave();
    }
  },
  health_check: async (req, res, next) => {
    const errors = db.get('ERROR').value();
    return res.json(errors);
  },

  resetAll: async (req, res, next) => {
    db.set('ERROR', []).write();
    db.set('RAW_IG', []).write();
    db.set('RAW_MYFXBOOK', []).write();
    db.set('RAW_DAILYFX', []).write();

    return res.send('ok');
  },
  resetLog: async (req, res, next) => {
    db.set('ERROR', []).write();

    return res.send('ok');
  },
};
