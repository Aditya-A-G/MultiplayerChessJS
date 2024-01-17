import express from 'express';
import * as authController from '../controllers/authController';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/logout', authController.logOut);
router.get(
  '/authenticated-status',
  isAuthenticated,
  authController.getAuthenticatedStatus
);

export default router;
