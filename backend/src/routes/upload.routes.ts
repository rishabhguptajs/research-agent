import { Router } from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/upload';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

router.post('/', upload.single('file'), uploadDocument);

export default router;
