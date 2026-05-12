import { Request, Response } from 'express';
import { nfeService } from '../services/nfeService.js';

export class NFeController {
  async uploadXML(req: Request, res: Response) {
    try {
      const { xmlContent, organizationId, unitId, vendedorId } = req.body;
      
      if (!xmlContent || !organizationId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await nfeService.processXML(xmlContent, organizationId, vendedorId, unitId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in uploadXML:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

export const nfeController = new NFeController();
