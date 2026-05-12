import * as React from 'react';
import { 
  Factory, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Weight, 
  Scissors, 
  History, 
  Timer, 
  User as UserIcon, 
  Cpu, 
  TrendingUp, 
  Search,
  QrCode,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { productionService } from '@/lib/productionService';
import { useAuth } from '@/lib/AuthContext';
import { ProductionOrder, Machine, POStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CuttingStation } from '@/components/production/CuttingStation';
import { NewProductionOrderDialog } from '@/components/production/NewProductionOrderDialog';

export default function ProductionDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<ProductionOrder[]>([]);
  const [machines, setMachines] = React.useState<Machine[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');
  const [selectedPO, setSelectedPO] = React.useState<ProductionOrder | null>(null);
  const [isNewPODialogOpen, setIsNewPODialogOpen] = React.useState(false);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [ordersList, machinesList] = await Promise.all([
        productionService.listOrders(profile.organizationId),
        productionService.listMachines(profile.organizationId)
      ]);
      setOrders(ordersList);
      setMachines(machinesList);
    } catch (e) {
      toast.error("Erro ao carregar dados de produção");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [profile]);

  const getStatusColor = (status: POStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'ON_HOLD': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const filteredOrders = orders.filter(o => 
    o.poNumber.toLowerCase().includes(filter.toLowerCase()) ||
    o.productName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      {selectedPO ? (
        <div className="animate-in fade-in zoom-in duration-300">
           <CuttingStation 
             po={selectedPO} 
             onCancel={() => setSelectedPO(null)} 
             onSuccess={() => {
               setSelectedPO(null);
               fetchData();
             }} 
           />
        </div>
      ) : (
        <>
          {/* Header MES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Factory className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-black text-slate-900 tracking-tighter uppercase">ERP MES</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> sistema de execução manufatura ativo
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold text-[10px] uppercase tracking-widest h-10 border-slate-200 hover:bg-white hover:text-blue-700 text-slate-700 shadow-sm transition-colors">
            <QrCode className="h-4 w-4 mr-2" /> Escanear OP
          </Button>
          <Button onClick={() => setIsNewPODialogOpen(true)} className="font-bold text-[10px] uppercase tracking-widest h-10 bg-blue-600 hover:bg-blue-700 shadow-md">
            Nova Ordem de Produção
          </Button>
        </div>
      </div>

      <NewProductionOrderDialog
        open={isNewPODialogOpen}
        onOpenChange={setIsNewPODialogOpen}
        onSuccess={() => {
          setIsNewPODialogOpen(false);
          fetchData();
        }}
        machines={machines}
      />

      {/* KPIs de Fábrica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Timer, label: 'OEE Global', value: '88.4%', trend: '+2.1%', color: 'text-emerald-600' },
          { icon: AlertTriangle, label: 'Perda Técnica', value: '1.2%', trend: '-0.4%', color: 'text-amber-600' },
          { icon: Weight, label: 'Produção (Peso)', value: '14.2 ton', trend: '+12%', color: 'text-slate-900' },
          { icon: Scissors, label: 'Eficiência de Corte', value: '96.8%', trend: '+0.5%', color: 'text-blue-600' }
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <kpi.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                  {kpi.trend}
                </Badge>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
              <h2 className={cn("text-3xl font-black tracking-tight", kpi.color)}>{kpi.value}</h2>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Ordens de Produção */}
        <div className="lg:col-span-12 space-y-4">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tighter">Ordens de Produção Ativas</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rastreamento em tempo real</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Pesquisar OP..." 
                  className="pl-10 h-10 text-xs bg-slate-50 border-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 px-6">Código / Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Produto</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Progresso</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right px-6">Meta / Real</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={6} className="h-16 bg-slate-50/20"></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className="hover:bg-slate-50 transition-colors border-slate-100 group cursor-pointer"
                      onClick={() => setSelectedPO(order)}
                    >
                      <TableCell className="px-6">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-900 uppercase">{order.poNumber}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{format(order.createdAt, 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-slate-700">{order.productName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase", getStatusColor(order.status))}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="space-y-1.5">
                          <Progress value={(order.producedQuantity / order.targetQuantity) * 100} className="h-1.5 bg-slate-100" />
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                            <span>{Math.round((order.producedQuantity / order.targetQuantity) * 100)}%</span>
                            <span>{order.targetQuantity} total</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <p className="text-xs font-black text-slate-900">{order.producedQuantity}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Unidades</p>
                      </TableCell>
                      <TableCell className="px-6">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-900">
                            <ChevronRight className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Máquinas e Operadores */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" /> Status do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {machines.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      m.status === 'ONLINE' ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">OP: {m.currentPoId || 'IDLE'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ShieldCheck className="h-16 w-16" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-tighter text-white">Segurança de Dados</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase">Monitoramento de Integridade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                     <span className="text-slate-400">Backups Realizados</span>
                     <span className="text-emerald-400">Sincronizado</span>
                  </div>
                  <Progress value={100} className="h-1 bg-white/10" />
               </div>
               <div className="space-y-3">
                  {[
                    "Criptografia ponta-a-ponta ativa",
                    "Logs de auditoria preservados",
                    "Acesso restrito por nível hierárquico"
                  ].map((check, i) => (
                    <div key={i} className="flex font-bold items-start gap-3 text-[10px]">
                       <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                       <span className="text-slate-300">{check}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline de Produção */}
        <div className="lg:col-span-8">
           <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader>
                 <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                   <History className="h-4 w-4 text-primary" /> Fluxo de Produção Recente
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100">
                    {[
                      { time: '14:22', type: 'Corte Confirmado', user: 'Marcos Silva', detail: '350m de Cabo Flexível 2.5mm', icon: Scissors, color: 'text-blue-500' },
                      { time: '13:45', type: 'Pesagem de Lote', user: 'Ana Julia', detail: '750kg Verificados (Diferença 0.05%)', icon: Weight, color: 'text-emerald-500' },
                      { time: '12:10', type: 'Início de Ordem #OP-2024-001', user: 'Sistema META', detail: 'Máquina EXTR-01 Preparada', icon: Play, color: 'text-primary' },
                      { time: '10:00', type: 'Alerta de Perda Técnica', user: 'IA Auditora', detail: 'Anomalia detectada em bobina #B-99', icon: AlertTriangle, color: 'text-amber-500' }
                    ].map((step, i) => (
                      <div key={i} className="relative flex items-center gap-6 group">
                         <div className={cn(
                           "absolute left-0 h-10 w-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-sm z-10",
                           step.color
                         )}>
                            <step.icon className="h-4 w-4" />
                         </div>
                         <div className="ml-12">
                            <div className="flex items-center gap-2 mb-1">
                               <p className="text-xs font-black text-slate-900 uppercase">{step.type}</p>
                               <span className="text-[9px] font-bold text-slate-300">{step.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Por: {step.user}</p>
                            <p className="text-[11px] text-slate-600 font-medium">{step.detail}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
