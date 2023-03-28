import express from 'express';
import { c } from './controller/index.mjs';

const { Router } = express;
const router = Router();

//base: other
router.get('/ping', c.ping, c.send);
router.get('/recent_old', c.recent_old, c.json);
router.get('/recent/calculated', c.calculated, c.json);
router.get('/recent/ig', c.ig, c.json);
router.get('/recent/myfxbook', c.myfxbook, c.json);
router.get('/recent/dailyfx', c.dailyfx, c.json);

export { router as otherRoute };
