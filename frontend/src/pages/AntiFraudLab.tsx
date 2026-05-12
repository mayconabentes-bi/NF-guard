import * as React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Fingerprint, 
  Zap, 
  Lock, 
  AlertTriangle,
  History,
  FileSearch,
  Database,
  ArrowRight,
  RefreshCw,
  Bug,
  Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { automationService } from '@/services/automationService';
import { wmsService } from '@/lib/wmsService';
import { validateTokenUseCase } from '@/domains/workflow/useCases/ValidateTokenUseCase';
import { fulfillTokenUseCase } from '@/domains/workflow/useCases/FulfillTokenUseCase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AntiFraudLab() {
  const { profile, currentUnit } = useAuth();
  const [lastTokenId, setLastTokenId] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<{type: 'success' | 'error' | 'info' | 'warning', message: string, time: string}[]>([]);
  const [isSimulating, setIsSimulating] = React.useState(false);

  const addLog = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
    setLogs(prev => [{ type, message, time }, ...prev].slice(0, 15));
  };

  const simulateIngestion = async () => {
    if (!profile?.organizationId) return;
    setIsSimulating(true);
    addLog('info', 'Gerando payload de XML sintético para estresse...');
    
    try {
      const mockXml = {
        accessKey: `352405${Math.random().toString().slice(2, 14)}00019155001000${Math.random().toString().slice(2, 11)}1`,
        digestValue: `SIM-SHA1-${Math.random().toString(36).substring(7).toUpperCase()}`,
        issuer: "LABS_SYNTHETIC_SUPPLIER_SA",
        date: new Date().toISOString(),
        total: 1000.00,
        items: [
          { sku: "LAB-TEST-001", name: "Item de Teste Antifraude", qty: 1, uom: "UN", isHeavy: false }
        ]
      };

      const xmlId = await wmsService.ingestXML(mockXml, profile.organizationId, profile.id, currentUnit?.id || 'LAB_UNIT');
      addLog('success', `XML Injetado: ${xmlId.slice(0,8)}...`);
      
      const tokens = await wmsService.getTokensByXML(xmlId);
      if (tokens.length > 0) {
        setLastTokenId(tokens[0].id);
        addLog('success', `Token de Retirada gerado e ativo: ${tokens[0].id.slice(0,8)}`);
      }
      
      toast.success("Cenário de teste preparado!");
    } catch (error: any) {
      addLog('error', `Falha na Ingestão: ${error.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const testValidDelivery = async () => {
    if (!lastTokenId || !profile) return;
    setIsSimulating(true);
    addLog('info', 'Iniciando PROTOCOLO DE ENTREGA LEGÍTIMA...');
    
    try {
      await fulfillTokenUseCase.execute({
        tokenCode: lastTokenId, 
        userId: profile.id, 
        unitId: currentUnit?.id || 'LAB_UNIT', 
        receiverName: 'RECEBEDOR_TESTE', 
        staffName: profile.fullName
      });
      
      addLog('success', 'Entrega finalizada com Triple-Signature.');
      addLog('success', 'Evento de rastreabilidade imutável gravado.');
      toast.success("Entrega legítima concluída!");
    } catch (error: any) {
      addLog('error', `Erro na entrega: ${error.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const testDoubleDipping = async () => {
    if (!lastTokenId) return;
    setIsSimulating(true);
    addLog('warning', 'ATAQUE: Tentando reuso de Token (Double-Dipping)...');
    
    try {
      // First, try to validate again. validateToken throws if already DELIVERED
      await wmsService.validateToken(lastTokenId, currentUnit?.id || 'LAB_UNIT');
      addLog('error', 'FALHA NO TESTE: O sistema permitiu a re-validação!');
    } catch (error: any) {
      addLog('error', `BLOQUEIO ATIVO: ${error.message}`);
      addLog('info', 'O núcleo de segurança detectou a tentativa e abortou a operação.');
      toast.error("FRAUDE BLOQUEADA: Tentativa de Double-Dipping detectada!", {
        duration: 5000,
        icon: <ShieldAlert className="h-5 w-5 text-red-500" />
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 rounded-2xl shadow-xl shadow-rose-900/20">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
             <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Anti-Fraud Lab</h1>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nexus ERP - Estresse de Integridade</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Step 1: Prep */}
        <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden group">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
               <Zap className="h-8 w-8 text-blue-400" />
               <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] font-black uppercase">Fase 01</Badge>
            </div>
            <div>
               <h3 className="text-lg font-black uppercase tracking-tight">Preparar Cenário</h3>
               <p className="text-xs text-slate-400 mt-1">Injete um XML fictício para gerar tokens de teste.</p>
            </div>
            <Button 
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl"
              onClick={simulateIngestion}
              disabled={isSimulating}
            >
              {isSimulating ? <RefreshCw className="animate-spin h-4 w-4" /> : "Injetar XML Sintético"}
            </Button>
          </div>
        </Card>

        {/* Step 2: Legit */}
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden ring-1 ring-slate-100">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
               <ShieldCheck className="h-8 w-8 text-emerald-500" />
               <Badge className="bg-emerald-100 text-emerald-600 border-none text-[8px] font-black uppercase">Fase 02</Badge>
            </div>
            <div>
               <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Fluxo Legítimo</h3>
               <p className="text-xs text-slate-500 mt-1">Realize uma entrega normal e valide o log.</p>
            </div>
            <Button 
              variant="outline"
              className="w-full h-14 border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-50"
              onClick={testValidDelivery}
              disabled={isSimulating || !lastTokenId}
            >
              Simular Entrega Real
            </Button>
          </div>
        </Card>

        {/* Step 3: Attack */}
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden border-2 border-rose-100">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
               <Bug className="h-8 w-8 text-rose-500 animate-pulse" />
               <Badge className="bg-rose-100 text-rose-600 border-none text-[8px] font-black uppercase">Fase 03</Badge>
            </div>
            <div>
               <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Teste de Ataque</h3>
               <p className="text-xs text-slate-500 mt-1">Tente reutilizar o mesmo token para testar o bloqueio.</p>
            </div>
            <Button 
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-rose-200"
              onClick={testDoubleDipping}
              disabled={isSimulating || !lastTokenId}
            >
              Executar Double-Dipping
            </Button>
          </div>
        </Card>
      </div>

      {/* Forensic Console */}
      <Card className="border-none shadow-2xl bg-slate-950 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-white/5 p-6 border-b border-white/5 flex flex-row items-center justify-between">
           <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-300">Console de Segurança do Lab</CardTitle>
           </div>
           <Badge variant="outline" className="border-white/10 text-slate-500 text-[8px] font-mono">DEBUG_MODE_ON</Badge>
        </CardHeader>
        <CardContent className="p-8">
           <div className="bg-black/50 rounded-2xl p-6 h-[400px] overflow-y-auto font-mono text-[11px] space-y-2 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">Aguardando interação para iniciar monitoramento...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300",
                    log.type === 'error' ? 'text-rose-400' :
                    log.type === 'warning' ? 'text-amber-400' :
                    log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                  )}>
                    <span className="opacity-40">[{log.time}]</span>
                    <span className="font-black">[{log.type.toUpperCase()}]</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))
              )}
           </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
         <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Fingerprint className="h-32 w-32" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Protocolo de Imutabilidade</h4>
            <p className="text-xs text-blue-100 leading-relaxed font-medium">
               Cada ação neste laboratório gera um evento real na trilha de rastreabilidade. Nada pode ser apagado, garantindo conformidade total com auditorias fiscais.
            </p>
         </div>
         <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl flex items-center justify-between group cursor-help">
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase text-slate-500">Núcleo Ativo</span>
               </div>
               <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Assinatura Tripla</h4>
               <p className="text-xs text-slate-500 font-medium italic">Proteção contra repúdio de entrega garantida.</p>
            </div>
            <ArrowRight className="h-8 w-8 text-slate-300 group-hover:text-blue-600 transition-colors" />
         </div>
      </div>
    </div>
  );
}
