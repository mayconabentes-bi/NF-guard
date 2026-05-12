import { supabase } from '@/lib/supabase';
import { automationService } from '@/services/automationService'; // Future TraceabilityService

export interface ExecuteWithdrawalParams {
  tokenCode: string;
  userId: string;
  unitId: string;
  receiverName?: string;
  staffName?: string;
  expectedUnitType: 'LOJA' | 'GALPAO'; // To ensure Loja doesn't deliver Galpao items
}

export class ExecuteWithdrawalUseCase {
  /**
   * Executa a Conferência Cega (Blind Check) e a Baixa Logística.
   * Contém a regra de negócio Antifraude (Double-Dipping).
   */
  public async execute(params: ExecuteWithdrawalParams): Promise<void> {
    const { tokenCode, userId, unitId, receiverName, staffName, expectedUnitType } = params;

    // 1. Validação de Existência
    const { data: tokenData, error: fetchError } = await supabase
      .from("withdrawal_tokens")
      .select("*")
      .eq("id", tokenCode)
      .single();
    
    if (fetchError || !tokenData) {
      throw new Error("Token inexistente ou inválido.");
    }

    // 2. Validação de Roteamento (Loja vs Galpão)
    // Impede que um operador de Loja baixe um token de Galpão, e vice-versa.
    const tokenTarget = tokenData.target_unit_type || (tokenData.is_heavy ? 'GALPAO' : 'LOJA');
    if (tokenTarget !== expectedUnitType) {
       // Log de tentativa de desvio de rota
       await automationService.logEvent({
        entityId: tokenCode,
        entityType: 'WITHDRAWAL_TOKEN' as any,
        action: 'FRAUD_ATTEMPT_WRONG_UNIT_TYPE',
        userId,
        unitId,
        organizationId: tokenData.company_id,
        metadata: { expected: expectedUnitType, actual: tokenTarget }
      });
      throw new Error(`DESVIO DE ROTA: Este produto pertence ao fluxo de ${tokenTarget}, mas foi lido no fluxo de ${expectedUnitType}.`);
    }

    // 3. Validação Antifraude (Double-Dipping)
    if (tokenData.status === 'DELIVERED') {
      await automationService.logEvent({
        entityId: tokenCode,
        entityType: 'WITHDRAWAL_TOKEN' as any,
        action: 'FRAUD_ATTEMPT_DOUBLE_DIPPING',
        userId,
        unitId,
        organizationId: tokenData.company_id,
        metadata: {
          originalDelivery: tokenData.delivery_audit
        }
      });
      throw new Error(`FRAUDE DETECTADA: Item já entregue em ${tokenData.delivery_audit?.timestamp} na unidade ${tokenData.delivery_audit?.unitId}`);
    }

    // 4. Execução da Baixa
    const { error: updateError } = await supabase
      .from("withdrawal_tokens")
      .update({
        status: 'DELIVERED',
        delivery_audit: {
          unitId,
          userId,
          staffName: staffName || 'SISTEMA',
          receiverName: receiverName || 'NÃO INFORMADO',
          timestamp: new Date().toISOString(),
          digestValidation: true
        }
      })
      .eq("id", tokenCode);

    if (updateError) throw updateError;

    // 5. Rastreabilidade Positiva
    await automationService.logEvent({
      entityId: tokenCode,
      entityType: 'WITHDRAWAL_TOKEN' as any,
      action: 'WMS_DELIVERY_COMPLETED',
      userId,
      unitId,
      organizationId: tokenData.company_id,
      metadata: { 
        sku: tokenData.sku,
        qty: tokenData.quantity
      }
    });
  }
}

export const executeWithdrawalUseCase = new ExecuteWithdrawalUseCase();
