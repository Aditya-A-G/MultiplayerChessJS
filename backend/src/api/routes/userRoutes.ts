import passport from 'passport';
import express from 'express';
import * as authController from '../controllers/authController';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/api/v1/',
    failureRedirect: '/login',
  })
);
router.post('/logout', authController.logOut);

export default router;
