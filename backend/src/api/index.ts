import express from 'express';
import user from './routes/userRoutes';
import MessageResponse from '../interfaces/MessageResponse';
import { isAuthenticated } from './middlewares/authMiddleware';

const router = express.Router();

router.get<{}, MessageResponse>('/test', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.get<{}, MessageResponse>('/', isAuthenticated, (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/users', user);

export default router;
