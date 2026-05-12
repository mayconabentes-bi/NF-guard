import * as React from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Package, 
  ArrowRight,
  MoreVertical,
  ChevronRight,
  User,
  History
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { UnitTransfer, Product, Unit, TransferStatus } from '@/types';
import { transferService } from '@/lib/transferService';
import { productService } from '@/lib/productService';
import { unitService } from '@/lib/unitService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Transfers() {
  const { profile, user } = useAuth();
  const [transfers, setTransfers] = React.useState<UnitTransfer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    productId: '',
    quantity: 0,
    fromUnitId: '',
    toUnitId: '',
    notes: ''
  });

  const fetchData = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const [transData, prodData, unitData] = await Promise.all([
        transferService.getAll(profile.organizationId),
        productService.getAll(profile.organizationId),
        unitService.getAll(profile.organizationId)
      ]);
      setTransfers(transData);
      setProducts(prodData);
      setUnits(unitData);
    } catch (e) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequest = async () => {
    if (!profile?.organizationId || !user) return;
    if (formData.fromUnitId === formData.toUnitId) {
      toast.error('Unidades de origem e destino devem ser diferentes');
      return;
    }

    try {
      await transferService.request({
        organizationId: profile.organizationId,
        productId: formData.productId,
        quantity: formData.quantity,
        fromUnitId: formData.fromUnitId,
        toUnitId: formData.toUnitId,
        requestedBy: user.id,
        requestedByName: profile.displayName,
        notes: formData.notes
      });
      toast.success('Solicitação de transferência enviada!');
      setIsDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error('Erro ao solicitar transferência');
    }
  };

  const handleApprove = async (id: string) => {
    if (!user || !profile) return;
    try {
      await transferService.approve(id, user.id, profile.displayName);
      toast.success('Transferência aprovada! Em transito.');
      fetchData();
    } catch (e) {
      toast.error('Erro ao aprovar');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await transferService.complete(id);
      toast.success('Transferência concluída e estoques atualizados!');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao concluir');
    }
  };

  const getStatusStyle = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING': return { icon: <Clock className="h-3 w-3" />, color: 'bg-amber-50 text-amber-700', label: 'Pendente' };
      case 'APPROVED': return { icon: <ArrowRightLeft className="h-3 w-3" />, color: 'bg-blue-50 text-blue-700', label: 'Em Trânsito' };
      case 'COMPLETED': return { icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-emerald-50 text-emerald-700', label: 'Concluído' };
      case 'REJECTED': return { icon: <XCircle className="h-3 w-3" />, color: 'bg-rose-50 text-rose-700', label: 'Recusado' };
      case 'CANCELLED': return { icon: <XCircle className="h-3 w-3" />, color: 'bg-slate-100 text-slate-700', label: 'Cancelado' };
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tighter text-slate-900 uppercase">Transferências</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-2 uppercase text-[10px] tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Movimentação Segura com Fluxo de Aprovação
          </p>
        </div>
        <Button 
          className="bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest shadow-md px-6 shadow-blue-900/20" 
          onClick={() => setIsDialogOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Solicitação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="p-6 border-slate-200 shadow-sm flex items-center justify-between rounded-xl">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Pendentes</p>
              <h3 className="text-3xl font-mono font-black text-slate-900">{transfers.filter(t => t.status === 'PENDING').length}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
         </Card>
         <Card className="p-6 border-slate-200 shadow-sm flex items-center justify-between rounded-xl">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Em Trânsito</p>
              <h3 className="text-3xl font-mono font-black text-slate-900">{transfers.filter(t => t.status === 'APPROVED').length}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
         </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por produto ou unidade..." 
            className="pl-10 h-10 border-0 bg-transparent rounded-lg focus-visible:ring-0 text-xs font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto pr-2">
          <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
             <Filter className="h-4 w-4 mr-2 text-slate-400" /> Filtros
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[180px] text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Data / Hora</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Status</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Produto</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Origem → Destino</TableHead>
              <TableHead className="text-right text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Quantidade</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Solicitante</TableHead>
              <TableHead className="text-right text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-slate-100">
                  <TableCell colSpan={7} className="h-16 px-6"><div className="h-4 bg-slate-100 animate-pulse rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : transfers.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-48 text-center text-slate-400">
                   <div className="flex flex-col items-center justify-center space-y-3">
                     <ArrowRightLeft className="h-8 w-8 text-slate-200" />
                     <span className="font-bold uppercase text-[10px] tracking-widest">Nenhuma transferência registrada.</span>
                   </div>
                 </TableCell>
               </TableRow>
            ) : (
              transfers.map(transfer => {
                const product = products.find(p => p.id === transfer.productId);
                const fromUnit = units.find(u => u.id === transfer.fromUnitId);
                const toUnit = units.find(u => u.id === transfer.toUnitId);
                const style = getStatusStyle(transfer.status);

                return (
                  <TableRow key={transfer.id} className="group hover:bg-slate-50 border-slate-100 transition-colors">
                    <TableCell className="px-6 py-4">
                       <p className="text-xs font-bold text-slate-900 tracking-tight">{new Date(transfer.requestedAt).toLocaleDateString()}</p>
                       <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(transfer.requestedAt).toLocaleTimeString()}</p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border-none ${style.color}`}>
                          {style.icon} {style.label}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                             <Package className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-900 tracking-tight">{product?.name}</span>
                             <span className="text-[10px] text-slate-400 font-mono mt-0.5">{product?.sku}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-500 uppercase tracking-tight">{fromUnit?.name || transfer.fromUnitId}</span>
                          <ChevronRight className="h-3 w-3 text-slate-300" />
                          <span className="font-bold text-blue-600 uppercase tracking-tight">{toUnit?.name || transfer.toUnitId}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4 font-mono font-black text-sm text-slate-900">
                       {transfer.quantity}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                          <User className="h-3.5 w-3.5" />
                          {transfer.requestedByName}
                       </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                       <DropdownMenu>
                         <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100">
                               <MoreVertical className="h-4 w-4" />
                            </Button>
                         } />
                         <DropdownMenuContent align="end" className="w-56 overflow-hidden">
                            {transfer.status === 'PENDING' && (
                              <DropdownMenuItem className="gap-2 text-blue-600 font-bold uppercase text-[10px] tracking-widest py-3 px-4" onClick={() => handleApprove(transfer.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar Saída
                              </DropdownMenuItem>
                            )}
                            {transfer.status === 'APPROVED' && (
                              <DropdownMenuItem className="gap-2 text-emerald-600 font-bold uppercase text-[10px] tracking-widest py-3 px-4" onClick={() => handleComplete(transfer.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar Recebimento
                              </DropdownMenuItem>
                            )}
                            {transfer.status === 'PENDING' && (
                              <DropdownMenuItem className="gap-2 text-rose-600 font-bold uppercase text-[10px] tracking-widest py-3 px-4">
                                <XCircle className="h-3.5 w-3.5" /> Recusar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 font-bold uppercase text-[10px] tracking-widest py-3 px-4">
                               <History className="h-3.5 w-3.5 text-slate-400" /> Ver Log Completo
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogHeader className="bg-slate-900 p-6">
               <DialogTitle className="text-white font-bold uppercase tracking-[0.2em] text-sm">Solicitar Transferência</DialogTitle>
               <DialogDescription className="text-slate-400 mt-2">Mova produtos entre unidades operacionais para equilibrar o inventário.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-white">
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Produto</Label>
                  <Select value={formData.productId} onValueChange={(val) => setFormData({...formData, productId: val})}>
                     <SelectTrigger className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
                     <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="font-mono text-slate-400 mr-2">[{p.sku}]</span>
                            <span className="font-bold">{p.name}</span>
                          </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unidade Origem</Label>
                     <Select value={formData.fromUnitId} onValueChange={(val) => setFormData({...formData, fromUnitId: val})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Saindo de..." /></SelectTrigger>
                        <SelectContent>
                           {units.map(u => (
                             <SelectItem key={u.id} value={u.id} className="font-bold uppercase tracking-tighter">{u.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unidade Destino</Label>
                     <Select value={formData.toUnitId} onValueChange={(val) => setFormData({...formData, toUnitId: val})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-medium"><SelectValue placeholder="Indo para..." /></SelectTrigger>
                        <SelectContent>
                           {units.map(u => (
                             <SelectItem key={u.id} value={u.id} className="font-bold uppercase tracking-tighter">{u.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label htmlFor="trans-qty" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quantidade a Transferir</Label>
                  <Input 
                    id="trans-qty" 
                    type="number" 
                    className="h-12 bg-slate-50 border-slate-200 transition-all font-mono font-black text-lg text-slate-900"
                    value={formData.quantity} 
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} 
                  />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="trans-notes" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Justificativa / OS</Label>
                  <Input 
                    id="trans-notes" 
                    placeholder="Ex: OS-2024-55 Reposição" 
                    className="h-12 bg-slate-50 border-slate-200 transition-all font-medium"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
               </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <Button variant="ghost" className="font-bold uppercase text-[10px] tracking-widest text-slate-500 hover:text-slate-900" onClick={() => setIsDialogOpen(false)}>Cancelar Operação</Button>
               <Button className="bg-blue-600 text-white hover:bg-blue-700 font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20" onClick={handleRequest}>Enviar Solicitação</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
