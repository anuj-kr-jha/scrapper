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
      db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
    } finally {
      return next();
    }
  },
  recent: async (req, res, next) => {
    try {
      const result = calculate();
      req.data = { err: false, _data: { FX: result }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
    } finally {
      return next();
    }
  },
  ig: async (req, res, next) => {
    try {
      const IG = db.get('RAW_IG').map((x) => ({
        currency: x.currency,
        percent: x.percent,
        longShort: x.longShort,
        status: x.status,
        createdAt: x.createdAt,
      }));
      req.data = { err: false, _data: { IG }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
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
      db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
    } finally {
      return next();
    }
  },
  dailyfx: async (req, res, next) => {
    try {
      const DAILYFX = db.get('RAW_DAILYFX').map((x) => ({
        currency: x.currency,
        trading_bias: x.trading_bias,
        net_long_percent: x.net_long_percent,
        net_short_percent: x.net_short_percent,
        change_in_longs: x.change_in_longs,
        change_in_shorts: x.change_in_shorts,
        change_in_oi: x.change_in_oi,
        createdAt: x.createdAt,
      }));
      req.data = { err: false, _data: { DAILYFX }, info: '' };
    } catch (err) {
      req.data = { err: true, _data: null, info: err.message };
      db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
    } finally {
      return next();
    }
  },
};
