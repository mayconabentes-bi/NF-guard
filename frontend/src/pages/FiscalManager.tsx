import * as React from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Download,
  Eye,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileCode,
  PackageCheck,
  RefreshCw,
  Lock,
  ArrowRightLeft,
  ScanText,
  Boxes,
  Warehouse,
  Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/domains/auth/contexts/TenantContext";
import { FiscalNote, Product } from '@/types';
import { fiscalService } from '@/lib/fiscalService';
import { productService } from '@/lib/productService';
import { wmsService } from '@/lib/wmsService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { ingestFiscalXmlUseCase } from '@/domains/fiscal/useCases/IngestFiscalXmlUseCase';

export default function FiscalManager() {
  const { profile } = useAuth();
  const { currentUnit } = useTenant();
  const [notes, setNotes] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<any | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const data = await wmsService.listActiveXMLs(profile.organizationId);
      console.log('Notes loaded from service:', data);
      setNotes(data);
    } catch (e) {
      toast.error('Erro ao acessar base fiscal');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.organizationId || !profile?.id) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlText = event.target?.result as string;
        
        // Delega o processamento pesado e regras de validação para o Domínio
        await ingestFiscalXmlUseCase.execute({
          xmlText,
          organizationId: profile.organizationId,
          userId: profile.id,
          unitId: currentUnit?.id || ''
        });

        toast.success('Nota Fiscal Protocolada e Distribuída!');
        setIsImportOpen(false);
        fetchData();
      } catch (error: any) {
        console.error("Erro na ingestão:", error);
        toast.error(error.message || 'XML Inválido ou Assinatura Corrompida.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Banner de Aviso de Modo de Simulação (Feedback de Erro 42501) */}
      {!supabase && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Modo de Simulação Ativo</p>
            <p className="text-xs font-bold text-amber-700/80 uppercase tracking-widest mt-0.5">
              Conexão com banco de dados indisponível ou permissão negada (RLS). Os dados serão salvos localmente nesta sessão.
            </p>
          </div>
        </div>
      )}

      {/* Header Industrial Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/60 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-950 text-white border-none font-black text-[9px] px-3 py-1 uppercase tracking-[0.2em] shadow-lg shadow-slate-200">Protocolo SEFAZ v4.0</Badge>
            <div className="h-1 text-slate-300" />
            <Badge className="bg-blue-50/80 backdrop-blur-sm text-blue-600 border border-blue-100 font-black text-[9px] px-3 py-1 uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="h-3 w-3" /> Auditado em Tempo Real
            </Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-slate-950 uppercase flex items-center gap-4">
               <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
                <ScanText className="h-8 w-8 text-white" />
               </div>
               Estação Fiscal
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg tracking-tight leading-relaxed">
              Portal de conformidade para ingestão de notas fiscais e geração de <span className="text-blue-600 font-bold">tokens imutáveis</span> de retirada.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="h-14 px-8 font-black uppercase text-[11px] tracking-[0.15em] border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-95" onClick={fetchData}>
              <RefreshCw className={cn("h-4 w-4 mr-2.5", isLoading && "animate-spin")} /> Atualizar Base
           </Button>
           <Button className="h-14 px-10 bg-slate-950 hover:bg-blue-600 text-white font-black uppercase text-[11px] tracking-[0.15em] rounded-2xl shadow-2xl shadow-slate-200 transition-all active:scale-95" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2.5" /> Protocolar Novo XML
           </Button>
        </div>
      </div>

      {/* Grid de Métricas de Conformidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl transition-all hover:translate-y-[-4px]">
            <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-700">
               <FileCode className="h-40 w-40 text-white" />
            </div>
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Notas Protocoladas</p>
               </div>
               <h3 className="text-6xl font-black tracking-tighter leading-none text-white">{notes.length}</h3>
               <div className="inline-flex items-center gap-2.5 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% de Integridade Digital
               </div>
            </div>
         </div>

         <div className="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl border border-slate-100 transition-all hover:translate-y-[-4px] hover:shadow-2xl">
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Movimentação WMS</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Boxes className="h-6 w-6" />
                  </div>
               </div>
               <h3 className="text-6xl font-black tracking-tighter leading-none text-slate-950">
                  {notes.reduce((acc, n) => acc + (n.tokens?.length || 0), 0)}
               </h3>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" /> Tokens Gerados para Retirada
               </p>
            </div>
         </div>

         <div className="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl border border-slate-100 transition-all hover:translate-y-[-4px] hover:shadow-2xl">
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Segurança Logística</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    <Lock className="h-6 w-6" />
                  </div>
               </div>
               <h3 className="text-6xl font-black tracking-tighter leading-none text-slate-950">
                  {notes.filter(n => n.tokens?.every((t:any) => t.status === 'DELIVERED')).length}
               </h3>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> NF-es Totalmente Liquidadas
               </p>
            </div>
         </div>
      </div>

      {/* Tabela de Auditoria Fiscal */}
      <Card className="border-none shadow-2xl ring-1 ring-slate-200/60 rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl">
         <div className="p-10 bg-slate-50/50 border-b border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-xl">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <Input 
                  placeholder="Pesquisar por Chave, NF-e ou Fornecedor..." 
                  className="pl-14 h-16 bg-white border-none rounded-[1.25rem] shadow-sm ring-1 ring-slate-100 text-base font-bold placeholder:text-slate-300 transition-all focus:ring-blue-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-4">
               <Button variant="ghost" className="h-12 px-6 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50">
                Filtros Avançados
               </Button>
            </div>
         </div>
         <div className="overflow-x-auto">
           <Table>
              <TableHeader className="bg-slate-950 text-white h-20">
                 <TableRow className="hover:bg-slate-950 border-none">
                    <TableHead className="pl-10 font-black uppercase text-[11px] tracking-[0.2em] text-slate-400">Status / NF-e</TableHead>
                    <TableHead className="font-black uppercase text-[11px] tracking-[0.2em] text-slate-400">Identificação SEFAZ</TableHead>
                    <TableHead className="font-black uppercase text-[11px] tracking-[0.2em] text-slate-400">Chave de Acesso</TableHead>
                    <TableHead className="font-black uppercase text-[11px] tracking-[0.2em] text-slate-400">Total Fiscal</TableHead>
                    <TableHead className="text-right pr-10 font-black uppercase text-[11px] tracking-[0.2em] text-slate-400">Ações</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {notes
                  .filter(note => 
                    !searchTerm || 
                    note.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    note.issuer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    note.access_key?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((note) => (
                    <TableRow key={note.id} className="h-28 hover:bg-slate-50/80 transition-all border-slate-100/60 group">
                       <TableCell className="pl-10">
                          <div className="flex items-center gap-5">
                             <div className={cn(
                               "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                               note.tokens?.every((t:any) => t.status === 'DELIVERED') ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                             )}>
                                {note.tokens?.every((t:any) => t.status === 'DELIVERED') ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                             </div>
                             <div className="space-y-1">
                                <p className="text-lg font-black text-slate-950 tracking-tighter leading-none">Nº {note.number}</p>
                                <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] px-2 uppercase tracking-widest">SÉRIE 001</Badge>
                             </div>
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="space-y-1">
                             <p className="text-sm font-black text-slate-700 truncate max-w-[240px] uppercase tracking-tight">{note.issuer}</p>
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Emitente Validado
                             </div>
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-mono font-bold text-slate-500 tracking-tighter bg-slate-50 p-2 rounded-lg inline-block border border-slate-100">
                               {note.access_key.slice(0, 4)} {note.access_key.slice(4, 8)} ... {note.access_key.slice(-4)}
                            </p>
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-1">
                              <FileCode className="h-3 w-3" /> Digest: {note.digest_value?.slice(0, 8)}...
                            </p>
                          </div>
                       </TableCell>
                       <TableCell>
                          <p className="text-xl font-black text-slate-950 tracking-tighter">R$ {note.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       </TableCell>
                       <TableCell className="text-right pr-10">
                          <Button 
                            variant="outline" 
                            className="h-12 px-6 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95"
                            onClick={() => setSelectedNote(note)}
                          >
                             <Eye className="h-4 w-4 mr-2" /> Detalhes
                          </Button>
                       </TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>
         </div>
      </Card>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-xl sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-[3rem]">
           <div className="bg-slate-950 p-12 text-white relative">
              <div className="relative z-10 space-y-4">
                <Badge className="bg-blue-600 border-none text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5">Injestão de Ativos</Badge>
                <DialogTitle className="text-4xl font-black uppercase tracking-tighter leading-none">Protocolar NF-e</DialogTitle>
              </div>
           </div>
           <div className="p-12 space-y-10 bg-white">
              <div className="py-20 border-[3px] border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer relative group">
                 <input type="file" accept=".xml" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                 <Upload className="h-10 w-10 text-blue-600 mb-4" />
                 <p className="text-lg font-black uppercase text-slate-800 tracking-tighter">Upload de Arquivo XML</p>
              </div>
           </div>
           <DialogFooter className="p-10 bg-slate-50/50 border-t border-slate-100">
              <Button variant="ghost" className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Detail Industrial - Lado a Lado (Colunas) */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
           {/* Header do Modal (Fixo no topo) */}
           <div className="shrink-0 bg-slate-950 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-4">
                 <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-[0.4em] px-3 py-1.5 rounded-full">Auditoria de Protocolo</Badge>
                 <div className="space-y-1">
                    <DialogTitle className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">NF-e: {selectedNote?.number}</DialogTitle>
                    <p className="text-slate-400 font-mono text-[10px] md:text-[11px] bg-white/5 border border-white/10 px-3 py-1 rounded-md inline-block tracking-[0.1em]">
                      CHAVE: {selectedNote?.access_key}
                    </p>
                 </div>
              </div>
              <div className="relative z-10 text-left md:text-right space-y-1">
                 <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Processado</p>
                 <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                   <span className="text-blue-500 text-xl md:text-2xl mr-1">R$</span>
                   {selectedNote?.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
              </div>
           </div>

           {/* Corpo da Auditoria (Com Scroll Independente) */}
           <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col p-6 md:p-8 gap-6">
              
              {/* Linha Horizontal: Dados do Emitente (Compacto) */}
              <div className="shrink-0 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
                 <div className="space-y-1 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Emitente</p>
                    <p className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight line-clamp-1">{selectedNote?.issuer}</p>
                 </div>
                 <div className="flex flex-wrap gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-3">
                       <div className="hidden sm:block p-1.5 bg-white rounded-md shadow-sm text-slate-400"><FileText className="h-4 w-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CNPJ</p>
                         <p className="text-xs font-black text-slate-800">{selectedNote?.issuer_cnpj || '00.000.000/0001-00'}</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-3">
                       <div className="hidden sm:block p-1.5 bg-white rounded-md shadow-sm text-slate-400"><Clock className="h-4 w-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Emissão</p>
                         <p className="text-xs font-black text-slate-800">{new Date(selectedNote?.created_at).toLocaleDateString('pt-BR')}</p>
                       </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-3">
                       <div className="hidden sm:block p-1.5 bg-white rounded-md shadow-sm text-emerald-600"><ShieldCheck className="h-4 w-4" /></div>
                       <div>
                         <p className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">Hash SEFAZ</p>
                         <p className="text-[9px] md:text-[10px] font-mono font-bold text-emerald-600 truncate w-[100px] md:w-[150px]">{selectedNote?.digest_value}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Tabela de Itens (100% de Largura) */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                 <div className="shrink-0 p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Itens e Status de Distribuição</h4>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-black text-[9px] px-3 py-1 uppercase tracking-widest">
                      {selectedNote?.tokens?.length || 0} Ativos
                    </Badge>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    <Table className="w-full border-collapse">
                       <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                          <TableRow className="border-slate-100">
                             <TableHead className="pl-6 font-black text-[9px] uppercase tracking-widest text-slate-400 h-10 bg-white">SKU / Produto</TableHead>
                             <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400 h-10 bg-white">Qtd</TableHead>
                             <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400 h-10 bg-white">Status</TableHead>
                             <TableHead className="pr-6 font-black text-[9px] uppercase tracking-widest text-slate-400 h-10 bg-white">Roteamento</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {selectedNote?.tokens?.map((token: any, idx: number) => (
                             <TableRow key={idx} className="h-12 border-slate-100/60 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="pl-6">
                                   <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{token.sku}</span>
                                </TableCell>
                                <TableCell className="text-center font-black text-slate-900 text-sm">{token.quantity}</TableCell>
                                <TableCell>
                                   {token.status === 'DELIVERED' ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">LIQUIDADO</Badge>
                                   ) : (
                                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">DISPONÍVEL</Badge>
                                   )}
                                </TableCell>
                                <TableCell className="pr-6">
                                   <div className={cn(
                                     "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[8px] font-black uppercase tracking-widest",
                                     token.is_heavy ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-orange-50 border-orange-200 text-orange-600"
                                   )}>
                                      {token.is_heavy ? <Warehouse className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                                      {token.is_heavy ? 'Galpão' : 'Loja'}
                                   </div>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </div>
              </div>
           </div>
           
           {/* Footer Fixo (Holy Grail Layout) com Botão Acessível */}
           <div className="shrink-0 p-6 md:p-8 bg-white border-t border-slate-200 mt-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
              <Button 
                className="w-full min-h-[3.5rem] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-sm tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all focus:ring-4 focus:ring-blue-500/30" 
                onClick={() => setSelectedNote(null)}
              >
                Encerrar Auditoria e Liberar Carga
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
