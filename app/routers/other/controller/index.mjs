import { calculate } from '../../../scrap/index.mjs';

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
  recent_old: async (req, res, next) => {
    try {
      const result = calculate().map((item) => {
        const { long, short, ...rest } = item;
        return rest;
      });
      req.data = { err: false, _data: { FX: result }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      global.logError(err.message, 'other/read', err.stack);
    } finally {
      return next();
    }
  },
  recent: async (req, res, next) => {
    try {
      const result = calculate();
      req.data = { err: false, _data: { MYFXBOOK: result }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      global.logError(err.message, 'other/read', err.stack);
    } finally {
      return next();
    }
  },
  ig: async (req, res, next) => {
    try {
      const IG = db.get('RAW_IG').map((x) => {
        const data = {};
        data.currency = x.currency;
        data.shortPercent = x.longShort == 'long' ? 1 - x.percent : x.percent;
        // data.shortPercent = x.longShort == 'long' ? (1 - x.percent).toFixed(2) : x.percent;
        data.status = x.status;
        data.createdAt = x.createdAt;

        return data;
      });
      req.data = { err: false, _data: { IG }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      global.logError(err.message, 'other/read', err.stack);
    } finally {
      return next();
    }
  },
  myfxbook: async (req, res, next) => {
    try {
      const MYFXBOOK = db.get('RAW_MYFXBOOK').map((x) => ({
        currency: x.currency,
        shortPercent: x.shortPercent,
        status: x.status,
        createdAt: x.createdAt,
      }));
      req.data = { err: false, _data: { MYFXBOOK }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      global.logError(err.message, 'other/read', err.stack);
    } finally {
      return next();
    }
  },
};
