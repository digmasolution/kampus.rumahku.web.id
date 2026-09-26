import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.get('/me', authController.me.bind(authController));
router.get('/users', authController.usersList.bind(authController));

export default router;
