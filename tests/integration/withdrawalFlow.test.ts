import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nfeWithdrawalService } from '../../backend/src/services/nfeWithdrawalService';
import { nfeWithdrawalRepository } from '../../backend/src/repositories/nfeWithdrawalRepository';

// Mock repository for integration testing logic without real DB side-effects
vi.mock('../../backend/src/repositories/nfeWithdrawalRepository', () => ({
  nfeWithdrawalRepository: {
    findNFWithItems: vi.fn(),
    processWithdrawal: vi.fn()
  }
}));

describe('Withdrawal Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario 2: Partial Withdrawal (24 -> 10, balance 14)', async () => {
    const mockNF = {
      id: 'nf-123',
      chave_nfe: 'KEY-PARTIAL',
      status: 'ABERTA',
      items: [{ id: 'item-1', sku: 'SKU-PARTIAL', saldo: 24, quantidade_retirada: 0 }]
    };

    vi.mocked(nfeWithdrawalRepository.findNFWithItems).mockResolvedValue(mockNF as any);
    vi.mocked(nfeWithdrawalRepository.processWithdrawal).mockResolvedValue({ success: true, newSaldo: 14 } as any);

    const result = await nfeWithdrawalService.executeWithdrawal(
      'KEY-PARTIAL',
      'item-1',
      10,
      'unit-1',
      'user-1',
      'company-1',
      { ip: '127.0.0.1', ua: 'test' }
    );

    expect(result.newSaldo).toBe(14);
    expect(nfeWithdrawalRepository.processWithdrawal).toHaveBeenCalledWith(
      'nf-123', 'item-1', 10, 'unit-1', 'user-1', 'company-1', expect.anything()
    );
  });

  it('Scenario 3: Total Withdrawal (Balance 0)', async () => {
    const mockNF = {
      id: 'nf-123',
      chave_nfe: 'KEY-TOTAL',
      status: 'ABERTA',
      items: [{ id: 'item-1', sku: 'SKU-TOTAL', saldo: 5, quantidade_retirada: 0 }]
    };

    vi.mocked(nfeWithdrawalRepository.findNFWithItems).mockResolvedValue(mockNF as any);
    vi.mocked(nfeWithdrawalRepository.processWithdrawal).mockResolvedValue({ success: true, newSaldo: 0 } as any);

    const result = await nfeWithdrawalService.executeWithdrawal(
      'KEY-TOTAL',
      'item-1',
      5,
      'unit-1',
      'user-1',
      'company-1',
      { ip: '127.0.0.1', ua: 'test' }
    );

    expect(result.newSaldo).toBe(0);
  });

  it('Scenario 4: Re-use closed NF (Error expected)', async () => {
    const mockNF = {
      id: 'nf-123',
      chave_nfe: 'KEY-CLOSED',
      status: 'ENCERRADA',
      items: [{ id: 'item-1', sku: 'SKU-CLOSED', saldo: 0, quantidade_retirada: 10 }]
    };

    vi.mocked(nfeWithdrawalRepository.findNFWithItems).mockResolvedValue(mockNF as any);

    await expect(nfeWithdrawalService.executeWithdrawal(
      'KEY-CLOSED',
      'item-1',
      5,
      'unit-1',
      'user-1',
      'company-1',
      { ip: '127.0.0.1', ua: 'test' }
    )).rejects.toThrow('Nota Fiscal encerrada');
  });
});
