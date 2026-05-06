import React, { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Purchases() {
  const { user } = useAuth();
  const { settings, products, purchases } = useWorkspaceData(user?.uid);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, productId: string, quantity: number} | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    quantity: '' as number | string,
    unitCost: '' as number | string,
    extraCost: '' as number | string,
    note: '',
    currency: ''
  });

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: settings?.currency || 'ARS' });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const defaultCurrency = selectedProduct?.currency || settings?.currency || 'ARS';
  const selectedCurrency = formData.currency || defaultCurrency;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !formData.productId) return;
    
    const qty = Number(formData.quantity) || 0;
    const cost = Number(formData.unitCost) || 0;
    const extra = Number(formData.extraCost) || 0;

    if (qty <= 0 || cost <= 0) return toast.error('Cantidades inválidas');
    
    if (!selectedProduct) return;

    try {
      const batch = writeBatch(db);
      
      const purchaseId = crypto.randomUUID();
      const purchaseRef = doc(db, `workspaces/${user.uid}/purchases/${purchaseId}`);
      
      batch.set(purchaseRef, {
        ...formData,
        currency: selectedCurrency,
        quantity: qty,
        unitCost: cost,
        extraCost: extra,
        workspaceId: user.uid,
        createdAt: serverTimestamp()
      });

      // Calculate cost taking into account currency
      const purchaseCurrency = selectedCurrency;
      const baseCurrency = settings?.currency || 'ARS';
      
      let rateToProductCurrency = 1;

      // Ensure the product cost matches the product's defined currency
      // If product uses ARS, but purchase was made in USD -> convert purchase to ARS
      // If product uses USD, but purchase was made in ARS -> convert purchase to USD
      const prodCurrency = selectedProduct.currency || baseCurrency;
      if (purchaseCurrency === 'USD' && prodCurrency === 'ARS') {
         rateToProductCurrency = settings?.usdRate || 1;
      } else if (purchaseCurrency === 'ARS' && prodCurrency === 'USD') {
         rateToProductCurrency = 1 / Math.max(settings?.usdRate || 1, 0.01);
      }

      // Update product stock and costs
      const prodRef = doc(db, `workspaces/${user.uid}/products/${selectedProduct.id}`);
      const newStock = (selectedProduct.stock || 0) + qty;
      const totalUnitCostInPurchaseCurrency = cost + (extra / Math.max(qty, 1));
      const totalUnitCostInProductCurrency = totalUnitCostInPurchaseCurrency * rateToProductCurrency;
      
      batch.update(prodRef, {
        stock: newStock,
        purchaseCost: totalUnitCostInProductCurrency,
        extraCost: 0, // Reset extra cost on the product since it's factored into unit cost
        supplier: formData.supplier || selectedProduct.supplier,
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      toast.success('Compra registrada y stock actualizado');
      setFormData({
        productId: '',
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        quantity: '',
        unitCost: '',
        extraCost: '',
        note: '',
        currency: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `workspaces/${user.uid}/purchases/new`);
    }
  };

  const handleDelete = async (id: string, productId: string, quantity: number) => {
    if (!user?.uid) return;

    try {
      const batch = writeBatch(db);
      
      batch.delete(doc(db, `workspaces/${user.uid}/purchases/${id}`));

      const product = products.find(p => p.id === productId);
      if (product) {
        const prodRef = doc(db, `workspaces/${user.uid}/products/${product.id}`);
        batch.update(prodRef, {
          stock: Math.max(0, (product.stock || 0) - quantity),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast.success('Compra revertida y stock ajustado');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/purchases/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compras e Ingresos</h1>
        <p className="text-zinc-500 mt-1">Registra ingreso de mercadería para actualizar stocks y costos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        <Card className="md:col-span-4 sticky top-24">
          <CardHeader className="relative">
            <CardTitle>Nueva Compra</CardTitle>
            <CardDescription>Añade facturas o remitos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
               <div className="space-y-2">
                 <Label>Producto</Label>
                 <Select value={formData.productId} onValueChange={v => {
                    const prod = products.find(p => p.id === v);
                    setFormData({...formData, productId: v, currency: prod?.currency || settings?.currency || 'ARS'})
                 }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto...">
                         {selectedProduct ? `${selectedProduct.name} (${selectedProduct.unit})` : 'Selecciona un producto...'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Fecha</Label>
                 <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Proveedor</Label>
                 <Input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Opcional" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Cantidad</Label>
                   <Input type="number" min="0.01" step="0.01" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Moneda</Label>
                   <Select value={selectedCurrency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        {settings?.currency !== 'ARS' && settings?.currency !== 'USD' && (
                          <SelectItem value={settings?.currency || 'ARS'}>{settings?.currency}</SelectItem>
                        )}
                      </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Costo Unit.</Label>
                   <Input type="number" min="0" step="0.01" required value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Gastos Extra</Label>
                   <Input type="number" min="0" step="0.01" value={formData.extraCost} onChange={e => setFormData({...formData, extraCost: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Nota / Nro. Factura</Label>
                 <Input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
               </div>
               
               <Button type="submit" className="w-full mt-2">Registrar ingreso</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Historial de ingresos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50 border-y">
                <TableRow>
                  <TableHead className="pl-6">Fecha / Proveedor</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Ingreso</TableHead>
                  <TableHead>Total Pago</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-zinc-500">No hay compras registradas.</TableCell>
                  </TableRow>
                ) : (
                  purchases.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(pur => {
                    const product = products.find(p => p.id === pur.productId);
                    const totalCost = (pur.quantity * pur.unitCost) + pur.extraCost;
                    const purCurrency = pur.currency || product?.currency || settings?.currency || 'ARS';
                    const purFormatter = new Intl.NumberFormat(purCurrency === 'USD' ? 'en-US' : 'es-AR', { style: 'currency', currency: purCurrency });
                    return (
                      <TableRow key={pur.id} className="group">
                        <TableCell className="pl-6">
                            <span className="block font-medium">{new Date(pur.date).toLocaleDateString()}</span>
                            <span className="text-xs text-zinc-500">{pur.supplier || 'Sin proveedor'}</span>
                            {pur.note && <span className="block text-xs mt-1 italic text-zinc-400">Ref: {pur.note}</span>}
                        </TableCell>
                        <TableCell className="font-medium text-zinc-900">
                           {product?.name || 'Producto eliminado'}
                        </TableCell>
                        <TableCell>{pur.quantity} {product?.unit || 'un'}</TableCell>
                        <TableCell className="font-bold">{purFormatter.format(totalCost)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="group-hover:opacity-100 opacity-0 hover:text-red-600 transition-opacity" onClick={() => setDeleteConfirm({id: pur.id, productId: pur.productId, quantity: pur.quantity})}>
                             <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deshacer compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción descontará el stock sumado por esta compra y eliminará el registro permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirm) handleDelete(deleteConfirm.id, deleteConfirm.productId, deleteConfirm.quantity);
              setDeleteConfirm(null);
            }} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
