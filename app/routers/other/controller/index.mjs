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
};
