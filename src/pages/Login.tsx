import React, { useState } from 'react';
import { Navigate, Link } from 'react-router';
import { useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { signInWithEmailAndPassword, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import ShinyText from '@/src/components/ShinyText';

const PasswordRequirements = ({ password }: { password: string }) => {
  const hasLength = password.length > 6;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumberOrSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);

  return (
    <div className="space-y-2 mt-3 text-xs">
      <div className={`flex items-center gap-2 transition-colors ${hasLength ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${hasLength ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-transparent'}`}>
          <Check className="w-2.5 h-2.5" />
        </div>
        Más de 6 caracteres
      </div>
      <div className={`flex items-center gap-2 transition-colors ${hasLetter ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${hasLetter ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-transparent'}`}>
          <Check className="w-2.5 h-2.5" />
        </div>
        Al menos una letra
      </div>
      <div className={`flex items-center gap-2 transition-colors ${hasNumberOrSymbol ? 'text-emerald-500' : 'text-zinc-500'}`}>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${hasNumberOrSymbol ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-transparent'}`}>
          <Check className="w-2.5 h-2.5" />
        </div>
        Al menos un número o símbolo
      </div>
    </div>
  );
};

export default function Login() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'login' | 'change_password' | 'forgot_password'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Current password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (user && view === 'login') return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email) return;
    
    if (view !== 'forgot_password' && !password) return;
    
    if (view === 'forgot_password') {
      setSubmitting(true);
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
        setView('login');
        setPassword('');
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          setErrorMessage('No existe un usuario con este correo electrónico.');
        } else {
          setErrorMessage('Error al enviar el correo. Por favor, inténtalo de nuevo.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }
    
    if (view === 'change_password') {
      const hasLength = newPassword.length > 6;
      const hasLetter = /[A-Za-z]/.test(newPassword);
      const hasNumberOrSymbol = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);
      
      if (!hasLength || !hasLetter || !hasNumberOrSymbol) {
        return setErrorMessage('La nueva contraseña no cumple con los requisitos.');
      }
      if (newPassword !== confirmPassword) {
        return setErrorMessage('Las nuevas contraseñas no coinciden.');
      }
    }
    
    setSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (view === 'change_password') {
        await updatePassword(userCredential.user, newPassword);
        toast.success('Contraseña cambiada exitosamente.');
        setView('login');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      if (view === 'change_password') {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setErrorMessage('La contraseña actual es incorrecta.');
        } else {
          setErrorMessage('No se pudo cambiar la contraseña. Verifica tus datos.');
        }
      } else {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setErrorMessage('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
        } else if (error.code === 'auth/user-not-found') {
          setErrorMessage('No existe un usuario con este correo electrónico.');
        } else {
          setErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden selection:bg-primary/30 selection:text-primary">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
      <Card className="w-full max-w-sm bg-card border-border shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          {view !== 'login' && (
            <button 
              onClick={() => {
                setView('login');
                setPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrorMessage(null);
              }}
              className="absolute top-4 left-4 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <ShinyText
            text="QuimicAPP"
            className="font-bold tracking-tight text-3xl mb-2"
            speed={2}
            delay={0}
            color="#b5b5b5"
            shineColor="#ffffff"
            spread={120}
            direction="left"
          />
          <CardDescription className="text-zinc-400 mt-1">
            Plataforma de gestión y costeo
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="bg-input border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-primary"
              />
            </div>
            
            {view !== 'forgot_password' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  {view === 'change_password' ? 'Contraseña actual' : 'Contraseña'}
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-input border-border text-foreground focus-visible:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {view === 'change_password' && (
              <>
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label htmlFor="newPassword" className="text-zinc-300">Nueva contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? 'text' : 'password'} 
                      required 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="bg-input border-border text-foreground focus-visible:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordRequirements password={newPassword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-300">Repetir nueva contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      required 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-input border-border text-foreground focus-visible:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {errorMessage && (
              <div className="text-sm font-medium text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-orange-500 text-white font-bold h-12 mt-2" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {view === 'change_password' ? 'Actualizar Contraseña' : view === 'forgot_password' ? 'Enviar correo de recuperación' : 'Ingresar al sistema'}
            </Button>
            
            {view === 'login' && (
              <div className="flex flex-col space-y-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setView('forgot_password');
                    setErrorMessage(null);
                  }}
                  className="text-sm text-zinc-400 hover:text-white hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setView('change_password');
                    setErrorMessage(null);
                  }}
                  className="text-sm text-zinc-400 hover:text-white hover:underline transition-colors"
                >
                  Cambiar contraseña actual
                </button>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center border-t border-border/50 pt-4 mt-2">
          <Link to="/">
            <Button variant="ghost" className="text-sm text-zinc-400 hover:text-white hover:bg-muted">
              Volver a la página principal
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
