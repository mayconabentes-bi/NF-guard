import * as React from 'react';
import { 
  Book, 
  Search, 
  ChevronRight, 
  ShieldCheck,
  Package,
  ArrowRightLeft,
  FileText,
  Smartphone,
  Users,
  Settings,
  Building2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  History,
  QrCode,
  MapPin,
  Terminal,
  Fingerprint,
  Zap,
  ClipboardList,
  Workflow
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: 'OPERATIONAL' | 'SECURITY' | 'MANAGEMENT';
  description: string;
  steps: string[];
  rules: string[];
}

const MANUAL_DATA: ManualSection[] = [
  {
    id: 'fiscal',
    title: 'Ingestão Fiscal & Governança',
    icon: <FileText className="h-5 w-5" />,
    category: 'OPERATIONAL',
    description: 'Protocolo de entrada de mercadorias via XML NFe 4.0.',
    steps: [
      'Upload do arquivo XML ou inserção da Chave de Acesso.',
      'Validação automática do Digest Value (Assinatura SEFAZ).',
      'Mapeamento de SKUs (DE-PARA) para o inventário interno.',
      'Geração de Tokens de Retirada (WMS) para o cliente.'
    ],
    rules: [
      'É proibida a entrada de notas sem Digest Value válido.',
      'Itens pesados são marcados automaticamente para Retirada em Galpão.'
    ]
  },
  {
    id: 'checkout',
    title: 'Checkout de Loja (Terminal de Saída)',
    icon: <QrCode className="h-5 w-5" />,
    category: 'OPERATIONAL',
    description: 'Operação de balcão para entrega imediata de produtos.',
    steps: [
      'Importação do XML da Nota Fiscal ou bipagem do Token de Retirada.',
      'Conferência física rigorosa de cada item (marcação individual no sistema).',
      'Registro obrigatório do nome completo do cliente/motorista (Recebedor).',
      'Confirmação do nome do vendedor (Responsável) para vinculação no log imutável.',
      'Processamento da baixa e sincronização com o controle de integridade fiscal.'
    ],
    rules: [
      'Todo checkout exige o registro nominal obrigatório de quem está retirando a mercadoria e do vendedor responsável pela entrega.',
      'Itens não conferidos não podem ser baixados do sistema.'
    ]
  },
  {
    id: 'security',
    title: 'Protocolo Antifraude Nexus',
    icon: <ShieldCheck className="h-5 w-5" />,
    category: 'SECURITY',
    description: 'Camada de proteção contra perdas e Double-Dipping.',
    steps: [
      'Monitoramento de DNA de Dispositivo (IP, Browser, OS).',
      'Bloqueio instantâneo de Tokens já utilizados.',
      'Alerta automático via Webhook para a central de segurança.',
      'Registro de trilha forense imutável para auditoria.'
    ],
    rules: [
      'Tentativas de fraude geram bloqueio imediato do operador.',
      'O sistema invalida tokens que não condizem com a unidade fiscal ativa.'
    ]
  },
  {
    id: 'team',
    title: 'Gestão de Time & Unidades',
    icon: <Users className="h-5 w-5" />,
    category: 'MANAGEMENT',
    description: 'Administração de acessos e pods operacionais.',
    steps: [
      'Cadastro manual de colaboradores (sem links externos).',
      'Atribuição de Cargo (Operador, Auditor, Admin).',
      'Vinculação obrigatória a uma Unidade Logística.',
      'Definição de permissões baseadas em necessidade (Princípio do Menor Privilégio).'
    ],
    rules: [
      'Apenas Administradores podem criar novas unidades.',
      'O acesso a unidades é restrito por perfil geográfico/lógico.'
    ]
  }
];

export default function UserManual() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string>(MANUAL_DATA[0].id);

  const filteredData = MANUAL_DATA.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSection = MANUAL_DATA.find(i => i.id === selectedId) || MANUAL_DATA[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10 min-h-[80vh]">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-96 shrink-0 space-y-6">
        <div className="space-y-1 px-2">
           <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Nexus Manual</h1>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Guia de Protocolos Operacionais</p>
        </div>

        <div className="relative px-2">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input 
              placeholder="Buscar no manual..." 
              className="pl-12 h-14 bg-white border-slate-200 rounded-2xl text-sm font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="space-y-2">
           {filteredData.map((item) => (
             <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all text-left group",
                  selectedId === item.id 
                    ? "bg-slate-900 text-white shadow-2xl" 
                    : "hover:bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200"
                )}
             >
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  selectedId === item.id ? "bg-blue-600" : "bg-slate-100 group-hover:bg-white"
                )}>
                   {React.cloneElement(item.icon as React.ReactElement, { 
                     className: cn("h-6 w-6", selectedId === item.id ? "text-white" : "text-slate-500") 
                   })}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-black uppercase tracking-tight truncate">{item.title}</p>
                   <p className={cn("text-[9px] font-bold uppercase truncate mt-0.5", selectedId === item.id ? "text-slate-500" : "text-slate-400")}>
                      {item.category}
                   </p>
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", selectedId === item.id ? "text-blue-500 rotate-90" : "text-slate-300")} />
             </button>
           ))}
        </div>

        <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-blue-900/20">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Suporte de Integridade</span>
           </div>
           <p className="text-xs font-bold leading-relaxed">
              Dúvidas sobre protocolos de segurança? Contate o DPO da sua unidade.
           </p>
           <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-[10px] h-12 uppercase rounded-xl">
              Abrir Ticket Técnico
           </Button>
        </div>
      </aside>

      {/* Manual Content Area */}
      <main className="flex-1 min-w-0">
         <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <CardHeader className="p-12 pb-8 border-b border-slate-100 bg-slate-50/50">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                     <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Protocolo Oficiai</Badge>
                     <CardTitle className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic flex items-center gap-4">
                        {activeSection.title}
                     </CardTitle>
                     <p className="text-slate-500 font-bold text-sm">{activeSection.description}</p>
                  </div>
                  <div className="h-20 w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-blue-600 border border-slate-100">
                     {React.cloneElement(activeSection.icon as React.ReactElement, { className: "h-10 w-10" })}
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-12 space-y-12">
               {/* Steps Section */}
               <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                     <Workflow className="h-4 w-4 text-blue-600" /> Fluxo Operacional
                  </h3>
                  <div className="grid gap-4">
                     {activeSection.steps.map((step, i) => (
                       <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                          <div className="h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center text-slate-900 font-black font-mono text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                             {(i+1).toString().padStart(2, '0')}
                          </div>
                          <p className="text-sm font-black uppercase tracking-tight text-slate-700">{step}</p>
                       </div>
                     ))}
                  </div>
               </section>

               {/* Rules Section */}
               <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                     <Lock className="h-4 w-4 text-rose-500" /> Regras e Conformidade
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                     {activeSection.rules.map((rule, i) => (
                       <div key={i} className="p-6 border border-slate-100 rounded-3xl flex items-start gap-4 bg-white hover:shadow-lg transition-shadow">
                          <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                          <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{rule}"</p>
                       </div>
                     ))}
                  </div>
               </section>

               {/* Footer Info */}
               <div className="pt-10 border-t border-slate-100 grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificação Forense</p>
                     <div className="flex items-center gap-2">
                        <Fingerprint className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-black text-slate-900 uppercase">Fingerprint Ativo</span>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status do Protocolo</p>
                     <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-xs font-black text-slate-900 uppercase">Conformidade 100%</span>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última Atualização</p>
                     <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-slate-400" />
                        <span className="text-xs font-black text-slate-900 uppercase">MAI 2026</span>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>
      </main>
    </div>
  );
}
