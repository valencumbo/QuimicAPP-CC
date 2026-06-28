import React, { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
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

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceSupplier, setInvoiceSupplier] = useState('');
  const [invoiceNote, setInvoiceNote] = useState('');
  
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '' as number | string,
    unitCost: '' as number | string,
    extraCost: '' as number | string,
    currency: '',
    isBatchEntry: false,
    lotNumber: '',
    expirationDate: '',
    location: ''
  });

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: settings?.currency || 'ARS' });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const defaultCurrency = selectedProduct?.currency || settings?.currency || 'ARS';
  const selectedCurrency = formData.currency || defaultCurrency;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return;
    
    const qty = Number(formData.quantity) || 0;
    const cost = Number(formData.unitCost) || 0;
    
    if (qty <= 0 || cost <= 0) return toast.error('Cantidades inválidas');
    if (!selectedProduct) return;
    
    if (formData.isBatchEntry && (!formData.lotNumber || !formData.expirationDate)) {
      return toast.error("El N° de Lote y Vencimiento son requeridos si se registra como lote.");
    }
    
    setInvoiceItems([...invoiceItems, {
      ...formData,
      productName: selectedProduct.name,
      productUnit: selectedProduct.unit,
      currency: selectedCurrency
    }]);
    
    setFormData({
      productId: '',
      quantity: '',
      unitCost: '',
      extraCost: '',
      currency: '',
      isBatchEntry: false,
      lotNumber: '',
      expirationDate: '',
      location: ''
    });
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async () => {
    if (!user?.uid || invoiceItems.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      
      invoiceItems.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unitCost) || 0;
        const extra = Number(item.extraCost) || 0;
        const product = products.find(p => p.id === item.productId);
        
        if (!product) return;
        
        const purchaseId = crypto.randomUUID();
        const purchaseRef = doc(db, `workspaces/${user.uid}/purchases/${purchaseId}`);
        
        batch.set(purchaseRef, {
          productId: item.productId,
          date: invoiceDate,
          supplier: invoiceSupplier,
          note: invoiceNote,
          quantity: qty,
          unitCost: cost,
          extraCost: extra,
          currency: item.currency,
          isBatchEntry: item.isBatchEntry,
          lotNumber: item.lotNumber,
          expirationDate: item.expirationDate,
          location: item.location,
          workspaceId: user.uid,
          createdAt: serverTimestamp()
        });
        
        const purchaseCurrency = item.currency;
        const baseCurrency = settings?.currency || 'ARS';
        let rateToProductCurrency = 1;

        const prodCurrency = product.currency || baseCurrency;
        if (purchaseCurrency === 'USD' && prodCurrency === 'ARS') {
           rateToProductCurrency = settings?.usdRate || 1;
        } else if (purchaseCurrency === 'ARS' && prodCurrency === 'USD') {
           rateToProductCurrency = 1 / Math.max(settings?.usdRate || 1, 0.01);
        }

        const prodRef = doc(db, `workspaces/${user.uid}/products/${product.id}`);
        const currentStock = product.stock || 0;
        const currentCost = product.purchaseCost || 0;
        const newStock = currentStock + qty;
        
        const totalUnitCostInPurchaseCurrency = cost + (extra / Math.max(qty, 1));
        const totalUnitCostInProductCurrency = totalUnitCostInPurchaseCurrency * rateToProductCurrency;
        
        let newAverageCost = totalUnitCostInProductCurrency;
        if (currentStock > 0 && newStock > 0) {
           newAverageCost = ((currentStock * currentCost) + (qty * totalUnitCostInProductCurrency)) / newStock;
        }

        batch.update(prodRef, {
          stock: newStock,
          purchaseCost: newAverageCost,
          extraCost: 0,
          supplier: invoiceSupplier || product.supplier,
          updatedAt: serverTimestamp()
        });

        if (item.isBatchEntry) {
          const lotId = crypto.randomUUID();
          const lotRef = doc(db, `workspaces/${user.uid}/batches/${lotId}`);
          batch.set(lotRef, {
            workspaceId: user.uid,
            productId: product.id,
            lotNumber: item.lotNumber,
            expirationDate: item.expirationDate,
            initialQuantity: qty,
            currentQuantity: qty,
            location: item.location || '',
            supplierId: '',
            unitCost: totalUnitCostInProductCurrency,
            currency: product.currency || settings?.currency || 'ARS',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      });

      await batch.commit();

      toast.success('Factura registrada y stocks actualizados');
      setInvoiceItems([]);
      setInvoiceSupplier('');
      setInvoiceNote('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `workspaces/${user.uid}/purchases/invoice`);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-border pb-4 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Compras e Ingresos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Registra ingreso de mercadería para actualizar stocks y costos.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        <Card className="md:col-span-4 sticky top-24 bg-card border-border shadow-lg">
          <CardHeader className="relative border-b border-border bg-muted/30">
            <CardTitle className="text-white">Nueva Compra</CardTitle>
            <CardDescription className="text-muted-foreground">Añade facturas o remitos</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 mb-6 pb-6 border-b border-border">
               <div className="space-y-2">
                 <Label className="text-zinc-300">Fecha de Factura</Label>
                 <Input type="date" required value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="bg-input border-border" />
               </div>
               <div className="space-y-2">
                 <Label className="text-zinc-300">Proveedor</Label>
                 <Input type="text" value={invoiceSupplier} onChange={e => setInvoiceSupplier(e.target.value)} placeholder="Opcional" className="bg-input border-border" />
               </div>
               <div className="space-y-2">
                 <Label className="text-zinc-300">Nota / Nro. Factura</Label>
                 <Input type="text" value={invoiceNote} onChange={e => setInvoiceNote(e.target.value)} className="bg-input border-border" />
               </div>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
               <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Agregar Ítem</h3>
               <div className="space-y-2">
                 <Label className="text-zinc-300">Producto</Label>
                 <Select value={formData.productId} onValueChange={v => {
                    const prod = products.find(p => p.id === v);
                    setFormData({...formData, productId: v, currency: prod?.currency || settings?.currency || 'ARS'})
                 }}>
                    <SelectTrigger className="bg-input border-border text-white">
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
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-zinc-300">Cantidad ({selectedProduct?.unit || '-'})</Label>
                   <Input type="number" min="0.01" step="0.01" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="bg-input border-border font-mono text-right" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-zinc-300">Moneda</Label>
                   <Select value={selectedCurrency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger className="bg-input border-border text-white"><SelectValue/></SelectTrigger>
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
                   <Label className="text-zinc-300">Costo Unit.</Label>
                   <Input type="number" min="0" step="0.01" required value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: e.target.value})} className="bg-input border-border font-mono text-right" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-zinc-300">Gastos Extra</Label>
                   <Input type="number" min="0" step="0.01" value={formData.extraCost} onChange={e => setFormData({...formData, extraCost: e.target.value})} className="bg-input border-border font-mono text-right" />
                 </div>
               </div>
               
               <div className="border border-border rounded-md p-4 bg-muted/20 space-y-3 mt-4">
                 <div className="flex items-center space-x-2">
                   <input 
                     type="checkbox" 
                     id="isBatchEntry" 
                     className="rounded border-border bg-input shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-primary w-4 h-4 cursor-pointer"
                     checked={formData.isBatchEntry}
                     onChange={(e) => setFormData({...formData, isBatchEntry: e.target.checked})}
                   />
                   <Label htmlFor="isBatchEntry" className="font-medium cursor-pointer text-zinc-300 text-sm">Registrar como Lote (trazabilidad)</Label>
                 </div>
                 
                 {formData.isBatchEntry && (
                   <div className="space-y-3 pt-3 border-t border-border/50">
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <Label className="text-[10px] uppercase font-bold text-zinc-400">N° Lote *</Label>
                         <Input required className="h-9 text-sm bg-input border-border font-mono" value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} placeholder="Ej: L-1004" />
                       </div>
                       <div className="space-y-1">
                         <Label className="text-[10px] uppercase font-bold text-zinc-400">Vencimiento *</Label>
                         <Input required type="date" className="h-9 text-sm bg-input border-border" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
                       </div>
                     </div>
                     <div className="space-y-1">
                       <Label className="text-[10px] uppercase font-bold text-zinc-400">Ubicación física</Label>
                       <Input className="h-9 text-sm bg-input border-border" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej: Depósito 1, Estante A..." />
                     </div>
                   </div>
                 )}
               </div>

               <Button type="submit" className="w-full mt-2 bg-muted hover:bg-muted/80 text-white font-medium h-10 border border-border">
                 <Plus className="w-4 h-4 mr-2" /> Agregar al remito
               </Button>
            </form>

            {invoiceItems.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-border pb-2">Ítems a registrar</h3>
                <div className="space-y-2">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border/50 text-sm">
                       <div>
                         <div className="font-medium text-white">{item.productName}</div>
                         <div className="text-xs text-zinc-400">
                           {item.quantity} {item.productUnit} a {item.currency} {item.unitCost}
                           {item.extraCost ? ` (+ ${item.extraCost} extra)` : ''}
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400" onClick={() => handleRemoveItem(idx)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveInvoice} className="w-full mt-4 bg-primary hover:bg-orange-500 text-white font-bold h-11 shadow-lg shadow-primary/20">
                  Guardar Factura Completa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-8 bg-card border-border shadow-lg">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-white">Historial de ingresos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="pl-6 text-muted-foreground text-xs uppercase tracking-wider font-bold">Fecha / Proveedor</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Producto</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-bold text-right">Ingreso</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-bold text-right">Total Pago</TableHead>
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
                      <TableRow key={pur.id} className="border-border hover:bg-muted/30 group">
                        <TableCell className="pl-6 py-4">
                            <span className="block font-medium text-zinc-300 font-mono text-sm">{new Date(pur.date).toLocaleDateString()}</span>
                            <span className="text-xs text-zinc-500">{pur.supplier || 'Sin proveedor'}</span>
                            {pur.note && <span className="block text-xs mt-1 italic text-zinc-600">Ref: {pur.note}</span>}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                           {product?.name || 'Producto eliminado'}
                        </TableCell>
                        <TableCell className="text-right text-zinc-300 font-mono text-sm">{pur.quantity} <span className="text-zinc-500">{product?.unit || 'un'}</span></TableCell>
                        <TableCell className="font-bold text-primary text-right font-mono text-sm">{purFormatter.format(totalCost)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteConfirm({id: pur.id, productId: pur.productId, quantity: pur.quantity})}>
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
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Deshacer compra?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta acción descontará el stock sumado por esta compra y eliminará el registro permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted text-zinc-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirm) handleDelete(deleteConfirm.id, deleteConfirm.productId, deleteConfirm.quantity);
              setDeleteConfirm(null);
            }} className="bg-red-600 hover:bg-red-500 text-white">Ejecutar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
