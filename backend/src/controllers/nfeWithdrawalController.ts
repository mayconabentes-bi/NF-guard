import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { nfeWithdrawalService } from '../services/nfeWithdrawalService.js';

export class NFeWithdrawalController {
  async consultar(req: AuthRequest, res: Response) {
    try {
      const { chaveNfe } = req.body;
      const nf = await nfeWithdrawalService.consultNF(chaveNfe);
      return res.status(200).json(nf);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async retirada(req: AuthRequest, res: Response) {
    try {
      const { chaveNfe, itemId, quantidade } = req.body;
      const unidadId = req.headers['x-unit-id'] as string;
      const operadorId = req.user?.id;
      const companyId = req.user?.company_id;
      const auditInfo = {
        ip: req.ip || '',
        ua: req.get('user-agent') || ''
      };

      if (!operadorId || !unidadId || !companyId) {
        return res.status(401).json({ error: 'Operador, Unidade ou Empresa não identificados' });
      }

      const result = await nfeWithdrawalService.executeWithdrawal(
        chaveNfe, 
        itemId, 
        quantidade, 
        unidadId, 
        operadorId,
        companyId,
        auditInfo
      );
      
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async status(req: AuthRequest, res: Response) {
    try {
      const { chaveNfe } = req.query as { chaveNfe: string };
      const status = await nfeWithdrawalService.getNFStatus(chaveNfe);
      return res.status(200).json(status);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export const nfeWithdrawalController = new NFeWithdrawalController();
