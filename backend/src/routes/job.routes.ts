import { Router } from 'express';
import { JobController } from '../controllers/job.controller';

const router = Router();

// POST /job - Create a new research job
router.post('/', JobController.createJob);

// GET /job/:id/thread - Get the full conversation thread for a job
router.get('/:id/thread', JobController.getJobThread);

// GET /jobs - Get all jobs for the authenticated user
router.get('/', JobController.getUserJobs);

// GET /job/:id - Get a specific job by ID
router.get('/:id', JobController.getJobById);

// GET /job/:id/stream - Stream job updates via SSE
router.get('/:id/stream', JobController.streamJobUpdates);

export default router;
