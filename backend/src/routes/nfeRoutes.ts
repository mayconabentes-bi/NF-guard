import { Router } from 'express';
import { nfeController } from '../controllers/nfeController.js';
import { nfeWithdrawalController } from '../controllers/nfeWithdrawalController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { unitGuard } from '../middlewares/unitMiddleware.js';

const router = Router();

router.post('/upload', authenticateJWT, nfeController.uploadXML);

// Withdrawal endpoints
router.post('/consultar', authenticateJWT, unitGuard, nfeWithdrawalController.consultar);
router.post('/retirada', authenticateJWT, unitGuard, nfeWithdrawalController.retirada);
router.get('/status', authenticateJWT, unitGuard, nfeWithdrawalController.status);

export default router;
