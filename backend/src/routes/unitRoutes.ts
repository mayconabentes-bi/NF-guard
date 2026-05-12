import { Router } from 'express';
import { unitController } from '../controllers/unitController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateJWT, unitController.getMyUnits);

export default router;
