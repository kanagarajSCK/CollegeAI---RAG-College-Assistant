import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));
router.patch('/profile', authMiddleware, (req, res) => authController.updateProfile(req, res));
router.post('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));
router.delete('/account', authMiddleware, (req, res) => authController.deleteAccount(req, res));

export default router;
