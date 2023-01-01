import pkg from 'express';
import rateLimit from 'express-rate-limit';
import { c } from './controller/index.mjs';

const { Router } = pkg;

const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 60e3, // 60 * 1000 ms
  max: 10,
  message: 'You have exceeded allowed request/minute. limit: 10 req/minute!',
  headers: true,
});

const router = Router();

//base: admin
router.get('/ping', c.ping, c.send);
// router.post('/update', c.update, c.json);
router.post('/update', rateLimiterUsingThirdParty, c.update, c.json);
router.post('/reset/log', c.resetLog);
router.post('/reset/all', c.resetAll);
router.get('/error_logs', c.health_check);

export { router as adminRoute };
