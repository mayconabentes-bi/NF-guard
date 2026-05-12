import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User, Package, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signUp(email, password, fullName);
      
      if (error) throw error;
      
      if (data.user && data.session) {
        toast.success('Conta criada com sucesso!');
        navigate('/');
      } else {
        toast.success('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar cadastro.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Visual Side - Industrial Aesthetic */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(37,99,235,0.3)]">
            <Package className="h-10 w-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
              Inovação <br />
              <span className="text-blue-500">Operacional.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              Junte-se à plataforma definitiva para gestão de recursos e suprimentos logísticos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-10">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white tracking-tight">Enterprise</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nível de Serviço</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white tracking-tight">Global</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Escalabilidade</p>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-4">
              <UserPlus className="h-3 w-3" /> Nova Conta
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Solicitar Acesso</h2>
            <p className="text-sm font-medium text-slate-500">Crie seu perfil corporativo para acessar o terminal operacional.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="fullName" 
                    placeholder="Nome e Sobrenome" 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-blue-600 transition-all font-medium"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Criar Senha Segura</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo de 8 caracteres"
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-blue-600 transition-all font-medium"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button className="w-full h-12 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 group" type="submit" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Finalizar Cadastro'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="pt-10 border-t border-slate-100 space-y-6">
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Já possui registro ativo? <Link to="/login" className="text-blue-600 font-black hover:underline">Ir para o Login</Link>
            </p>
            
            <p className="text-[10px] text-center text-slate-400 leading-relaxed px-6 opacity-60">
              Uso restrito a funcionários autorizados. Todas as tentativas de acesso são monitoradas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
