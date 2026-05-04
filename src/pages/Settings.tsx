import React, { useState, useEffect } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Settings() {
  const { user } = useAuth();
  const { settings, loading } = useWorkspaceData(user?.uid);
  
  const [formData, setFormData] = useState({
    currency: 'ARS',
    defaultMargin: 35 as number | string,
    lowStockLimit: 5 as number | string
  });
  
  const [usdRate, setUsdRate] = useState<number | string>('');

  useEffect(() => {
    if (settings) {
      setFormData({
        currency: settings.currency || 'ARS',
        defaultMargin: settings.defaultMargin || 35,
        lowStockLimit: settings.lowStockLimit || 5
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
        'settings.lowStockLimit': Number(formData.lowStockLimit) || 0,
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
         <p className="text-zinc-500 mt-1">Ajusta los parámetros de tu negocio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
            <CardDescription>Preferencias básicas para los cálculos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Moneda base de la cuenta</Label>
                <Input required maxLength={5} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value.toUpperCase()})} placeholder="ARS, USD, EUR..." />
              </div>
              <div className="space-y-2">
                <Label>Margen objetivo por defecto (%)</Label>
                <Input type="number" min="0" step="0.01" required value={formData.defaultMargin} onChange={e => setFormData({...formData, defaultMargin: e.target.value})} />
                <p className="text-xs text-zinc-500">Se usará sugerencia de precios cuando crees nuevos productos.</p>
              </div>
              <div className="space-y-2">
                <Label>Límite de bajo stock</Label>
                <Input type="number" min="0" step="0.01" required value={formData.lowStockLimit} onChange={e => setFormData({...formData, lowStockLimit: e.target.value})} />
                <p className="text-xs text-zinc-500">Recibirás alertas cuando un producto esté por debajo de este stock.</p>
              </div>
              
              <Button type="submit">Guardar Cambios</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Cotización del Dólar</CardTitle>
              <CardDescription>
                Define el valor del dólar para calcular automáticamente costos de insumos y productos configurados en USD.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUsdRate} className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="space-y-2 flex-1">
                    <Label>Valor 1 USD = ARS</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</div>
                      <Input type="number" step="0.01" min="0" className="pl-8 font-bold" required value={usdRate} onChange={e => setUsdRate(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit">Actualizar</Button>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <a href="https://dolarhoy.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
                     Ver cotización en DolarHoy
                   </a>
                   {settings?.usdRateHistory && settings.usdRateHistory.length > 0 && (
                      <span className="text-zinc-500 text-xs">
                        Última actualización: {new Date(settings.usdRateHistory[0].date).toLocaleDateString()}
                      </span>
                   )}
                </div>
              </form>
              
              {settings?.usdRateHistory && settings.usdRateHistory.length > 0 && (
                <div className="mt-8 border rounded-lg overflow-hidden">
                   <div className="bg-zinc-50 px-4 py-2 border-b">
                      <h4 className="text-sm font-semibold text-zinc-700">Historial de variaciones</h4>
                   </div>
                   <div className="max-h-[160px] overflow-y-auto">
                     <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8 text-xs">Fecha</TableHead>
                            <TableHead className="h-8 text-xs text-right">Valor Registrado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settings.usdRateHistory.map((h, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-2 text-xs text-zinc-600">{new Date(h.date).toLocaleString('es-AR')}</TableCell>
                              <TableCell className="py-2 text-xs text-right font-medium">${h.rate}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                     </Table>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Acerca de tu cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                  <h4 className="font-semibold text-amber-900 mb-1 text-sm">Aislamiento de Seguridad</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                     Tu cuenta está sincronizada con Firebase Enterprise Cloud, y el motor de Firestore Security Rules previene que otros usuarios puedan acceder o modificar tus datos, o tus configuraciones.
                  </p>
               </div>
               
               <div className="space-y-1">
                   <Label className="text-xs text-zinc-500">Email asociado</Label>
                   <Input readOnly disabled value={user?.email || ''} className="font-mono text-xs bg-zinc-50 h-8" />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
