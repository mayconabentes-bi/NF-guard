import * as React from 'react';
import { 
  Building2, 
  Database, 
  Key, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  Users,
  ChevronRight,
  Globe,
  Bell,
  Activity,
  MapPin,
  Trash2,
  Mail,
  UserPlus,
  Lock,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { blingService } from '@/services/blingService';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'integrations' | 'users' | 'security';

export default function Settings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('general');
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  
  // Data States
  const [blingConfig, setBlingConfig] = React.useState({
    apiKey: '',
    clientId: '',
    clientSecret: '',
    warehouseId: '',
    enabled: false,
    syncOrders: true,
    syncStock: true,
    lastSync: null as string | null
  });
  
  const [securityConfig, setSecurityConfig] = React.useState({
    webhookUrl: '',
    doubleDippingProtection: true,
    auditLogging: true
  });

  const [team, setTeam] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [newMember, setNewMember] = React.useState({ fullName: '', email: '', role: 'OPERATOR', unitId: '' });

  // Initial Load
  const loadInitialData = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setLoading(true);
    try {
      // Load Bling
      const { data: blingData } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', `bling_${profile.organizationId}`)
        .single();
      if (blingData) setBlingConfig(blingData);

      // Load Team
      const { data: teamData } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.organizationId)
        .order('full_name');
      if (teamData) setTeam(teamData);

      // Load Units
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('company_id', profile.organizationId);
      if (unitsData) setUnits(unitsData);

      // Load Security (from companies)
      const { data: compData } = await supabase
        .from('companies')
        .select('security_webhook_url')
        .eq('id', profile.organizationId)
        .single();
      if (compData) setSecurityConfig(prev => ({ ...prev, webhookUrl: compData.security_webhook_url || '' }));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Actions
  const handleSaveBling = async () => {
    if (!profile?.organizationId) return;
    setLoading(true);
    try {
      await supabase.from('integrations').upsert({
        id: `bling_${profile.organizationId}`,
        ...blingConfig,
        company_id: profile.organizationId,
        updated_at: new Date().toISOString()
      });
      toast.success('Configurações do Bling salvas!');
    } catch (e) {
      toast.error('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!profile?.organizationId || !newMember.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('user_invites').insert({
        company_id: profile.organizationId,
        email: newMember.email.toLowerCase(),
        full_name: newMember.fullName,
        role: newMember.role,
        unit_id: newMember.unitId || null
      });
      if (error) throw error;
      toast.success('Funcionário cadastrado!');
      setNewMember({ fullName: '', email: '', role: 'OPERATOR', unitId: '' });
      loadInitialData();
    } catch (e) {
      toast.error('Erro ao cadastrar membro.');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'general', label: 'Geral', icon: Building2, desc: 'Identidade da Organização' },
    { id: 'users', label: 'Equipe', icon: Users, desc: 'Gestão de Acessos e Time' },
    { id: 'integrations', label: 'Integrações', icon: Globe, desc: 'Bling ERP e Webhooks' },
    { id: 'security', label: 'Segurança', icon: ShieldCheck, desc: 'Protocolos Antifraude' },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase tracking-[0.2em] px-3 shadow-sm">Gestão Estratégica</Badge>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
              <Settings className="h-8 w-8 text-white" />
             </div>
             Configurações Globais
          </h1>
          <p className="text-slate-500 font-medium text-lg tracking-tight">Gerenciamento de identidades corporativas, acessos e integrações.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group",
                  isActive 
                    ? "bg-slate-900 text-white shadow-xl" 
                    : "hover:bg-slate-100 text-slate-500 border border-transparent hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
                  isActive ? "bg-blue-600" : "bg-slate-100 group-hover:bg-white"
                )}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500")} />
                </div>
                <div>
                   <p className="font-black text-xs uppercase tracking-tight">{item.label}</p>
                   <p className={cn("text-[9px] font-bold uppercase tracking-tighter", isActive ? "text-slate-500" : "text-slate-400")}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8">
        {activeTab === 'general' && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
             <CardHeader className="bg-slate-50 p-10 border-b border-slate-100">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                   <Building2 className="h-8 w-8 text-blue-600" />
                   Dados da Organização
                </CardTitle>
                <CardDescription className="text-xs font-black uppercase text-slate-400 tracking-widest mt-1">Configurações centrais do seu Nexus ERP</CardDescription>
             </CardHeader>
             <CardContent className="p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 px-1">ID Corporativo (Imutável)</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={profile?.organizationId || ''} className="h-14 bg-slate-50 border-none font-mono text-xs rounded-xl" />
                        <Button variant="outline" className="h-14 px-4 rounded-xl font-black text-[10px]" onClick={() => { navigator.clipboard.writeText(profile?.organizationId || ''); toast.success('ID Copiado!'); }}>COPIAR</Button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Nome da Empresa</Label>
                      <Input placeholder="Sua Empresa LTDA" className="h-14 bg-white border-slate-200 rounded-xl font-bold" />
                   </div>
                </div>
             </CardContent>
          </Card>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
             <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                   <div className="space-y-1">
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter">Gestão de Equipe</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adicione e gerencie membros do time</p>
                   </div>
                   <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3">RBAC v2</Badge>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                   {/* Manual Add Form */}
                   <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                         <UserPlus className="h-5 w-5 text-blue-600" />
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Novo Colaborador</h3>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Nome</Label>
                            <Input placeholder="João Silva" className="h-12 bg-white border-none rounded-xl" value={newMember.fullName} onChange={e => setNewMember({...newMember, fullName: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">E-mail</Label>
                            <Input placeholder="joao@empresa.com" className="h-12 bg-white border-none rounded-xl" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Cargo</Label>
                            <select className="w-full h-12 bg-white border-none rounded-xl px-4 text-xs font-bold" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                               <option value="OPERATOR">OPERADOR</option>
                               <option value="SECURITY">SEGURANÇA</option>
                               <option value="ADMIN">ADMINISTRADOR</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Unidade Principal</Label>
                            <select className="w-full h-12 bg-white border-none rounded-xl px-4 text-xs font-bold" value={newMember.unitId} onChange={e => setNewMember({...newMember, unitId: e.target.value})}>
                               <option value="">SELECIONE...</option>
                               {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                         </div>
                      </div>
                      <Button className="w-full h-14 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl" onClick={handleAddMember} disabled={loading || !newMember.email}>
                         CADASTRAR E VINCULAR
                      </Button>
                   </div>

                   {/* Team List */}
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Membros Ativos</h3>
                      <div className="grid gap-4">
                         {team.map((member) => (
                           <div key={member.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">{member.full_name?.[0]}</div>
                                 <div>
                                    <p className="font-black text-sm uppercase text-slate-900">{member.full_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{member.role} • {member.email}</p>
                                 </div>
                              </div>
                              <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase">Ativo</Badge>
                           </div>
                         ))}
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}

        {activeTab === 'integrations' && (
           <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-10">
                 <div className="flex items-center justify-between">
                    <div>
                       <Badge className="bg-orange-600 text-white border-none font-black text-[9px] uppercase tracking-widest mb-4">ERP Gateway</Badge>
                       <CardTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                          <Store className="h-8 w-8 text-orange-400" />
                          Bling ERP Integration
                       </CardTitle>
                    </div>
                    <Switch checked={blingConfig.enabled} onCheckedChange={val => setBlingConfig({...blingConfig, enabled: val})} />
                 </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                 <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 px-1">API Key (V2)</Label>
                          <Input type="password" value={blingConfig.apiKey} onChange={e => setBlingConfig({...blingConfig, apiKey: e.target.value})} className="h-14 bg-slate-50 border-none rounded-xl font-mono" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Client ID (V3)</Label>
                          <Input value={blingConfig.clientId} onChange={e => setBlingConfig({...blingConfig, clientId: e.target.value})} className="h-14 bg-slate-50 border-none rounded-xl font-mono" />
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Client Secret (V3)</Label>
                          <Input type="password" value={blingConfig.clientSecret} onChange={e => setBlingConfig({...blingConfig, clientSecret: e.target.value})} className="h-14 bg-slate-50 border-none rounded-xl font-mono" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 px-1">ID Depósito Bling</Label>
                          <Input value={blingConfig.warehouseId} onChange={e => setBlingConfig({...blingConfig, warehouseId: e.target.value})} className="h-14 bg-slate-50 border-none rounded-xl font-mono text-sm" />
                       </div>
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <Button className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-200" onClick={handleSaveBling}>
                    <Save className="h-5 w-5 mr-3" /> Salvar Integração
                 </Button>
              </CardFooter>
           </Card>
        )}

        {activeTab === 'security' && (
           <div className="space-y-8">
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                 <CardHeader className="bg-rose-600 text-white p-10">
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                       <Lock className="h-8 w-8" />
                       Protocolos de Segurança
                    </CardTitle>
                    <CardDescription className="text-rose-200 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Bloqueio de fraude e auditoria forense</CardDescription>
                 </CardHeader>
                 <CardContent className="p-10 space-y-10">
                    <div className="space-y-6">
                       <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase text-slate-900">Proteção Double-Dipping</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Bloqueia tentativas de re-utilização de QR Codes entregues.</p>
                             </div>
                             <Switch checked={securityConfig.doubleDippingProtection} onCheckedChange={val => setSecurityConfig({...securityConfig, doubleDippingProtection: val})} />
                          </div>
                          <div className="h-px bg-slate-200 w-full" />
                          <div className="flex items-center justify-between">
                             <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase text-slate-900">Auditoria por Dispositivo</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Registra o Fingerprint (DNA) do aparelho usado no checkout.</p>
                             </div>
                             <Switch checked={securityConfig.auditLogging} onCheckedChange={val => setSecurityConfig({...securityConfig, auditLogging: val})} />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Webhook de Alerta (Telegram/Custom)</Label>
                          <div className="relative">
                             <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                             <Input 
                                placeholder="https://api.telegram.org/bot..." 
                                className="h-16 pl-12 bg-white border-slate-200 rounded-2xl font-mono text-xs" 
                                value={securityConfig.webhookUrl}
                                onChange={e => setSecurityConfig({...securityConfig, webhookUrl: e.target.value})}
                             />
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold italic px-2">Dispara alertas críticos de segurança para o seu canal de monitoramento.</p>
                       </div>
                    </div>
                 </CardContent>
                 <CardFooter className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Button className="h-14 px-8 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl" onClick={async () => {
                       try {
                         await supabase.from('companies').update({ security_webhook_url: securityConfig.webhookUrl }).eq('id', profile?.organizationId);
                         toast.success('Protocolos atualizados!');
                       } catch (e) { toast.error('Erro ao salvar.'); }
                    }}>
                       Atualizar Segurança
                    </Button>
                 </CardFooter>
              </Card>
           </div>
            </div>
         )}
       </main>
     </div>
   </div>
  );
}

const Store = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-4.8 0v0a2.7 2.7 0 0 1-4.8 0v0a2.7 2.7 0 0 1-4.8 0v0a2 2 0 0 1-2-2V7"/></svg>
);
