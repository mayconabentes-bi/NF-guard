import * as React from 'react';
import { 
  Timer, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play,
  Factory,
  Scissors,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductionTask {
  id: string;
  entryDate: string;
  description: string;
  executor: string;
  estimatedDelivery: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const mockTasks: ProductionTask[] = [
  {
    id: '#OP-2024-88A',
    entryDate: '09/05/2026 08:30',
    description: 'Corte de Perfil de Alumínio 20x20',
    executor: 'Marcos Oliveira',
    estimatedDelivery: '10:30 (20 min)',
    status: 'IN_PROGRESS',
    priority: 'HIGH'
  },
  {
    id: '#OP-2024-88B',
    entryDate: '09/05/2026 09:15',
    description: 'Furação de Chapas de Aço Inox',
    executor: 'Ana Santos',
    estimatedDelivery: '11:45',
    status: 'PENDING',
    priority: 'MEDIUM'
  },
  {
    id: '#OP-2024-89C',
    entryDate: '09/05/2026 07:45',
    description: 'Montagem de Kit de Ferragens V3',
    executor: 'Ricardo Lima',
    estimatedDelivery: '09:30',
    status: 'COMPLETED',
    priority: 'LOW'
  },
  {
    id: '#OP-2024-90D',
    entryDate: '08/05/2026 16:00',
    description: 'Pintura Eletrostática - Lote #5',
    executor: 'Carlos Ferro',
    estimatedDelivery: '10:00 (ATRASADO)',
    status: 'DELAYED',
    priority: 'HIGH'
  },
  {
    id: '#OP-2024-91E',
    entryDate: '09/05/2026 10:00',
    description: 'Corte de Vidro Temperado 8mm',
    executor: 'Fernanda Lima',
    estimatedDelivery: '14:00',
    status: 'PENDING',
    priority: 'MEDIUM'
  }
];

export default function ProductionMonitor() {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status: ProductionTask['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-600 text-white border-none animate-pulse">EM EXECUÇÃO</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-none">FINALIZADO</Badge>;
      case 'DELAYED':
        return <Badge className="bg-rose-600 text-white border-none">ATRASADO</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500 border-slate-200">AGUARDANDO</Badge>;
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 p-6 lg:p-10 font-sans">
      {/* Top Monitor Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/10 pb-8">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Monitor de Produção</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 uppercase text-[10px] font-black tracking-widest px-3">
                Almoxarifado Central
              </Badge>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Feed em tempo real</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-5xl font-black font-mono tracking-tighter text-white">
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Grid Monitor */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Production List */}
        <div className="xl:col-span-9 space-y-4">
          <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <div className="col-span-2">ID Identificador</div>
            <div className="col-span-3">Descrição da Atividade</div>
            <div className="col-span-2 text-center">Entrada</div>
            <div className="col-span-2">Operador / Executor</div>
            <div className="col-span-2 text-center">Previsão</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          <div className="space-y-3">
            {mockTasks.map((task) => (
              <div 
                key={task.id} 
                className={cn(
                  "grid grid-cols-12 items-center px-6 py-6 rounded-2xl border transition-all duration-300",
                  task.status === 'IN_PROGRESS' 
                    ? "bg-blue-600/5 border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]" 
                    : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                )}
              >
                <div className="col-span-2">
                  <span className="font-mono font-black text-lg text-blue-400">{task.id}</span>
                </div>
                <div className="col-span-3">
                  <h3 className="text-lg font-bold text-white leading-tight">{task.description}</h3>
                </div>
                <div className="col-span-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-xs font-bold text-slate-300">{task.entryDate.split(' ')[1]}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{task.entryDate.split(' ')[0]}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">{task.executor}</span>
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <div className={cn(
                    "inline-flex flex-col items-center gap-1 px-4 py-2 rounded-xl",
                    task.status === 'DELAYED' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-slate-800/50 text-slate-300"
                  )}>
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-black font-mono tracking-tight">{task.estimatedDelivery}</span>
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  {getStatusBadge(task.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Alerts / Stats */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="bg-blue-600 border-none shadow-xl shadow-blue-600/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Factory className="h-20 w-20" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-xs font-black uppercase tracking-widest">Capacidade Operacional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-white tracking-tighter">84%</div>
              <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Fluxo Estável
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/5 shadow-2xl backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle className="h-4 w-4 text-amber-500" /> Alertas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Matéria Prima Baixa', target: 'Alumínio 20x20', level: '15%' },
                { label: 'Manutenção Preventiva', target: 'Serra Fita industrial', level: 'Amanhã' }
              ].map((alert, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 group hover:border-amber-500/30 transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{alert.label}</p>
                  <p className="text-sm font-bold text-slate-200">{alert.target}</p>
                  <div className="mt-2 flex items-center justify-between">
                     <span className="text-[10px] font-black font-mono text-amber-500">{alert.level}</span>
                     <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-emerald-600 border-none shadow-xl shadow-emerald-600/10 p-6">
             <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="h-8 w-8 text-white/50" />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Turno Manhã</span>
             </div>
             <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Pedidos Finalizados</p>
             <h2 className="text-4xl font-black text-white tracking-tighter">18</h2>
          </Card>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            CONECTADO AO SERVIDOR META
          </div>
          <div className="flex items-center gap-2">
             ULTRA-LATÊNCIA: 12MS
          </div>
        </div>
        <div>
          VERSÃO DO TERMINAL: v3.0.0A
        </div>
      </div>
    </div>
  );
}
