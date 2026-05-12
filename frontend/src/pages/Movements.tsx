import * as React from 'react';
import { 
  ArrowUpDown, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCcw, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Package,
  History as HistoryIcon,
  User,
  Plus
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
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { Movement, Product } from '@/types';
import { movementService } from '@/lib/movementService';
import { productService } from '@/lib/productService';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { toast } from 'sonner';

export default function Movements() {
  const { profile } = useAuth();
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const [movData, prodData] = await Promise.all([
        movementService.getRecent(profile.organizationId),
        productService.getAll(profile.organizationId)
      ]);
      setMovements(movData);
      setProducts(prodData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMovements = movements.filter(m => {
    const product = products.find(p => p.id === m.productId);
    const searchStr = `${product?.name} ${product?.sku} ${m.documentNumber} ${m.userName}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'IN': return { icon: <ArrowDownLeft className="h-4 w-4 text-emerald-600" />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Entrada' };
      case 'OUT': return { icon: <ArrowUpRight className="h-4 w-4 text-rose-600" />, color: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Saída' };
      case 'TRANSFER': return { icon: <ArrowUpDown className="h-4 w-4 text-blue-600" />, color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Transferência' };
      case 'ADJUSTMENT': return { icon: <RefreshCcw className="h-4 w-4 text-amber-600" />, color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Ajuste' };
      default: return { icon: <ArrowUpDown className="h-4 w-4 text-slate-600" />, color: 'text-slate-700 bg-slate-50 border-slate-200', label: 'Outro' };
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tighter text-slate-900 uppercase">Histórico de Movimentações</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-2 uppercase text-[10px] tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Auditoria Completa de Fluxos e Registro de Kardex
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest bg-white shadow-sm" size="sm">
            <Download className="h-4 w-4 mr-2" /> Exportar Auditoria
          </Button>
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest shadow-md px-6 shadow-blue-900/20" 
            onClick={() => setIsDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Operação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border text-center md:text-left border-slate-200 p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Entradas (Mês)</p>
          <h3 className="text-3xl font-mono font-black text-slate-900 tracking-tighter">R$ 45.240<span className="text-lg text-slate-400">,00</span></h3>
        </div>
        <div className="bg-white border text-center md:text-left border-slate-200 p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Saídas (Mês)</p>
          <h3 className="text-3xl font-mono font-black text-slate-900 tracking-tighter">R$ 12.890<span className="text-lg text-slate-400">,00</span></h3>
        </div>
        <div className="bg-white border text-center md:text-left border-slate-200 p-6 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Transferências</p>
          <h3 className="text-3xl font-mono font-black text-slate-900 tracking-tighter">128</h3>
        </div>
        <div className="bg-white border text-center md:text-left border-slate-200 p-6 rounded-xl shadow-sm flex flex-col items-center md:items-start">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Acuracidade</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-mono font-black text-emerald-600 tracking-tighter">98.4%</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+1.2%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Documento, Produto ou Operador..." 
            className="pl-10 h-10 border-0 bg-transparent rounded-lg focus-visible:ring-0 text-xs font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto pr-2">
          <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
            <Calendar className="h-4 w-4 mr-2 text-slate-400" /> Período
          </Button>
          <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
            <Filter className="h-4 w-4 mr-2 text-slate-400" /> Filtros
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[180px] text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Data / Hora</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Tipo</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Produto</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Documento</TableHead>
              <TableHead className="text-right text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Quantidade</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Origem/Destino</TableHead>
              <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Operador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-slate-100">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j} className="px-6"><div className="h-4 w-full bg-slate-100 animate-pulse rounded-md" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                   <div className="flex flex-col items-center justify-center space-y-3">
                     <HistoryIcon className="h-8 w-8 text-slate-200" />
                     <span>Nenhuma movimentação registrada no log de sistema.</span>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((mov) => {
                const product = products.find(p => p.id === mov.productId);
                const style = getTypeStyle(mov.type);
                
                return (
                  <TableRow key={mov.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 tracking-tight">{new Date(mov.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(mov.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <Badge variant="outline" className={cn(
                         "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border-none",
                         style.color
                       )}>
                          {style.icon}
                          {style.label}
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
                       <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase">
                          <HistoryIcon className="h-3.5 w-3.5 text-slate-400" />
                          {mov.documentNumber || 'INTERNAL'}
                       </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                       <div className={cn(
                         "font-mono font-black text-sm tabular-nums",
                         mov.type === 'OUT' ? 'text-rose-600' : 
                         mov.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'
                       )}>
                         {mov.type === 'OUT' ? '-' : '+'}{mov.quantity}
                       </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <Badge variant="secondary" className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border-none hover:bg-slate-200">
                         MOD-{mov.unitId}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                          <User className="h-3.5 w-3.5" />
                          {mov.userName || 'SYSTEM'}
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MovementDialog 
        products={products}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
