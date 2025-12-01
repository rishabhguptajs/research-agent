import { Router } from 'express';
import { DocumentsController } from '../controllers/documents.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth());

router.get('/', DocumentsController.getUserDocuments);

router.get('/:id', DocumentsController.getDocumentById);

router.get('/:id/chunks', DocumentsController.getDocumentChunks);

router.delete('/:id', DocumentsController.deleteDocument);

router.post('/:id/attach/:jobId', DocumentsController.attachDocumentToJob);

router.delete('/:id/detach/:jobId', DocumentsController.detachDocumentFromJob);

router.get('/job/:jobId', DocumentsController.getJobAttachedDocuments);

export const documentsRoutes = router;
