import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', (req, res) => chatController.sendMessage(req, res));
router.post('/regenerate', (req, res) => chatController.regenerateResponse(req, res));
router.get('/conversations', (req, res) => chatController.getConversations(req, res));
router.get('/conversations/:id', (req, res) => chatController.getConversationById(req, res));
router.patch('/conversations/:id', (req, res) => chatController.updateConversation(req, res));
router.delete('/conversations/:id', (req, res) => chatController.deleteConversation(req, res));
router.post('/conversations/:id/clear', (req, res) => chatController.clearConversation(req, res));

export default router;
