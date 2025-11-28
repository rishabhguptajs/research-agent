import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

// GET /user/key/:provider - Check if user has API key for provider
router.get('/key/:provider', UserController.getKeyStatus);

// POST /user/key/:provider - Save encrypted API key for provider
router.post('/key/:provider', UserController.saveKey);

// DELETE /user/key/:provider - Delete API key for provider
router.delete('/key/:provider', UserController.deleteKey);

export default router;
