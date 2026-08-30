import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

router.post('/upload', upload.single('file'), (req, res) => documentController.uploadDocument(req, res));
router.post('/load-sample', (req, res) => documentController.loadSampleDocuments(req, res));
router.post('/:id/reindex', (req, res) => documentController.reindexDocument(req, res));
router.get('/', (req, res) => documentController.listDocuments(req, res));
router.get('/:id', (req, res) => documentController.getDocumentById(req, res));
router.delete('/:id', (req, res) => documentController.deleteDocument(req, res));

export default router;
