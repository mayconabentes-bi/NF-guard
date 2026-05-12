import pool from '../config/database.js';

export interface AuditLogEntry {
  company_id: string;
  user_id?: string;
  unit_id?: string;
  operation: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  entity_type?: string;
  entity_id?: string;
  prev_balance?: number;
  new_balance?: number;
  status: 'SUCCESS' | 'FAILURE';
  metadata?: any;
}

export class AuditRepository {
  async save(log: AuditLogEntry, client?: any) {
    const db = client || pool;
    const query = `
      INSERT INTO audit_logs (
        company_id, user_id, unit_id, operation, ip_address, 
        user_agent, device_type, entity_type, entity_id, 
        prev_balance, new_balance, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;
    const values = [
      log.company_id, log.user_id, log.unit_id, log.operation, log.ip_address,
      log.user_agent, log.device_type, log.entity_type, log.entity_id,
      log.prev_balance, log.new_balance, log.status, log.metadata
    ];

    await db.query(query, values);
  }
}

export const auditRepository = new AuditRepository();
