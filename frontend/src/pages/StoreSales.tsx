import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { wmsService } from '@/lib/wmsService';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Store, 
  FileUp, 
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  QrCode,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NFItem {
  sku: string;
  name: string;
  qty: number;
  uom: string;
  isDelivered: boolean;
}

export default function StoreSales() {
  const { profile, currentUnit } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [nfData, setNfData] = React.useState<{
    accessKey: string;
    number: string;
    items: NFItem[];
  } | null>(null);
  const [showSignatureModal, setShowSignatureModal] = React.useState(false);
  const [receiverName, setReceiverName] = React.useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseXML(file);
  };

  const parseXML = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const chNFe = xmlDoc.getElementsByTagName("chNFe")[0]?.textContent || "";
      const nNF = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "";
      const detTags = xmlDoc.getElementsByTagName("det");
      const items: NFItem[] = [];

      for (let i = 0; i < detTags.length; i++) {
        const prod = detTags[i].getElementsByTagName("prod")[0];
        items.push({
          sku: prod.getElementsByTagName("cProd")[0]?.textContent || "",
          name: prod.getElementsByTagName("xProd")[0]?.textContent || "",
          qty: parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0"),
          uom: prod.getElementsByTagName("uCom")[0]?.textContent || "",
          isDelivered: false
        });
      }

      setNfData({ accessKey: chNFe, number: nNF, items });
      toast.success("XML Processado!");
    } catch (error) {
      toast.error("Erro no XML");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemDelivery = (sku: string) => {
    if (!nfData) return;
    setNfData({
      ...nfData,
      items: nfData.items.map(item => 
        item.sku === sku ? { ...item, isDelivered: !item.isDelivered } : item
      )
    });
  };

  const handleConfirmDelivery = async () => {
    if (!receiverName || !nfData || !profile?.organizationId) return;
    setLoading(true);
    try {
      const xmlId = await wmsService.ingestXML({
        accessKey: nfData.accessKey,
        number: nfData.number,
        items: nfData.items.map(item => ({
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          uom: item.uom,
          isHeavy: !item.isDelivered 
        })),
        date: new Date().toISOString(),
        issuer: "NFe Emitida",
        total: 0
      }, profile.organizationId, profile.id, currentUnit?.id || '');

      const tokens = await wmsService.getTokensByXML(xmlId);
      for (const item of nfData.items) {
        if (item.isDelivered) {
          const token = tokens.find(t => t.sku === item.sku);
          if (token) {
            await wmsService.executeDelivery(token.id, profile.id, currentUnit?.id || 'STORE_UNIT', receiverName, profile.fullName);
          }
        }
      }

      toast.success("Venda processada!");
      setNfData(null);
      setShowSignatureModal(false);
      setReceiverName('');
    } catch (error) {
      toast.error("Erro ao processar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase flex items-center gap-3 tracking-tighter">
          <Store className="h-8 w-8 text-blue-600" />
          Checkout de Venda
        </h1>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Nexus ERP - Terminal de Saída</p>
      </div>

      {!nfData ? (
        <Card className="border-dashed border-2 p-20 text-center bg-slate-50/50 rounded-[2rem] hover:bg-white hover:border-blue-400 transition-all cursor-pointer">
          <label className="cursor-pointer">
            <FileUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="font-black uppercase tracking-tight">Importar XML da Nota Fiscal</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">NF-e 4.0 Protegida</p>
            <input type="file" className="hidden" accept=".xml" onChange={handleFileUpload} />
          </label>
        </Card>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-[2.5rem] border-none shadow-2xl ring-1 ring-slate-200 overflow-hidden">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                        <ClipboardList className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sincronização Logística</p>
                        <p className="font-black text-2xl tracking-tighter uppercase">NF: {nfData.number}</p>
                     </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setNfData(null)} className="text-white border-white/20 bg-transparent hover:bg-white/10 h-12 px-8 uppercase text-[10px] font-black tracking-widest rounded-xl">Limpar</Button>
               </div>
               <CardContent className="p-0">
                 <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                       <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item / SKU</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Baixa na Loja?</th>
                       </tr>
                    </thead>
                   <tbody className="divide-y divide-slate-100">
                     {nfData.items.map((item) => (
                       <tr key={item.sku} className={cn("h-24 transition-colors", item.isDelivered ? "bg-emerald-50/50" : "bg-white")}>
                         <td className="px-8 py-4">
                            <p className="font-black text-sm uppercase text-slate-900">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SKU: {item.sku}</p>
                         </td>
                         <td className="px-8 py-4 text-center">
                            <Badge className="h-9 rounded-xl px-5 bg-slate-100 text-slate-600 border-none font-black text-xs">{item.qty} {item.uom}</Badge>
                         </td>
                         <td className="px-8 py-4 text-right">
                            <div className="flex justify-end pr-4">
                               <button 
                                  onClick={() => toggleItemDelivery(item.sku)}
                                  className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center transition-all border-2",
                                    item.isDelivered 
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" 
                                      : "bg-white border-slate-200 text-transparent hover:border-blue-400"
                                  )}
                               >
                                  <Check className="h-6 w-6 stroke-[4]" />
                               </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </CardContent>
               <CardFooter className="p-10 bg-slate-50 border-t flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <AlertCircle className="h-6 w-6 text-amber-500" />
                     <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Instrução de Trabalho (IT)</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase max-w-sm leading-tight">
                          Conferência física obrigatória. Registre o nome do recebedor e valide sua identidade como vendedor para log de auditoria.
                       </p>
                     </div>
                  </div>
                  <Button 
                    onClick={() => setShowSignatureModal(true)}
                    className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-blue-200 active:scale-95 transition-all"
                  >
                    Confirmar Entrega e Sincronizar
                  </Button>
               </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-10 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <QrCode className="h-8 w-8 text-blue-500" />
              REGISTRAR RECEBEDOR
            </DialogTitle>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Protocolo de Assinatura Digital</p>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Nome Completo do Cliente/Motorista</Label>
               <Input 
                 value={receiverName}
                 onChange={(e) => setReceiverName(e.target.value)}
                 placeholder="Digite o nome de quem está retirando..."
                 className="h-16 bg-slate-100 border-none rounded-2xl text-xl font-black px-6"
                 autoFocus
               />
            </div>
            <div className="p-6 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-start gap-4">
               <CheckCircle2 className="h-6 w-6 text-blue-600 shrink-0" />
                <p className="text-[10px] text-blue-800 font-bold uppercase leading-relaxed">
                  Esta ação é imutável. O nome do recebedor e do vendedor ({profile?.fullName}) serão gravados permanentemente no log de auditoria fiscal.
                </p>
            </div>
            <Button 
              onClick={handleConfirmDelivery} 
              disabled={loading || !receiverName}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              {loading ? "Sincronizando..." : "FINALIZAR E GERAR LOG"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
