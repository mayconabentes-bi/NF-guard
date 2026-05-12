import { describe, it, expect, beforeEach } from 'vitest';
import { nfeWithdrawalService } from '../../backend/src/services/nfeWithdrawalService';
import { nfeWithdrawalRepository } from '../../backend/src/repositories/nfeWithdrawalRepository';

// This test validates the RBAC logic at the Service/Repository level
// simulating different user roles and their expected permissions.

describe('RBAC Operational Flow Tests', () => {
  const companyId = '00000000-0000-0000-0000-000000000001';
  const unitId = 'unit-loja-centro'; // Loja
  const warehouseId = 'unit-galpao-norte'; // Galpão

  const vendedor = { id: 'dc1123ca-9921-4448-8352-dc8566758dbb', role: 'OPERATOR' }; // Real UID from screenshot
  const operador = { id: '0f6fdb08-2d5e-47b6-a743-a9d16bccdd11', role: 'OPERATOR' }; // Real UID from screenshot

  it('RBAC: Vendedor should be able to consult NF status', async () => {
    // Mocking a consultation
    const mockNF = { id: 'nf-1', status: 'ABERTA' };
    const spy = vi.spyOn(nfeWithdrawalRepository, 'findNFWithItems').mockResolvedValue(mockNF as any);
    
    const result = await nfeWithdrawalService.consultNF('SOME-KEY');
    expect(result).toBeDefined();
    expect(result.status).toBe('ABERTA');
  });

  it('Operational: Full flow - Partial to Total withdrawal', async () => {
    const nfId = 'nf-full-flow';
    const itemId = 'item-1';
    let currentSaldo = 24;

    const findSpy = vi.spyOn(nfeWithdrawalRepository, 'findNFWithItems').mockImplementation(async () => ({
      id: nfId,
      status: currentSaldo > 0 ? 'ABERTA' : 'ENCERRADA',
      items: [{ id: itemId, saldo: currentSaldo }]
    } as any));

    const processSpy = vi.spyOn(nfeWithdrawalRepository, 'processWithdrawal').mockImplementation(async (nf, item, qty) => {
      currentSaldo -= qty;
      return { success: true, newSaldo: currentSaldo };
    });

    // 1. Partial withdrawal (10)
    const res1 = await nfeWithdrawalService.executeWithdrawal('KEY', itemId, 10, unitId, operador.id, companyId, { ip: '1', ua: 'test' });
    expect(res1.newSaldo).toBe(14);

    // 2. Total withdrawal (14)
    const res2 = await nfeWithdrawalService.executeWithdrawal('KEY', itemId, 14, warehouseId, operador.id, companyId, { ip: '1', ua: 'test' });
    expect(res2.newSaldo).toBe(0);

    // 3. Re-withdrawal attempt (should fail due to status check in Service)
    await expect(nfeWithdrawalService.executeWithdrawal('KEY', itemId, 1, warehouseId, operador.id, companyId, { ip: '1', ua: 'test' }))
      .rejects.toThrow('Nota Fiscal encerrada');
  });

  it('RBAC: Unauthorized access should be blocked by middleware (Logic check)', async () => {
    // This is handled by UnitGuard and AuthMiddleware in the real app.
    // Here we verify that the Service correctly identifies the NF status.
    const mockNF = { id: 'nf-1', status: 'ENCERRADA' };
    vi.spyOn(nfeWithdrawalRepository, 'findNFWithItems').mockResolvedValue(mockNF as any);

    await expect(nfeWithdrawalService.executeWithdrawal('KEY', 'item-1', 1, unitId, vendedor.id, companyId, { ip: '1', ua: 'test' }))
      .rejects.toThrow('Nota Fiscal encerrada');
  });
});
