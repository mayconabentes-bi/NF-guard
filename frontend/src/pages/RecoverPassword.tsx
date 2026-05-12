import * as React from 'react';
import { Package, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

export default function RecoverPassword() {
  const [isSent, setIsSent] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-row-reverse">
      {/* Visual Side - Industrial Aesthetic */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center relative overflow-hidden p-12 text-right">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="relative z-10 max-w-lg space-y-8 flex flex-col items-end">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(37,99,235,0.3)]">
            <Package className="h-10 w-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
              Recuperação <br />
              <span className="text-blue-500">Garantida.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-sm ml-auto">
              Sistemas de segurança avançados para proteger sua integridade operacional e seus dados corporativos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-10 text-right w-full">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white tracking-tight">AES-256</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Criptografia</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white tracking-tight">Auditável</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registros de Rede</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-sm:px-4 max-w-sm space-y-10 my-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Package className="h-6 w-6" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">Meta ERP</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Recuperar Acesso</h2>
            <p className="text-sm font-medium text-slate-500">
              {isSent 
                ? 'Solicitação processada com sucesso.' 
                : 'Enviaremos instruções detalhadas para o seu e-mail de operação.'}
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="operador@empresa.com" 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-blue-600 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <Button className="w-full h-12 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 group hover:bg-slate-900" type="submit">
                Autorizar Reinicialização
                <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <Mail className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-emerald-800">
                  Instruções despachadas. Siga as orientações enviadas para o seu correio eletrônico corporativo.
                </p>
              </div>
              <Button variant="outline" className="w-full h-12 text-xs font-black uppercase tracking-[0.2em] border-slate-200" onClick={() => setIsSent(false)}>
                Reinserir Credenciais
              </Button>
            </div>
          )}

          <div className="pt-10 border-t border-slate-100 space-y-6">
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Recordou a chave de acesso? <Link to="/login" className="text-blue-600 font-black hover:underline">Voltar ao Login</Link>
            </p>
            
            <p className="text-[10px] text-center text-slate-400 leading-relaxed px-6 opacity-60">
              Protocolo de segurança acionado. Solicitações inválidas repetidas resultarão em bloqueio de IP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
