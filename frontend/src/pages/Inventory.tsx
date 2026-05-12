import * as React from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  ArrowUpDown,
  History,
  AlertCircle,
  QrCode,
  FileText,
  FileUp,
  Trash2,
  Edit2,
  RefreshCw,
  LayoutGrid,
  List,
  MapPin,
  ArrowRightLeft,
  Package
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { Product } from '@/types';
import { productService } from '@/lib/productService';
import { ProductDialog } from '@/components/inventory/ProductDialog';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { ImportDialog } from '@/components/inventory/ImportDialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const { profile } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = React.useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');

  const fetchProducts = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const data = await productService.getAll(profile.organizationId);
      setProducts(data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await productService.delete(id);
        toast.success('Produto excluído com sucesso');
        fetchProducts();
      } catch (error) {
        toast.error('Erro ao excluir produto');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToCSV = () => {
    const headers = ['SKU', 'Nome', 'Categoria', 'Localizacao', 'Estoque', 'Minimo', 'Unidade', 'Status'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.category,
      p.location || '',
      p.currentStock,
      p.minimumStock,
      p.unitOfMeasure,
      p.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV gerado com sucesso');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredProducts.map(p => ({
      'SKU': p.sku,
      'Produto': p.name,
      'Categoria': p.category,
      'Localizacao': p.location || 'N/A',
      'Estoque Atual': p.currentStock,
      'Estoque Minimo': p.minimumStock,
      'Unidade': p.unitOfMeasure,
      'Status': p.status === 'ACTIVE' ? 'Operacional' : 'Inativo'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, `inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Planilha Excel gerada');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Inventário Meta ERP', 14, 22);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.category,
      p.location || 'N/A',
      `${p.currentStock} ${p.unitOfMeasure}`,
      p.status === 'ACTIVE' ? 'Sim' : 'Não'
    ]);

    autoTable(doc, {
      head: [['SKU', 'Produto', 'Categoria', 'Local', 'Saldo', 'Ativo']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF gerado com sucesso');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tighter text-slate-900 uppercase">Gestão de Almoxarifado</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2 mt-2 uppercase text-[10px] tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Módulo de Controle Global de Estoque e Patrimônio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchProducts()} disabled={isLoading} className="border-slate-300">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-slate-300 font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsImportDialogOpen(true)}>
            <FileUp className="h-4 w-4" /> Importar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="sm" className="gap-2 border-slate-300 font-bold uppercase text-[10px] tracking-widest text-slate-600">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50">Selecione o Formato</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToCSV} className="gap-2 uppercase text-[10px] font-bold py-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Baixar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="gap-2 uppercase text-[10px] font-bold py-3">
                <LayoutGrid className="h-3.5 w-3.5 text-slate-400" /> Baixar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="gap-2 uppercase text-[10px] font-bold py-3">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Baixar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            size="sm"
            className="gap-2 font-bold uppercase text-[10px] tracking-widest shadow-md px-6"
            onClick={() => {
              setSelectedProduct(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Procurar item no registro..." 
            className="pl-11 h-10 border-slate-200 bg-white rounded-md focus-visible:ring-primary/20 text-xs font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-1.5">
          <div className="flex bg-white border border-slate-200 rounded-md p-1 shadow-sm">
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
            <Filter className="h-4 w-4 mr-2 text-slate-400" /> Filtros
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Identificador</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Produto / SKU</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Departamento</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Localização</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Saldo Atual</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6">Status</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] h-12 px-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="px-6 py-4"><div className="h-3 w-full bg-slate-100 animate-pulse rounded-md" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                       <Package className="h-10 w-10 text-slate-200" />
                       <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum registro encontrado</p>
                       <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="font-bold uppercase text-[9px] tracking-widest text-slate-500">
                          Limpar Filtros
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50 border-slate-100 transition-colors group">
                    <TableCell className="px-6 py-4">
                       <div className="font-mono text-[10px] font-bold text-slate-600 tracking-tighter">
                          {product.sku}
                       </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800 tracking-tight">{product.name}</span>
                        {product.barcode && <span className="text-[10px] text-slate-400 font-mono mt-0.5">BAR::{product.barcode}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary" className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-2.5 py-0.5 border-none">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {product.location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">{product.minimumStock}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 -mt-1 tracking-widest">{product.unitOfMeasure || 'UN'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <div className={cn(
                         "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                         product.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                       )}>
                         <span className={cn("h-1.5 w-1.5 rounded-full", product.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-300")} />
                         {product.status === 'ACTIVE' ? 'Operacional' : 'Offline'}
                       </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsQRDialogOpen(true);
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-56 overflow-hidden">
                            <DropdownMenuLabel className="uppercase text-[9px] tracking-widest font-black opacity-50 px-4 py-2">Operações de Lote</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="gap-2 uppercase text-[9px] font-bold px-4 py-3"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsMovementDialogOpen(true);
                              }}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" /> Registrar Movimentação
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 uppercase text-[9px] font-bold px-4 py-3">
                              <History className="h-3.5 w-3.5 text-slate-400" /> Kardex Completo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 uppercase text-[9px] font-bold px-4 py-3">
                              <FileText className="h-3.5 w-3.5 text-slate-400" /> Gerar Etiqueta ZPL
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-rose-600 gap-2 uppercase text-[9px] font-bold px-4 py-3"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Deletar Registro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           {isLoading ? (
             Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 border border-slate-100 bg-slate-50/50 animate-pulse rounded-xl" />
             ))
           ) : filteredProducts.length === 0 ? (
             <div className="col-span-full h-60 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] bg-slate-50/50">
                Nenhum item encontrado no grid
             </div>
           ) : filteredProducts.map(product => (
             <Card key={product.id} className="overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col border-slate-200">
               <CardContent className="p-5 flex-1">
                 <div className="flex items-start justify-between mb-5">
                   <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-300">
                      <Package className="h-6 w-6" />
                   </div>
                   <Badge variant={product.status === 'ACTIVE' ? 'secondary' : 'outline'} className={cn(
                     "text-[8px] font-black uppercase tracking-widest border-none",
                     product.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                   )}>
                      {product.status === 'ACTIVE' ? 'Ativo' : 'Offline'}
                   </Badge>
                 </div>
                 
                 <div className="space-y-1">
                   <p className="text-[9px] font-mono font-bold tracking-tighter text-slate-400 uppercase">MOD: {product.sku}</p>
                   <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight line-clamp-1">{product.name}</h3>
                   <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {product.location || 'N/A'}
                   </div>
                 </div>
               </CardContent>

               <div className="bg-slate-50/80 p-5 border-t border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Disponível</p>
                    <p className="font-mono font-black text-xl text-slate-900 tracking-tighter leading-none mt-1">
                      {product.minimumStock}<span className="text-[10px] ml-1 text-slate-400">{product.unitOfMeasure || 'UN'}</span>
                    </p>
                 </div>
                 <div className="flex gap-1.5">
                   <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm" onClick={() => { setSelectedProduct(product); setIsMovementDialogOpen(true); }}>
                     <ArrowRightLeft className="h-4 w-4" />
                   </Button>
                   <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm" onClick={() => { setSelectedProduct(product); setIsDialogOpen(true); }}>
                     <Edit2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </Card>
           ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 border-t border-slate-200">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Sincronização Ativa • Mostrando {filteredProducts.length} de {products.length} registros industriais
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold uppercase text-[10px] tracking-widest h-9 px-4 border-slate-200 shadow-sm" disabled>Anterior</Button>
          <Button variant="outline" size="sm" className="font-bold uppercase text-[10px] tracking-widest h-9 px-4 border-slate-200 shadow-sm" disabled>Próxima</Button>
        </div>
      </div>

      <ProductDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        product={selectedProduct} 
        onSuccess={fetchProducts}
      />

      <MovementDialog 
        products={products}
        selectedProduct={selectedProduct}
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
        onSuccess={fetchProducts}
      />

      <ImportDialog 
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={fetchProducts}
      />

      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary py-4 px-6">
            <DialogTitle className="text-white font-bold uppercase text-[10px] tracking-[0.2em] text-center">Identificador Unívoco (QR)</DialogTitle>
          </div>
          <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center">
              {selectedProduct && (
                <QRCodeSVG value={selectedProduct.sku} size={180} level="H" includeMargin />
              )}
            </div>
            <div className="text-center space-y-1 w-full bg-slate-50/50 rounded-xl py-4 px-3 border border-dashed border-slate-200">
              <p className="font-black uppercase text-sm text-slate-800 tracking-tight leading-tight">{selectedProduct?.name}</p>
              <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest mt-1">{selectedProduct?.sku}</p>
            </div>
            <Button className="w-full gap-2 font-bold uppercase text-[10px] tracking-widest h-12 shadow-lg">
              <Download className="h-4 w-4" /> Exportar Asset Digital
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

