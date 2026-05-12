import pool from '../config/database.js';
import { auditRepository } from './auditRepository.js';

export class NFeWithdrawalRepository {
  async findNFWithItems(chaveNfe: string) {
    const client = await pool.connect();
    try {
      const nfResult = await client.query('SELECT * FROM nfs WHERE chave_nfe = $1', [chaveNfe]);
      if (nfResult.rows.length === 0) return null;

      const nf = nfResult.rows[0];
      const itemsResult = await client.query('SELECT * FROM nf_itens WHERE nf_id = $1', [nf.id]);
      
      return {
        ...nf,
        items: itemsResult.rows
      };
    } finally {
      client.release();
    }
  }

  async processWithdrawal(
    nfId: string, 
    itemId: string, 
    quantidade: number, 
    unidadeId: string, 
    operadorId: string,
    companyId: string,
    auditInfo: { ip: string, ua: string }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock the item for update
      const itemResult = await client.query(
        'SELECT * FROM nf_itens WHERE id = $1 AND nf_id = $2 FOR UPDATE',
        [itemId, nfId]
      );

      if (itemResult.rows.length === 0) {
        await auditRepository.save({
          company_id: companyId,
          user_id: operadorId,
          unit_id: unidadeId,
          operation: 'NFE_WITHDRAWAL_FAILED_NOT_FOUND',
          status: 'FAILURE',
          entity_id: itemId,
          ip_address: auditInfo.ip,
          user_agent: auditInfo.ua,
          metadata: { nfId, itemId, quantidade }
        }, client);
        throw new Error('Item não encontrado');
      }
      
      const item = itemResult.rows[0];
      const prevBalance = parseFloat(item.saldo);

      // 2. Validate balance
      if (prevBalance < quantidade) {
        await auditRepository.save({
          company_id: companyId,
          user_id: operadorId,
          unit_id: unidadeId,
          operation: 'NFE_WITHDRAWAL_FAILED_BALANCE',
          status: 'FAILURE',
          entity_id: itemId,
          prev_balance: prevBalance,
          ip_address: auditInfo.ip,
          user_agent: auditInfo.ua,
          metadata: { nfId, itemId, quantidade, required: quantidade, available: prevBalance }
        }, client);
        throw new Error(`Saldo insuficiente. Disponível: ${prevBalance}`);
      }

      // 3. Update balances
      const newRetirada = parseFloat(item.quantidade_retirada) + quantidade;
      const newSaldo = prevBalance - quantidade;

      await client.query(
        'UPDATE nf_itens SET quantidade_retirada = $1, saldo = $2 WHERE id = $3',
        [newRetirada, newSaldo, itemId]
      );

      // 4. Record withdrawal
      await client.query(
        'INSERT INTO nfe_retiradas (nf_item_id, unidade_id, operador_id, quantidade_retirada) VALUES ($1, $2, $3, $4)',
        [itemId, unidadeId, operadorId, quantidade]
      );

      // 5. Audit Log Success
      await auditRepository.save({
        company_id: companyId,
        user_id: operadorId,
        unit_id: unidadeId,
        operation: 'NFE_WITHDRAWAL_SUCCESS',
        status: 'SUCCESS',
        entity_id: itemId,
        prev_balance: prevBalance,
        new_balance: newSaldo,
        ip_address: auditInfo.ip,
        user_agent: auditInfo.ua,
        metadata: { nfId, itemId, quantidade }
      }, client);

      // 6. Check if NF should be closed
      const allItemsResult = await client.query('SELECT SUM(saldo) as total_saldo FROM nf_itens WHERE nf_id = $1', [nfId]);
      const totalSaldo = parseFloat(allItemsResult.rows[0].total_saldo || '0');

      if (totalSaldo <= 0) {
        await client.query('UPDATE nfs SET status = $1, retirada_completa = $2 WHERE id = $3', ['ENCERRADA', true, nfId]);
      }

      await client.query('COMMIT');
      return { success: true, newSaldo };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const nfeWithdrawalRepository = new NFeWithdrawalRepository();
