import { Router } from 'express';
import { JobController } from '../controllers/job.controller';

const router = Router();

router.post('/', JobController.createJob);

router.post('/:id/message', JobController.addMessage);

router.get('/', JobController.getUserJobs);

router.get('/:id', JobController.getJobById);

router.get('/:id/stream', JobController.streamJobUpdates);

router.delete('/:id', JobController.deleteJob);

export default router;
