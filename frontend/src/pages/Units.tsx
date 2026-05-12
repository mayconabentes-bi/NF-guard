import * as React from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  MoreVertical, 
  Search, 
  Warehouse,
  ShoppingBag,
  ArrowRightLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Activity,
  ShieldCheck,
  Users,
  Box,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { Unit } from '@/types';
import { unitService } from '@/lib/unitService';
import { wmsService } from '@/lib/wmsService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function Units() {
  const { profile, currentUnit } = useAuth();
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    isMain: false
  });

  const fetchUnits = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const data = await unitService.getAll(profile.organizationId);
      setUnits(data);
    } catch (e) {
      toast.error('Erro ao carregar unidades');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSubmit = async () => {
    if (!profile?.organizationId) return;
    try {
      if (selectedUnit) {
        await unitService.update(selectedUnit.id, formData);
        toast.success('Unidade atualizada');
      } else {
        await unitService.create({
          ...formData,
          organizationId: profile.organizationId,
          isMain: formData.isMain
        });
        toast.success('Unidade criada');
      }
      setIsDialogOpen(false);
      fetchUnits();
    } catch (e) {
      toast.error('Erro ao salvar unidade');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir esta unidade? Isso pode afetar a rastreabilidade histórica.')) {
      try {
        await unitService.delete(id);
        toast.success('Unidade excluída');
        fetchUnits();
      } catch (e) {
        toast.error('Erro ao excluir');
      }
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3">Arquitetura Multiunidade</Badge>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
             <Building2 className="h-10 w-10 text-blue-600" />
             Unidades Logísticas
          </h1>
          <p className="text-slate-500 font-medium italic">Gestão de pontos de venda, galpões de distribuição e hubs industriais.</p>
        </div>
        <Button 
          className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all" 
          onClick={() => { setSelectedUnit(null); setFormData({name: '', address: '', isMain: false}); setIsDialogOpen(true); }}
        >
          <Plus className="h-5 w-5 mr-2 stroke-[3]" /> Nova Unidade
        </Button>
      </div>

      {/* Grid de KPIs Consolidados */}
      <div className="grid gap-6 md:grid-cols-4">
         {[
           { label: 'Unidades Ativas', value: units.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Ocupação Média', value: '78%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Volume Mensal', value: '2.4k', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Alertas Ativos', value: '02', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar unidade..." 
          className="pl-12 h-12 bg-white border-none rounded-2xl shadow-inner text-sm font-bold ring-1 ring-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]" />
          ))
        ) : filteredUnits.length === 0 ? (
          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center p-12">
            <Building2 className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhuma unidade operacional</h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2">Inicie a expansão logística cadastrando seu primeiro ponto de distribuição.</p>
          </div>
        ) : (
          filteredUnits.map(unit => (
            <Card key={unit.id} className={cn(
              "border-none shadow-xl transition-all group relative rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-200 hover:ring-blue-400",
              currentUnit?.id === unit.id && "ring-2 ring-blue-600 shadow-blue-900/10"
            )}>
               <CardHeader className="p-8 pb-4">
                 <div className="flex items-start justify-between">
                    <div className={cn(
                      "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                      unit.name.toLowerCase().includes('loja') ? "bg-emerald-100 text-emerald-600 shadow-emerald-200" : "bg-blue-100 text-blue-600 shadow-blue-200"
                    )}>
                       {unit.name.toLowerCase().includes('loja') ? <ShoppingBag className="h-8 w-8" /> : <Warehouse className="h-8 w-8" />}
                    </div>
                    <div className="flex items-center gap-2">
                       {currentUnit?.id === unit.id && <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase">Ativa Agora</Badge>}
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <div 
                             role="button" 
                             className="h-10 w-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                           >
                             <MoreVertical className="h-5 w-5" />
                           </div>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                           <DropdownMenuItem className="h-12 rounded-xl gap-3 font-black uppercase text-[10px] tracking-widest text-slate-600 cursor-pointer" onClick={() => { setSelectedUnit(unit); setFormData({name: unit.name, address: unit.address, isMain: unit.isMain || false}); setIsDialogOpen(true); }}>
                             <Edit2 className="h-4 w-4" /> Editar Configurações
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="h-12 rounded-xl gap-3 text-rose-600 font-black uppercase text-[10px] tracking-widest cursor-pointer" onClick={() => handleDelete(unit.id)}>
                             <Trash2 className="h-4 w-4" /> Desativar Unidade
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                 </div>
                 <div className="mt-6 space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{unit.name}</h3>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tight">
                      <MapPin className="h-3.5 w-3.5" /> {unit.address || 'Localização não definida'}
                    </p>
                 </div>
               </CardHeader>
               <CardContent className="p-8 pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integridade</span>
                       <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-black text-slate-900">MÁXIMA</span>
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Processamento</span>
                       <div className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs font-black text-slate-900">ESTÁVEL</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                             <Users className="h-4 w-4 text-slate-400" />
                          </div>
                        ))}
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">+5</div>
                     </div>
                     <Button variant="ghost" className="text-blue-600 font-black uppercase text-[10px] tracking-widest h-10 px-4 hover:bg-blue-50 rounded-xl">
                       Audit Log <ChevronRight className="h-4 w-4 ml-1" />
                     </Button>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
           <div className="bg-slate-900 p-8 text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-500" />
                {selectedUnit ? 'Configurar Unidade' : 'Nova Unidade Logística'}
              </DialogTitle>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Nexus ERP Core Architecture</p>
           </div>
           <div className="p-8 space-y-6 bg-white">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Identificação da Unidade</Label>
                 <Input 
                  placeholder="Ex: Galpão Central, Loja Copacabana" 
                  className="h-14 bg-slate-100 border-none rounded-2xl text-lg font-black px-6"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Endereço Operacional</Label>
                 <Input 
                  placeholder="Endereço, Cidade - UF" 
                  className="h-14 bg-slate-100 border-none rounded-2xl text-sm font-bold px-6"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                 />
              </div>
           </div>
           <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
              <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-sm tracking-widest rounded-2xl shadow-xl shadow-blue-200" onClick={handleSubmit}>
                 Sincronizar e Salvar Unidade
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
