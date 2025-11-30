import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

router.get('/key/:provider', UserController.getKeyStatus);

router.post('/key/:provider', UserController.saveKey);

router.delete('/key/:provider', UserController.deleteKey);

export default router;
