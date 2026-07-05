import morgan from 'morgan';
import express from 'express';
import { adminRoute } from './admin/index.mjs';
import { otherRoute } from './other/index.mjs';

const { Router } = express;
const router = Router();

if (process.env.NODE_ENV == 'dev') router.use(morgan('tiny'));

router.get('/', (req, res, next) => {
  res.send('welcome /\\');
});

router.use('/admin', verifyToken, adminRoute);
router.use('/other', otherRoute);

function verifyToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN || 'scrap_2022';
  if (!req.headers || req.headers.token != token) return res.send('invalid token');
  next();
}

export { router };
