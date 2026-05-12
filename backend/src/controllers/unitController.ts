import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { unitService } from '../services/unitService.js';

export class UnitController {
  async getMyUnits(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const units = await unitService.getAvailableUnits(user.id, user.company_id, user.role);
      return res.status(200).json(units);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const unitController = new UnitController();
