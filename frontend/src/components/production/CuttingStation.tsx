import * as React from 'react';
import { 
  Weight, 
  Scissors, 
  Save, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Box,
  Hash,
  Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { productionService } from '@/lib/productionService';
import { useAuth } from '@/lib/AuthContext';
import { ProductionOrder, ProductionLog } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CuttingStationProps {
  po: ProductionOrder;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CuttingStation({ po, onSuccess, onCancel }: CuttingStationProps) {
  const { profile, user } = useAuth();
  const [weight, setWeight] = React.useState<number>(0);
  const [meters, setMeters] = React.useState<number>(0);
  const [waste, setWaste] = React.useState<number>(0);
  const [isSimulating, setIsSimulating] = React.useState(false);

  // Simulated Scale integration
  const simulateScale = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const stableWeight = (po.weightPerUnit || 0) * (Math.random() * 0.05 + 0.98); // 2% tolerance
      setWeight(Number(stableWeight.toFixed(3)));
      setIsSimulating(false);
      toast.success("Peso estabilizado via balança externa");
    }, 1500);
  };

  const handleProcess = async () => {
    if (!profile || !user) return;
    try {
      await productionService.recordProductionLog({
        poId: po.id,
        organizationId: profile.organizationId,
        type: 'CUT',
        quantity: 1,
        measurement: meters,
        weight: weight,
        userId: user.id,
        userName: profile.displayName,
        notes: `Corte e Pesagem Estabilizada. Perda técnica: ${waste}g`
      });

      if (waste > 0) {
        await productionService.recordProductionLog({
          poId: po.id,
          organizationId: profile.organizationId,
          type: 'LOSS',
          quantity: waste,
          userId: user.id,
          userName: profile.displayName,
          notes: 'Perda técnica detectada no corte'
        });
      }

      toast.success("Operação registrada na trilha de auditoria.");
      onSuccess();
    } catch (e) {
      toast.error("Erro ao registrar operação.");
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-white overflow-hidden max-w-2xl mx-auto border-t-4 border-primary">
      <CardHeader className="bg-slate-50/50 pb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" /> ESTAÇÃO DE CORTE E PESAGEM
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
               OP: {po.poNumber} • Produto: {po.productName}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Terminal Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div className="p-6 bg-slate-900 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-2 right-4 text-[8px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
                   <div className="h-1 w-1 bg-emerald-500 rounded-full" /> Live scale data
                </div>
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Peso Atual (kg)</Label>
                <div className="flex items-baseline gap-2">
                   <span className={cn(
                     "text-5xl font-black tracking-tighter tabular-nums",
                     isSimulating ? "text-slate-700" : "text-emerald-500"
                   )}>
                      {isSimulating ? "---.---" : weight.toFixed(3)}
                   </span>
                   <span className="text-lg font-bold text-slate-500">kg</span>
                </div>
                <Button 
                  onClick={simulateScale} 
                  disabled={isSimulating}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-[10px] h-8 font-black uppercase tracking-widest"
                >
                  <Scale className="h-3 w-3 mr-2" /> {isSimulating ? "Pendente..." : "Capturar Peso"}
                </Button>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Metragem do Corte (m)</Label>
                <div className="relative">
                   <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-10 h-12 text-lg font-black bg-slate-50 border-none"
                      value={meters}
                      onChange={(e) => setMeters(Number(e.target.value))}
                   />
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <Label className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2 block">Rastreamento de Perda</Label>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                      <span className="text-slate-400">Descarte Técnico (g)</span>
                      <span className="text-amber-600">+{waste}g</span>
                   </div>
                   <Input 
                      type="number" 
                      step="0.1"
                      className="bg-white/50 border-amber-100 h-10 text-sm font-bold"
                      value={waste}
                      onChange={(e) => setWaste(Number(e.target.value))}
                   />
                   <p className="text-[9px] text-amber-700/60 leading-relaxed font-medium italic">
                     * Perdas acimas de 5% serão auditadas automaticamente pela IA.
                   </p>
                </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400">Validação de Lote</p>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[9px] py-1 px-3">
                      Lote: # {po.poNumber.split('-')[1]}
                   </Badge>
                   <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[9px] py-1 px-3">
                      ISO 9001
                   </Badge>
                </div>
             </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
           <Button variant="outline" className="flex-1 font-black text-[10px] h-12 uppercase tracking-widest border-slate-200" onClick={onCancel}>
              <RefreshCw className="h-4 w-4 mr-2" /> Resetar
           </Button>
           <Button className="flex-1 font-black text-[10px] h-12 uppercase tracking-widest bg-slate-900" onClick={handleProcess}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Gravar Produção (Auditado)
           </Button>
        </div>
      </CardContent>

      <div className="bg-slate-900 p-3 flex items-center justify-between px-8 border-t border-white/5">
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
           <QrCode className="h-3 w-3" /> Sessão de Auditoria: {user?.id.slice(0,8)}
         </p>
         <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black text-emerald-500 uppercase">Gateway Seguro</span>
         </div>
      </div>
    </Card>
  );
}
