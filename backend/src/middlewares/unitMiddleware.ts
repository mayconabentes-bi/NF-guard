import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { unitService } from '../services/unitService.js';

export const unitGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const unitId = req.headers['x-unit-id'] as string;
  const user = req.user;

  if (!unitId) {
    return res.status(400).json({ error: 'Unidade não especificada no cabeçalho x-unit-id' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const hasAccess = await unitService.validateUnitAccess(user.id, unitId, user.role);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Acesso negado para esta unidade' });
  }

  // Attach unitId to request for logging and filtering
  req.body.activeUnitId = unitId;
  
  next();
};
