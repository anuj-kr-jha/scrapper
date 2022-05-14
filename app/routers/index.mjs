import morgan from 'morgan';
import { Router } from 'express';
import { adminRoute } from './admin/index.mjs';
import { otherRoute } from './other/index.mjs';

const router = Router();

if (process.env.NODE_ENV == 'dev') router.use(morgan('tiny'));

router.get('/', (req, res, next) => {
    res.send('welcome /\\');
});

router.use('/admin', verifyToken, adminRoute);
router.use('/other', otherRoute);

function verifyToken(req, res, next) {
    if (req.headers?.token != 'scrap_2022') return res.send('invalid token');
    next();
}

export { router };
