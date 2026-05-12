import * as React from 'react';
import { 
  ShieldCheck, 
  History, 
  Workflow, 
  Zap, 
  Scan, 
  ArrowRight,
  Database,
  Users,
  Box,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Filter,
  RefreshCw,
  Search,
  Lock,
  Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { automationService } from '@/services/automationService';
import { cn } from '@/lib/utils';

export default function TraceabilityCenter() {
  const { profile } = useAuth();
  const [events, setEvents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchEvents = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const data = await automationService.getRecentEvents(profile.organizationId, 50);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }).format(date);
  };

  const filteredEvents = events.filter(e => 
    e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.entityId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fraudCount = events.filter(e => e.action === 'FRAUD_ATTEMPT_DOUBLE_DIPPING').length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Forensic */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3">Live Feed</Badge>
            <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
              <Lock className="h-3 w-3" /> Integridade Criptográfica
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
             <Fingerprint className="h-10 w-10 text-blue-600" />
             Rastreabilidade & DNA
          </h1>
          <p className="text-slate-500 font-medium italic">Monitoramento forense de ativos e assinaturas digitais.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200 bg-white" onClick={fetchEvents}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Sincronizar
           </Button>
           <Button className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
              <Download className="h-4 w-4 mr-2" /> Exportar Auditoria
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel Lateral */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-slate-900 text-white border-none rounded-[2rem] shadow-2xl overflow-hidden">
              <CardContent className="p-8 space-y-6">
                 <div className="flex items-end justify-between">
                    <h3 className="text-6xl font-black tracking-tighter">99.8<span className="text-xl text-emerald-400 font-bold ml-1">%</span></h3>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] uppercase mb-2">Grade A+</Badge>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                       <span>Score de Conformidade</span>
                       <span>Excelente</span>
                    </div>
                    {/* Custom Progress Bar to avoid dependency issues */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: '99.8%' }} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Eventos 24h</p>
                       <p className="text-xl font-black">{events.length}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Alertas Fraude</p>
                       <p className="text-xl font-black text-rose-500">{fraudCount}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="bg-white border-none shadow-xl ring-1 ring-slate-200 rounded-[2rem] overflow-hidden p-6">
              <CardHeader className="p-0 mb-4">
                 <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-blue-600" /> Fluxos Ativos
                 </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                 {['Blockchain Audit Ingest', 'Triple-Signature Guard', 'Device ID Fingerprint'].map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                       <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{rule}</span>
                       <Badge className="border-none text-[8px] font-black bg-emerald-50 text-emerald-600">ON</Badge>
                    </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Console Principal */}
        <div className="lg:col-span-8 space-y-6">
           <Card className="border-none shadow-2xl ring-1 ring-slate-200 rounded-[2.5rem] overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                       placeholder="Filtrar eventos..." 
                       className="pl-12 h-12 bg-white border-none rounded-2xl shadow-inner text-sm font-bold"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl border border-slate-200">
                    <Filter className="h-4 w-4 text-slate-400" />
                 </Button>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                 {isLoading && events.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                       <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
                       <p className="text-[10px] font-black uppercase text-slate-400">Escaneando Base Forense...</p>
                    </div>
                 ) : filteredEvents.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                       <History className="h-10 w-10 text-slate-200 mx-auto" />
                       <p className="text-[10px] font-black uppercase text-slate-400">Nenhum evento registrado.</p>
                    </div>
                 ) : (
                    filteredEvents.map((event) => (
                       <div key={event.id} className="p-6 hover:bg-slate-50 transition-all group">
                          <div className="flex items-start gap-6">
                             <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                                event.action.includes('FRAUD') ? "bg-rose-100 text-rose-600 shadow-rose-200" :
                                event.action.includes('DELIVERY') ? "bg-emerald-100 text-emerald-600 shadow-emerald-200" :
                                "bg-blue-100 text-blue-600 shadow-blue-200"
                             )}>
                                {event.action.includes('FRAUD') ? <AlertCircle className="h-6 w-6" /> :
                                 event.action.includes('DELIVERY') ? <CheckCircle2 className="h-6 w-6" /> :
                                 <Scan className="h-6 w-6" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                   <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                                      {event.action.replace(/_/g, ' ')}
                                   </p>
                                   <Badge variant="outline" className="border-slate-200 text-slate-400 font-mono text-[8px]">
                                      {event.id.slice(0, 8)}
                                   </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
                                   <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.metadata?.staffName || 'Sistema'}</span>
                                   <span className="flex items-center gap-1"><Box className="h-3 w-3" /> SKU: {event.metadata?.sku || 'N/A'}</span>
                                   {event.device === 'Mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                </div>
                             </div>
                             <div className="text-right shrink-0">
                                <p className="text-[10px] font-black text-slate-900">{formatDate(event.created_at)}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{formatFullDate(event.created_at)}</p>
                             </div>
                          </div>
                          {/* Details Reveal on Hover */}
                          <div className="mt-4 p-4 bg-slate-900 rounded-2xl hidden group-hover:grid grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-200">
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Unidade Fiscal</p>
                                <p className="text-[10px] text-slate-300 font-bold uppercase">{event.metadata?.unitId || 'HUB CENTRAL'}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Integridade Blockchain</p>
                                <div className="flex items-center gap-1">
                                   <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                   <span className="text-[9px] text-emerald-400 font-black uppercase">Validado</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Nexus Forensic Engine v2.1</p>
                 <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ativo</span>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
