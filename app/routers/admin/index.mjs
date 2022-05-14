import { Router } from 'express';
import { c } from './controller/index.mjs';

import rateLimit from 'express-rate-limit';
const rateLimiterUsingThirdParty = rateLimit({
    windowMs: 60e3, // 60 * 1000 ms
    max: 1,
    message: 'You have exceeded allowed request/minute. limit: 1 req/minute!',
    headers: true,
});

const router = Router();

//base: admin
router.get('/ping', c.ping, c.send);
router.post('/update', rateLimiterUsingThirdParty, c.update, c.json);
router.post('/reset', c.reset);
router.get('/error_logs', c.health_check);

export { router as adminRoute };
