import { URL_CSV_FILES, loadUrlCsv, saveUrlCsv, readErrorLog, clearErrorLog } from '../../../util/lib/lowdb.mjs';

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
      const { factor, interval_pattern, interval, repeat_at } = req.body;
      const old_constant = getConstant(0);

      // NOTE: url lists live in csvs/ig.csv + csvs/myfxbook.csv now, not db.json. edit those files to change urls.
      const data = {
        factor: factor || old_constant.factor,
        interval: interval || old_constant.interval,
        repeat_at: repeat_at || old_constant.repeat_at,
        created_at: new Date().toISOString(),
      };

      db.get('CONSTANT').unshift(data).write();
      db.get('CONSTANT').splice(1).write();

      req.data = { err: false, _data: getConstant(0), info: '' };
    } catch (err) {
      console.error(`error on admin/update  reason: ${err.message}, trace: ${err.stack}`);
      req.data = { err: true, _data: null, info: err.message };

      global.logError(err.message, 'admin/update', err.stack);
    } finally {
      next();
    }
  },
  // GET current url lists from the csv files
  getUrls: async (req, res, next) => {
    try {
      req.data = {
        err: false,
        _data: { ig_urls: loadUrlCsv(URL_CSV_FILES.ig), myFxBook_urls: loadUrlCsv(URL_CSV_FILES.myfxbook) },
        info: '',
      };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      global.logError(err.message, 'admin/getUrls', err.stack);
    } finally {
      next();
    }
  },

  // update url csv files. body: { ig_urls?: [[url, symbol]...], myFxBook_urls?: [[url, symbol]...] }
  // only the source(s) present in the body are rewritten. each fully replaces its csv.
  updateUrls: async (req, res, next) => {
    try {
      const { ig_urls, myFxBook_urls } = req.body || {};
      if (!Array.isArray(ig_urls) && !Array.isArray(myFxBook_urls)) {
        throw new Error('provide ig_urls and/or myFxBook_urls as arrays of [url, symbol]');
      }
      if (Array.isArray(ig_urls)) saveUrlCsv(URL_CSV_FILES.ig, ig_urls);
      if (Array.isArray(myFxBook_urls)) saveUrlCsv(URL_CSV_FILES.myfxbook, myFxBook_urls);

      req.data = {
        err: false,
        _data: { ig_urls: loadUrlCsv(URL_CSV_FILES.ig), myFxBook_urls: loadUrlCsv(URL_CSV_FILES.myfxbook) },
        info: '',
      };
    } catch (err) {
      console.error(`error on admin/urls reason: ${err.message}, trace: ${err.stack}`);
      req.data = { err: true, _data: null, info: err.message };
      global.logError(err.message, 'admin/updateUrls', err.stack);
    } finally {
      next();
    }
  },

  health_check: async (req, res, next) => {
    return res.json(readErrorLog());
  },

  resetAll: async (req, res, next) => {
    clearErrorLog();
    db.set('RAW_IG', []).write();
    db.set('RAW_MYFXBOOK', []).write();
    db.set('FINAL', []).write();

    return res.send('ok');
  },
  resetLog: async (req, res, next) => {
    clearErrorLog();

    return res.send('ok');
  },
};
