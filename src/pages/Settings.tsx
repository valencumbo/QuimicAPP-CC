import React, { useState, useEffect } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings2, ShieldCheck, DollarSign } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { settings, products, recipes, suppliers, loading } = useWorkspaceData(user?.uid);
  
  const [formData, setFormData] = useState({
    currency: 'ARS',
    defaultMargin: 35 as number | string
  });
  
  const [usdRate, setUsdRate] = useState<number | string>('');

  useEffect(() => {
    if (settings) {
      setFormData({
        currency: settings.currency || 'ARS',
        defaultMargin: settings.defaultMargin || 35
      });
      setUsdRate(settings.usdRate || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, `workspaces/${user.uid}`), {
        'settings.currency': formData.currency,
        'settings.defaultMargin': Number(formData.defaultMargin) || 0,
        updatedAt: serverTimestamp()
      });
      toast.success('Configuración guardada correctamente');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workspaces/${user.uid}`);
    }
  };

  const handleUpdateUsdRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    const newRate = Number(usdRate);
    if (!newRate || newRate <= 0) return toast.error('Ingresa un valor válido para el dólar');

    try {
      const history = settings?.usdRateHistory || [];
      const newHistoryEntry = { rate: newRate, date: new Date().toISOString() };
      
      const updatedHistory = [newHistoryEntry, ...history].slice(0, 30); // Keep last 30 updates

      await updateDoc(doc(db, `workspaces/${user.uid}`), {
        'settings.usdRate': newRate,
        'settings.usdRateHistory': updatedHistory,
        updatedAt: serverTimestamp()
      });
      toast.success('Cotización del dólar actualizada');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workspaces/${user.uid}`);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="border-b border-border pb-4 flex items-center gap-3">
         <Settings2 className="w-8 h-8 text-primary" />
         <div>
           <h1 className="text-3xl font-bold tracking-tight text-white">Configuración del Entorno</h1>
           <p className="text-muted-foreground mt-1">Ajusta los parámetros operativos y económicos del sistema.</p>
         </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-xl">Variables de Entorno</CardTitle>
            <CardDescription className="text-muted-foreground">Preferencias base para los algoritmos de costeo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Moneda base del sistema</Label>
                <Input required maxLength={5} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value.toUpperCase()})} placeholder="ARS, USD, EUR..." className="bg-input border-border font-mono tracking-widest uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Margen objetivo por defecto (%)</Label>
                <Input type="number" min="0" step="0.01" required value={formData.defaultMargin} onChange={e => setFormData({...formData, defaultMargin: e.target.value})} className="bg-input border-border" />
                <p className="text-xs text-muted-foreground">Se usará para la sugerencia algorítmica de precios.</p>
              </div>
              
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-orange-500">Guardar Entorno</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                 <DollarSign className="w-5 h-5 text-emerald-400" />
                 Paridad Cambiaria (USD)
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Define el valor de conversión para insumos importados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUsdRate} className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="space-y-2 flex-1">
                    <Label className="text-zinc-300">1 USD =</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</div>
                      <Input type="number" step="0.01" min="0" className="pl-8 font-bold text-lg bg-input border-border text-emerald-400" required value={usdRate} onChange={e => setUsdRate(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="bg-zinc-800 text-white hover:bg-zinc-700">Actualizar</Button>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <a href="https://dolarhoy.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 hover:underline font-medium">
                     Ver cotización en DolarHoy
                   </a>
                   {settings?.usdRateHistory && settings.usdRateHistory.length > 0 && (
                      <span className="text-zinc-500 text-xs">
                        Actualizado: {new Date(settings.usdRateHistory[0].date).toLocaleDateString()}
                      </span>
                   )}
                </div>
              </form>
              
              {settings?.usdRateHistory && settings.usdRateHistory.length > 0 && (
                <div className="mt-6 border border-border rounded-lg overflow-hidden bg-muted/20">
                   <div className="px-4 py-2 border-b border-border bg-muted/40">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Historial de variaciones</h4>
                   </div>
                   <div className="max-h-[140px] overflow-y-auto">
                     <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="h-8 text-[10px] text-muted-foreground">Fecha Registrada</TableHead>
                            <TableHead className="h-8 text-[10px] text-muted-foreground text-right">Cotización</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settings.usdRateHistory.map((h: any, i: number) => (
                            <TableRow key={i} className="border-border hover:bg-muted/30">
                              <TableCell className="py-2 text-xs text-zinc-400">{new Date(h.date).toLocaleString('es-AR')}</TableCell>
                              <TableCell className="py-2 text-xs text-right font-medium text-emerald-400">${h.rate}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                     </Table>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-base text-white">Acerca de la Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-primary mb-1 text-sm tracking-tight">Aislamiento de Seguridad Cloud</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                       Tu cuenta está operando bajo reglas de seguridad de Firestore (Security Rules). Los datos están particionados por UUID y previene el acceso no autorizado a los vectores de costo de recetas y proveedores.
                    </p>
                  </div>
               </div>
               
               <div className="space-y-1">
                   <Label className="text-xs text-zinc-400">Credencial de acceso</Label>
                   <Input readOnly disabled value={user?.email || ''} className="font-mono text-xs bg-muted/50 border-border text-zinc-500 h-9" />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
