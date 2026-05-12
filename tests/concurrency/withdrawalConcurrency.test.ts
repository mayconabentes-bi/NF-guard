import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nfeWithdrawalService } from '../../backend/src/services/nfeWithdrawalService';
import { nfeWithdrawalRepository } from '../../backend/src/repositories/nfeWithdrawalRepository';

describe('Withdrawal Concurrency Tests', () => {
  it('Scenario 5: Two simultaneous withdrawals, only one approved', async () => {
    // We simulate the DB locking behavior by having the repository throw if balance is exceeded
    // In a real environment, the FOR UPDATE would serialize these and the second one would find saldo = 0
    
    const mockNF = {
      id: 'nf-123',
      chave_nfe: 'KEY-CONC',
      status: 'ABERTA',
      items: [{ id: 'item-1', sku: 'SKU-CONC', saldo: 10 }]
    };

    // First request finds balance 10, subtracts 10, result 0
    // Second request finds balance 0 (after waiting for lock), result error
    
    const findSpy = vi.spyOn(nfeWithdrawalRepository, 'findNFWithItems').mockResolvedValue(mockNF as any);
    
    let balance = 10;
    const processSpy = vi.spyOn(nfeWithdrawalRepository, 'processWithdrawal').mockImplementation(async (nfId, itemId, qty) => {
      if (balance < qty) throw new Error('Saldo insuficiente');
      balance -= qty;
      return { success: true, newSaldo: balance } as any;
    });

    // Run both requests "simultaneously"
    const req1 = nfeWithdrawalService.executeWithdrawal('KEY-CONC', 'item-1', 10, 'unit-1', 'user-1', 'company-1', { ip: '1', ua: '1' });
    const req2 = nfeWithdrawalService.executeWithdrawal('KEY-CONC', 'item-1', 10, 'unit-2', 'user-2', 'company-1', { ip: '2', ua: '2' });

    const results = await Promise.allSettled([req1, req2]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect((failures[0] as any).reason.message).toBe('Saldo insuficiente');
  });
});
