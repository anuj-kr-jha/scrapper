import { Router } from 'express';
import { c } from './controller/index.mjs';

const router = Router();

//base: other
router.get('/ping', c.ping, c.send);
router.get('/recent', c.recent, c.json);
router.get('/recent_old', c.recent_old, c.json);

export { router as otherRoute };
