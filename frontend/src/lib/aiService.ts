export interface Insight {
  id: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'ALERT';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface RiskAnalysis {
  score: number;
  factors: { name: string; score: number; detail: string }[];
}

export interface ProductionAuditReport {
  score: number;
  anomalies: string[];
  recommendations: string[];
  predictedOutput: number;
}

export const aiService = {
  async chat(message: string, history: any[] = []) {
    return "O serviço de IA está desativado conforme configuração do sistema.";
  },

  async getOperationalInsights(unitData: any): Promise<Insight[]> {
    return [
      {
        id: '1',
        type: 'WARNING',
        title: 'Manutenção Preventiva Sugerida',
        description: 'Padrão de uso sugere revisão de equipamentos em 15 dias.',
        impact: 'Garantia de continuidade operacional.',
        recommendation: 'Agendar check-up com a equipe técnica.'
      }
    ];
  },

  async analyzeRisk(movements: any[]): Promise<RiskAnalysis> {
    return {
      score: 0,
      factors: [{ name: 'Monitoramento', score: 0, detail: 'Análise de risco automática desativada.' }]
    };
  },

  async auditProduction(po: any, logs: any[]): Promise<ProductionAuditReport> {
    return {
      score: 100,
      anomalies: ["Auditoria manual recomendada."],
      recommendations: ["Validar registros de pesagem."],
      predictedOutput: po.targetQuantity
    };
  }
};
