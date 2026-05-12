import { Request, Response, NextFunction } from 'express';
// import { auditRepository } from '../repositories/auditRepository.js';

export const auditLogger = (action: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    // Capture the original send to log after response
    const oldSend = res.send;
    
    res.send = function (data) {
      const log = {
        userId: req.user?.id || 'anonymous',
        action,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      };
      
      console.log(`[Audit Log]: ${JSON.stringify(log)}`);
      // await auditRepository.save(log); // Save to DB

      return oldSend.apply(res, arguments as any);
    };
    
    next();
  };
};
