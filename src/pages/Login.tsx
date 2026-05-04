import React, { useState } from 'react';
import { Navigate, Link } from 'react-router';
import { useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-zinc-400 w-8 h-8" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-2xl mb-4">
            C
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Acceso Exclusivo</CardTitle>
          <CardDescription>
            Ingresa los datos de cuenta provistos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ingresar a la plataforma
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <Link to="/">
            <Button variant="ghost" className="text-sm">
              Volver a la página principal
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
