import * as React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle, 
  ArrowRightLeft, 
  Plus,
  ShieldAlert,
  ShieldCheck,
  Store,
  Warehouse,
  ClipboardCheck,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { automationService } from '@/services/automationService';
import { useAuth } from '@/lib/AuthContext';
import { wmsService } from '@/lib/wmsService';
import { useNavigate } from 'react-router-dom';
export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    processedXmls: 0,
    totalDeliveries: 0,
    fraudAttempts: 0,
    pendingWithdrawals: 0,
    storeDeliveries: 0,
    warehouseDeliveries: 0
  });
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDashboardData() {
      if (!profile?.organizationId) return;
      
      try {
        setLoading(true);
        // 1. Fetch Events for Timeline & Frauds
        const events = await automationService.getRecentEvents(profile.organizationId, 10);
        setRecentActivities(events);

        // 2. Fetch WMS Stats
        const allTokens = await wmsService.getGlobalAudit(profile.organizationId);
        const xmls = await wmsService.listActiveXMLs(profile.organizationId);

        const today = new Date().toISOString().split('T')[0];
        const todayTokens = allTokens.filter(t => t.delivery_audit?.timestamp?.startsWith(today));
        
        const storeCount = todayTokens.filter(t => t.delivery_audit?.unitId?.includes('STORE') || t.delivery_audit?.unitId === 'LOJA').length;
        const warehouseCount = todayTokens.filter(t => t.delivery_audit?.unitId?.includes('WMS') || t.delivery_audit?.unitId === 'GALPAO').length;

        setStats({
          processedXmls: xmls.length,
          totalDeliveries: todayTokens.length,
          fraudAttempts: events.filter(e => e.action.includes('FRAUD')).length,
          pendingWithdrawals: allTokens.filter(t => t.status === 'AVAILABLE').length,
          storeDeliveries: storeCount,
          warehouseDeliveries: warehouseCount
        });

        // 3. Mock Chart Data for last 7 days (Real apps would aggregate from DB)
        setChartData([
          { name: 'Seg', loja: 12, galpao: 45 },
          { name: 'Ter', loja: 18, galpao: 52 },
          { name: 'Qua', loja: 15, galpao: 38 },
          { name: 'Qui', loja: 22, galpao: 61 },
          { name: 'Sex', loja: 30, galpao: 75 },
          { name: 'Sab', loja: 25, galpao: 40 },
          { name: 'Dom', loja: 10, galpao: 15 },
        ]);

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [profile?.organizationId]);

  const kpis = [
    {
      title: 'Integridade Fiscal',
      subtitle: 'XMLs Processados Hoje',
      value: stats.processedXmls,
      icon: ClipboardCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+4%'
    },
    {
      title: 'Eficiência de Saída',
      subtitle: 'Total de Entregas Hoje',
      value: stats.totalDeliveries,
      icon: Zap,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '+12%'
    },
    {
      title: 'Barreira Antifraude',
      subtitle: 'Tentativas Bloqueadas',
      value: stats.fraudAttempts,
      icon: ShieldAlert,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      trend: '0 Crítico'
    },
    {
      title: 'Gargalo de Retirada',
      subtitle: 'Itens Aguardando Galpão',
      value: stats.pendingWithdrawals,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '-2h médio'
    }
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-widest mb-2 border-none">Painel de Monitoramento Global</Badge>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Nexus <span className="text-blue-500">Security</span> Center</h1>
          <p className="text-slate-200 font-medium text-sm max-w-xl italic">Controle em tempo real de integridade fiscal e prevenção de conluio logístico.</p>
        </div>
        <div className="flex items-center gap-6 relative z-10 backdrop-blur-md bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg">
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade Master</p>
             <p className="font-bold text-white uppercase text-sm">{profile?.organizationId || 'Nexus ERP'}</p>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 shadow-inner">
             <Activity className="h-7 w-7 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Módulos de Execução Logística */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => navigate('/fiscal')} className="bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-[2rem] text-left transition-all hover:-translate-y-1 shadow-xl shadow-blue-600/20 group">
           <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                 <ClipboardCheck className="h-7 w-7 text-white" />
              </div>
              <ArrowRightLeft className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0" />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Movimentação Fiscal</h3>
           <p className="text-blue-100 font-bold text-xs uppercase tracking-widest leading-relaxed">Upload de XML SEFAZ<br/>Auditoria de NF-e</p>
        </button>

        <button onClick={() => navigate('/wms-distributed')} className="bg-emerald-600 hover:bg-emerald-700 text-white p-8 rounded-[2rem] text-left transition-all hover:-translate-y-1 shadow-xl shadow-emerald-600/20 group">
           <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                 <Warehouse className="h-7 w-7 text-white" />
              </div>
              <ArrowRightLeft className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0" />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">WMS Galpão</h3>
           <p className="text-emerald-100 font-bold text-xs uppercase tracking-widest leading-relaxed">Conferência Cega (BIP)<br/>Liberação por Token</p>
        </button>

        <button onClick={() => navigate('/checkout')} className="bg-orange-500 hover:bg-orange-600 text-white p-8 rounded-[2rem] text-left transition-all hover:-translate-y-1 shadow-xl shadow-orange-500/20 group">
           <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                 <Store className="h-7 w-7 text-white" />
              </div>
              <ArrowRightLeft className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0" />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Checkout Loja</h3>
           <p className="text-orange-100 font-bold text-xs uppercase tracking-widest leading-relaxed">Liberação de Miudezas<br/>Faturamento Rápido</p>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden group hover:-translate-y-1 transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("flex items-center justify-center w-12 h-12 rounded-2xl shrink-0", kpi.bgColor, kpi.color)}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-slate-100 text-slate-400">{kpi.trend}</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black tracking-tighter text-slate-900">{kpi.value}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none mt-1">{kpi.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Main Chart Section */}
        <Card className="lg:col-span-4 border-none shadow-2xl ring-1 ring-slate-200 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Fluxo Operacional</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Saídas Processadas por Unidade</CardDescription>
            </div>
            <div className="flex gap-2">
               <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] uppercase">Loja</Badge>
               <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] uppercase">Galpão</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px] min-h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                {chartData.length > 0 ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLoja" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGalpao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 700, padding: '1.5rem' }}
                    />
                    <Area type="monotone" dataKey="loja" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorLoja)" />
                    <Area type="monotone" dataKey="galpao" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorGalpao)" />
                  </AreaChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                    Carregando dados métricos...
                  </div>
                )}
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time Timeline Section */}
        <Card className="lg:col-span-3 border-none shadow-2xl ring-1 ring-slate-200 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 bg-slate-900 text-white">
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
               <Activity className="h-6 w-6 text-blue-500" />
               Timeline de Auditoria
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Logs Imutáveis com Tripla Assinatura</CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
             <div className="divide-y divide-slate-100">
                {recentActivities.map((event) => (
                  <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors group">
                     <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                          event.action.includes('FRAUD') ? "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white" : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-900 group-hover:text-white"
                        )}>
                           {event.action.includes('FRAUD') ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex justify-between items-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{event.action.replace(/_/g, ' ')}</p>
                              <span className="text-[9px] font-mono font-black text-slate-400">{new Date(event.created_at).toLocaleTimeString()}</span>
                           </div>
                           <p className="text-[11px] font-bold text-slate-500 leading-tight">
                              {event.metadata?.receiverName ? `Recebido por: ${event.metadata.receiverName}` : event.entityType}
                           </p>
                           <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase">{event.metadata?.unitId || 'Sistema'}</Badge>
                              {event.metadata?.staffName && (
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">• Resp: {event.metadata.staffName}</span>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </CardContent>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
             <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900">Ver Histórico Completo de Auditoria</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
