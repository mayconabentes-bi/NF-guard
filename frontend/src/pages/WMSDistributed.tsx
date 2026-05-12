import * as React from 'react';
import { 
  ShieldCheck, 
  FileSearch, 
  QrCode, 
  Truck, 
  Store, 
  AlertOctagon, 
  ArrowRight,
  Upload,
  CheckCircle2,
  Lock,
  Search,
  AlertCircle,
  ShieldAlert,
  Activity,
  Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { wmsService } from '@/lib/wmsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function WMSDistributed() {
  const { profile, currentUnit } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'ingest' | 'verify' | 'audit'>('ingest');
  const [loading, setLoading] = React.useState(false);
  const [tab, setTab] = React.useState<'pending' | 'delivered'>('pending');
  const [dailyDeliveries, setDailyDeliveries] = React.useState<any[]>([]);
  const [showSignatureModal, setShowSignatureModal] = React.useState(false);
  const [receiverName, setReceiverName] = React.useState('');
  const [selectedTokenId, setSelectedTokenId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [xmls, setXmls] = React.useState<any[]>([]);
  const [items, setItems] = React.useState<any[]>([]);
  const [globalLogs, setGlobalLogs] = React.useState<any[]>([]);
  const [selectedTokens, setSelectedTokens] = React.useState<any[]>([]);
  const [isTokensOpen, setIsTokensOpen] = React.useState(false);

  // Verification State
  const [scanCode, setScanCode] = React.useState('');
  const [verificationResult, setVerificationResult] = React.useState<any>(null);

  React.useEffect(() => {
    if (profile?.organizationId) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setIsLoading(true);
    const [xmlData, auditData] = await Promise.all([
      wmsService.listActiveXMLs(profile!.organizationId),
      wmsService.getGlobalAudit(profile!.organizationId)
    ]);
    setXmls(xmlData);
    setGlobalLogs(auditData.filter(t => t.status === 'DELIVERED').sort((a, b) => 
      new Date(b.deliveryAudit!.timestamp).getTime() - new Date(a.deliveryAudit!.timestamp).getTime()
    ));
    setIsLoading(false);
  };

  const handleShowTokens = async (xmlId: string) => {
    const tokens = await wmsService.getTokensByXML(xmlId);
    setItems(tokens);
    
    // Load daily deliveries for the org
    const allTokens = await wmsService.getGlobalAudit(profile!.organizationId);
    const today = new Date().toISOString().split('T')[0];
    const processedToday = allTokens.filter(t => 
      t.status === 'DELIVERED' && 
      t.deliveryAudit?.timestamp?.startsWith(today)
    );
    setDailyDeliveries(processedToday);

    setIsTokensOpen(true);
  };

  const handleIngest = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      // Mock XML Processing for Demo
      const mockXml = {
        accessKey: "45240500123456789012345678901234567890123456",
        digestValue: "H6jK8L2M9nP4qR7sT1uV3wX5yZ==",
        issuer: "METALURGICA MANAUS LTDA",
        date: new Date().toISOString(),
        total: 1540.50,
        items: [
          { sku: "PAR-001", name: "Parafuso Zincado", qty: 500, uom: "UN", isHeavy: false },
          { sku: "VIG-202", name: "Viga I-Beam 6m", qty: 4, uom: "PC", isHeavy: true }
        ]
      };
      
      if (!currentUnit) {
        toast.error("Selecione uma UNIDADE no cabeçalho primeiro!");
        return;
      }
      
      await wmsService.ingestXML(mockXml, profile.organizationId, profile.id, currentUnit.id);
      toast.success("XML Validado e Distribuído com Sucesso!");
      loadData();
    } catch (e) {
      toast.error("Falha na validação do XML");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!currentUnit) {
      toast.error("Selecione uma UNIDADE no cabeçalho primeiro!");
      return;
    }
    try {
      const res = await wmsService.validateToken(scanCode, currentUnit.id);
      setVerificationResult(res);
      toast.success("Token Válido - Carga Liberada");
    } catch (e: any) {
      setVerificationResult({ error: e.message });
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSignature = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setShowSignatureModal(true);
  };

  const handleDeliver = async () => {
    if (!profile || !currentUnit || !receiverName) {
      toast.error("Nome do recebedor é obrigatório.");
      return;
    }
    
    setIsLoading(true);
    try {
      const codeToUse = selectedTokenId || scanCode;
      await wmsService.executeDelivery(codeToUse, profile.id, currentUnit.id, receiverName, profile.fullName);
      toast.success("Baixa Realizada com Sucesso! Registro imutável gerado.");
      
      setVerificationResult(null);
      setScanCode('');
      setReceiverName('');
      setShowSignatureModal(false);
      setSelectedTokenId(null);
      loadData();
      
      // Update local items if in token view
      if (items.length > 0) {
        setItems(items.map(i => i.id === codeToUse ? { ...i, status: 'DELIVERED' } : i));
      }
    } catch (e) {
      toast.error("Erro ao processar baixa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-red-500 hover:bg-red-600 animate-pulse mb-2">MODULO CRÍTICO</Badge>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3 uppercase">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
            WMS Distribuído & Trava Fiscal
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Protocolo de integridade via XML SEFAZ. Mitigação de conluio e fraude de double-dipping em tempo real.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <Button 
            variant={activeTab === 'ingest' ? 'outline' : 'ghost'} 
            onClick={() => setActiveTab('ingest')}
            className={cn("rounded-lg font-bold text-xs uppercase", activeTab === 'ingest' && "bg-white")}
          >
            Faturamento (XML)
          </Button>
          <Button 
            variant={activeTab === 'verify' ? 'outline' : 'ghost'} 
            onClick={() => setActiveTab('verify')}
            className={cn("rounded-lg font-bold text-xs uppercase", activeTab === 'verify' && "bg-white")}
          >
            Conferência Cega
          </Button>
          <Button 
            variant={activeTab === 'audit' ? 'outline' : 'ghost'} 
            onClick={() => setActiveTab('audit')}
            className={cn("rounded-lg font-bold text-xs uppercase", activeTab === 'audit' && "bg-white")}
          >
            Auditoria Global
          </Button>
        </div>
      </header>

      {activeTab === 'ingest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-2 border-blue-100 shadow-xl shadow-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" /> Upload de XML
              </CardTitle>
              <CardDescription>Upload automático SEFAZ para geração de SSOT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-4 border-dashed border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 group hover:bg-white hover:border-blue-200 transition-all cursor-pointer">
                <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSearch className="h-8 w-8 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Arraste o XML do faturamento</p>
                <p className="text-[10px] text-slate-300 mt-1 uppercase">Validamos Digest Value instantaneamente</p>
              </div>
              <Button onClick={handleIngest} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 h-10 uppercase font-black tracking-widest mb-2">
                Simular Ingestao (Demo)
              </Button>
              <Button variant="outline" onClick={() => navigate('/fiscal')} className="w-full h-10 uppercase font-bold text-[10px] tracking-widest border-slate-200">
                Usar XMLs de Movimentação Fiscal (Real)
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-xl bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase text-blue-400">Status de Fluxo Fisico-Fiscal</CardTitle>
              <CardDescription className="text-slate-400">Status global em tempo real (5 Unidades sincronizadas)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {xmls.map((xml) => (
                  <div key={xml.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[9px] border-slate-600 text-blue-400 font-mono">
                          {(xml.accessKey || xml.access_key)?.slice(-8) || 'N/A'}
                        </Badge>
                        <span className="font-black text-sm uppercase tracking-tight">{xml.issuer || xml.issuerName || 'Desconhecido'}</span>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                          <Store className="h-3 w-3" /> Miudezas: {(xml.items || []).filter((i: any) => i.routing === 'LOJA' || !i.isHeavy).length} ITENS
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                          <Truck className="h-3 w-3" /> Pesados: {(xml.items || []).filter((i: any) => i.routing === 'GALPAO' || i.isHeavy).length} ITENS
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Conclusão de Carga</p>
                          <Progress value={20} className="w-24 h-1.5 bg-slate-700" />
                       </div>
                       <Button size="icon" variant="ghost" className="text-slate-500 hover:text-white" onClick={() => handleShowTokens(xml.id)}>
                          <QrCode className="h-5 w-5" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                <FileSearch className="h-6 w-6 text-blue-600" /> Registro Global de Entregas
              </CardTitle>
              <CardDescription>Monitoramento de todas as unidades em tempo real para prevenção de fraude.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Horário</th>
                      <th className="px-6 py-4">Unidade</th>
                      <th className="px-6 py-4">Material</th>
                      <th className="px-6 py-4">Chave de Acesso</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {globalLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhuma entrega registrada nas últimas 24h.</td>
                      </tr>
                    ) : (
                      globalLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-[10px]">{new Date(log.deliveryAudit.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{log.deliveryAudit.unitId}</Badge>
                          </td>
                          <td className="px-6 py-4 font-bold">{log.sku} <span className="text-[10px] text-slate-400 ml-2">x{log.quantity}</span></td>
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                            {(log.accessKey || log.access_key)?.slice(-12) || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> Entregue
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Display Dialog */}
      <Dialog open={isTokensOpen} onOpenChange={setIsTokensOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Tokens de Retirada (QR Codes)</DialogTitle>
            <DialogDescription>Entregue estes códigos ao cliente. Cada código é de uso ÚNICO e rastreado globalmente.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 border-b border-slate-200 mb-6">
            <button 
              onClick={() => setTab('pending')}
              className={cn(
                "pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all",
                tab === 'pending' ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"
              )}
            >
              Pendentes ({items.filter(i => i.status === 'AVAILABLE').length})
            </button>
            <button 
              onClick={() => setTab('delivered')}
              className={cn(
                "pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all",
                tab === 'delivered' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"
              )}
            >
              Entregues Hoje ({dailyDeliveries.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tab === 'pending' ? (
              items.map((item) => (
                <div key={item.id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Package className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU: {item.sku}</p>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cimento CP-II 50KG</h3>
                      <p className="text-sm font-bold text-blue-600">QTD: {item.quantity} UN</p>
                    </div>
                  </div>
                  
                  {item.status === 'AVAILABLE' ? (
                    <Button 
                      onClick={() => handleOpenSignature(item.id)}
                      className="bg-slate-900 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg transition-all"
                    >
                      Confirmar Entrega
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                       <CheckCircle2 className="h-5 w-5" /> Entregue
                    </div>
                  )}
                </div>
              ))
            ) : (
              dailyDeliveries.map((item) => (
                <div key={item.id} className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center justify-between opacity-80">
                   <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">REGISTRO IMUTÁVEL</p>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">SKU: {item.sku}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        Recebido por: {item.delivery_audit?.receiverName || 'Não informado'}
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">
                        Responsável: {item.delivery_audit?.staffName || 'Sistema'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Em: {new Date(item.delivery_audit?.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] uppercase">PROCESSADO</Badge>
                </div>
              ))
            )}
            
            {tab === 'pending' && items.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                 <div className="h-16 w-16 bg-slate-200 rounded-full mx-auto flex items-center justify-center text-slate-400">
                    <Search className="h-8 w-8" />
                 </div>
                 <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Nenhuma nota fiscal carregada para conferência</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <QrCode className="h-6 w-6 text-orange-500" />
              CONFIRMAR RETIRADA
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              Assinatura digital do cliente no GALPÃO
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Nome Completo do Recebedor</Label>
              <Input 
                placeholder="Quem está retirando os materiais?"
                className="h-14 bg-slate-100 border-none rounded-xl text-lg font-bold"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
               <p className="text-[10px] text-orange-700 font-bold uppercase leading-tight">
                 Atenção: Este registro é definitivo e será auditado pelo departamento antifraude.
               </p>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t border-slate-200">
             <Button 
               onClick={handleDeliver}
               disabled={isLoading || !receiverName}
               className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs tracking-widest rounded-xl"
             >
               {isLoading ? "Processando..." : "CONFIRMAR ASSINATURA NO GALPÃO"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update scanner button to trigger modal */}
      {verificationResult && !verificationResult.error && (
        <div className="fixed bottom-8 right-8 z-50">
           <Button 
             onClick={() => setShowSignatureModal(true)}
             className="h-20 px-10 bg-emerald-600 text-white rounded-2xl shadow-2xl font-black uppercase tracking-widest flex items-center gap-4 animate-bounce"
           >
              <CheckCircle2 className="h-8 w-8" />
              Finalizar Entrega (BIP)
           </Button>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="border-4 border-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-slate-900 p-8 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                <Lock className="h-8 w-8 text-blue-500" />
                Estação de Conferência Cega
              </h2>
              <p className="text-slate-400 font-bold text-xs uppercase mt-2">
                Scan do QR Code de Retirada • Unidade: <span className="text-white">{profile?.unitIds?.[0] || 'N/A'}</span>
              </p>
            </div>
            <CardContent className="p-10 space-y-8">
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insira ou Escaneie o Token de Retirada</Label>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="TOKEN-ID-000000" 
                      value={scanCode}
                      onChange={(e) => setScanCode(e.target.value)}
                      className="h-14 font-mono font-black text-xl bg-slate-50 uppercase text-center border-2 focus:border-blue-500"
                    />
                    <Button onClick={handleVerify} disabled={isLoading} className="h-14 w-20 bg-slate-900">
                      <QrCode className="h-6 w-6" />
                    </Button>
                  </div>
               </div>

               {verificationResult && !verificationResult.error && (
                 <div className="bg-green-50 border-2 border-green-200 p-8 rounded-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                       <Badge className="bg-green-600 uppercase font-black tracking-widest">DISPONÍVEL</Badge>
                       <span className="text-[10px] font-black font-mono text-green-700">VAL: {verificationResult.accessKey.slice(-6)}</span>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-2xl font-black text-slate-900 uppercase leading-none">{verificationResult.sku}</h4>
                       <div className="flex gap-6">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Qtd. Solicitada</p>
                            <p className="text-2xl font-black text-slate-900">{verificationResult.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Destinação</p>
                            <p className="text-lg font-black text-blue-600 flex items-center gap-2">
                               {verificationResult.targetUnitType === 'GALPAO' ? <Truck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                               {verificationResult.targetUnitType}
                            </p>
                          </div>
                       </div>
                    </div>
                    <Button onClick={finalizeDelivery} className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg font-black uppercase tracking-tighter">
                       Efetivar Baixa Fiscal
                    </Button>
                 </div>
               )}

               {verificationResult?.error && (
                 <div className="bg-red-50 border-2 border-red-200 p-8 rounded-3xl space-y-4 text-center">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                       <AlertOctagon className="h-10 w-10 text-red-600" />
                    </div>
                    <h4 className="text-xl font-black text-red-900 uppercase">ALERTA DE SEGURANÇA</h4>
                    <p className="text-red-700 font-bold text-sm leading-tight">{verificationResult.error}</p>
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Incidente registrado em auditoria global</p>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
