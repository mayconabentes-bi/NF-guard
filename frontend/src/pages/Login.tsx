import * as React from 'react';
import { Package, Lock, Mail, ArrowRight, ShieldCheck, Activity, Database, Zap, ChevronDown, CheckCircle2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const OPERATIONAL_UNITS = [
  { id: 'loja-1', name: 'LOJA 01 - CENTRO' },
  { id: 'loja-2', name: 'LOJA 02 - SHOPPING' },
  { id: 'loja-3', name: 'LOJA 03 - BAIRRO' },
  { id: 'dep-1', name: 'DEPÓSITO 01 - NORTE' },
  { id: 'dep-2', name: 'DEPÓSITO 02 - SUL' },
  { id: 'dep-3', name: 'DEPÓSITO 03 - LESTE' },
];

const INDICATORS = [
  { label: 'Integridade operacional', icon: ShieldCheck },
  { label: 'Auditoria distribuída', icon: Database },
  { label: 'Rastreabilidade total', icon: Activity },
  { label: 'Anti retirada duplicada', icon: Zap },
];

export default function Login() {
  const { signInWithEmail, setCurrentUnit } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) throw error;
      
      toast.success('Acesso à operação autorizado');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Falha na autenticação operacional');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020617] text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-400">
      
      {/* LEFT PANEL — OPERATIONAL COMMAND CENTER (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-16 overflow-hidden border-r border-white/5">
        
        {/* HUD BACKGROUND EFFECTS */}
        <div className="absolute inset-0 hud-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/10" />
        
        {/* BRANDING TOP */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="h-10 w-10 bg-cyan-500 rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)]">
            <ShieldCheck className="h-6 w-6 text-[#020617]" />
          </div>
          <span className="text-2xl font-black tracking-widest text-white">NF-GUARD</span>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-20 space-y-12 max-w-2xl">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl font-black tracking-tighter text-white leading-[0.9] uppercase">
                Controle Inteligente <br />
                <span className="text-cyan-500">de Retirada por NF-e</span>
              </h1>
            </motion.div>
            
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
              Sincronização em tempo real entre lojas, depósitos e operações logísticas com integridade total.
            </p>
          </div>

          {/* OPERATIONAL INDICATORS */}
          <div className="grid grid-cols-2 gap-4">
            {INDICATORS.map((item, idx) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center gap-3 bg-slate-900/40 border border-white/5 p-4 rounded-sm backdrop-blur-sm"
              >
                <div className="h-8 w-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* BOTTOM STATUS */}
        <div className="relative z-20 flex items-center gap-8 border-t border-white/5 pt-10">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Global Sync Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Multi-Unit Protocol 4.0</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — LOGIN (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 bg-[#020617] relative">
        <div className="absolute inset-0 hud-dots opacity-5 pointer-events-none" />
        
        <div className="w-full max-w-sm space-y-12 relative z-10">
          
          {/* MOBILE LOGO */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
             <div className="h-10 w-10 bg-cyan-500 rounded-sm flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-[#020617]" />
            </div>
            <span className="text-2xl font-black tracking-widest text-white uppercase">NF-GUARD</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-500">Acesso ao Terminal</h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Inicie sua sessão operacional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              
              {/* EMAIL */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail Corporativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="operador@nexus.com" 
                    className="pl-12 h-14 bg-slate-900/50 border-white/5 focus:border-cyan-500/50 focus:ring-cyan-500/10 text-white font-mono text-sm placeholder:text-slate-700"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha Segura</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                  <Input 
                    type="password" 
                    className="pl-12 h-14 bg-slate-900/50 border-white/5 focus:border-cyan-500/50 focus:ring-cyan-500/10 text-white font-mono text-sm"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

            </div>

            <Button className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(8,145,178,0.2)] group transition-all" disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Acessar Operação'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          {/* FOOTER STATUS */}
          <div className="pt-10 border-t border-white/5 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Sistemas sincronizados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-cyan-500" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">Integridade operacional OK</span>
              </div>
            </div>
            
            <p className="text-[8px] text-center text-slate-600 leading-relaxed px-12 uppercase tracking-widest font-medium">
              Uso restrito. Todas as sessões são auditadas pelo protocolo de segurança industrial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
