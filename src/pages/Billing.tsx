import { useState, useEffect } from 'react';
import { useAuth, useWorkspaceData } from '@/src/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, orderBy, query, where, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, Eye, Download, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Billing() {
  const { user } = useAuth();
  const { settings, products, recipes } = useWorkspaceData(user?.uid);
  
  const [sales, setSales] = useState<any[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewSaleDetails, setViewSaleDetails] = useState<any | null>(null);
  
  const [clientName, setClientName] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const loadSales = async () => {
      try {
        const q = query(collection(db, `workspaces/${user.uid}/sales`), where('workspaceId', '==', user.uid), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setSales(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch (err) {
        console.error(err);
      }
    };
    loadSales();
  }, [user?.uid]);

  const defaultCurrency = settings?.currency || 'ARS';

  // Format currency
  const formatMoney = (amount: number, curr: string) => {
    return new Intl.NumberFormat(curr === 'USD' ? 'en-US' : 'es-AR', { style: 'currency', currency: curr }).format(amount);
  };

  const exchangeRate = settings?.usdRate || 1;

  const handleAddItem = () => {
    setItems([...items, { itemId: '', isRecipe: false, quantity: '', customPrice: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price
    if (field === 'isRecipe') {
      newItems[index].itemId = '';
      newItems[index].customPrice = '';
    } else if (field === 'itemId') {
      const isR = newItems[index].isRecipe;
      const tId = value;
      
      if (isR) {
        const rec = recipes.find(r => r.id === tId);
        if (rec) {
           let price = rec.salePrice;
           const pCurr = defaultCurrency; // Recipes fallback to base currency usually
           if (pCurr === 'USD' && currency === 'ARS') price *= exchangeRate;
           if (pCurr === 'ARS' && currency === 'USD') price /= exchangeRate;
           newItems[index].customPrice = price;
        } else {
           newItems[index].customPrice = '';
        }
      } else {
        const prod = products.find(p => p.id === tId);
        if (prod) {
           let price = prod.salePrice;
           const pCurr = prod.currency || defaultCurrency;
           if (pCurr === 'USD' && currency === 'ARS') price *= exchangeRate;
           if (pCurr === 'ARS' && currency === 'USD') price /= exchangeRate;
           newItems[index].customPrice = price;
        } else {
           newItems[index].customPrice = '';
        }
      }
    }
    
    setItems(newItems);
  };

  const totalAmount = items.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.customPrice) || 0)), 0);

  const [editSaleId, setEditSaleId] = useState<string | null>(null);

  const handleEditSale = (s: any) => {
    setEditSaleId(s.id);
    setClientName(s.clientName);
    setCurrency(s.currency || defaultCurrency);
    setItems(s.items);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    if (items.length === 0) return toast.error('Debes agregar al menos un ítem.');
    if (!clientName) return toast.error('Ingresa el nombre del cliente.');
    
    try {
      const batch = writeBatch(db);
      
      const itemsToSave = items.map(it => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        customPrice: Number(it.customPrice) || 0
      }));

      const stockDiff: Record<string, number> = {};

      // Calculate old stock to revert
      if (editSaleId) {
        const originalSale = sales.find(s => s.id === editSaleId);
        if (originalSale && originalSale.items) {
          for (const it of originalSale.items) {
            if (!it.isRecipe && it.itemId) {
              stockDiff[it.itemId] = (stockDiff[it.itemId] || 0) + (Number(it.quantity) || 0);
            }
          }
        }
      }

      // Calculate new stock to deduct
      for (const it of itemsToSave) {
        if (!it.isRecipe && it.itemId) {
          stockDiff[it.itemId] = (stockDiff[it.itemId] || 0) - it.quantity;
        }
      }

      const saleRef = editSaleId 
        ? doc(db, `workspaces/${user.uid}/sales/${editSaleId}`) 
        : doc(collection(db, `workspaces/${user.uid}/sales`));

      if (editSaleId) {
        batch.update(saleRef, {
          clientName,
          date: new Date().toISOString().split('T')[0],
          currency,
          items: itemsToSave,
          totalAmount,
          updatedAt: serverTimestamp()
        });
      } else {
        batch.set(saleRef, {
          workspaceId: user.uid,
          clientName,
          date: new Date().toISOString().split('T')[0],
          currency,
          items: itemsToSave,
          totalAmount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Apply net stock updates
      for (const [productId, diff] of Object.entries(stockDiff)) {
        if (diff === 0) continue;
        const prod = products.find(p => p.id === productId);
        if (prod) {
          const prodRef = doc(db, `workspaces/${user.uid}/products/${productId}`);
          batch.update(prodRef, {
            stock: Math.max(0, (prod.stock || 0) + diff),
            updatedAt: serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      
      toast.success(editSaleId ? 'Venta actualizada exitosamente.' : 'Factura/Cotización guardada exitosamente.');
      setItems([]);
      setClientName('');
      setEditSaleId(null);
      
      const q = query(collection(db, `workspaces/${user.uid}/sales`), where('workspaceId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setSales(snap.docs.map(d => ({id: d.id, ...d.data()})));

    } catch (err) {
      handleFirestoreError(err, editSaleId ? OperationType.UPDATE : OperationType.CREATE, `workspaces/${user.uid}/sales`);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/sales/${id}`));
      toast.success('Venta eliminada.');
      setSales(sales.filter(s => s.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/sales/${id}`);
    }
  };

  const exportToPdf = () => {
    if (!viewSaleDetails) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Detalle de Venta', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${viewSaleDetails.clientName}`, 14, 32);
    doc.text(`Fecha: ${new Date(viewSaleDetails.createdAt?.toMillis ? viewSaleDetails.createdAt.toMillis() : Date.now()).toLocaleDateString()}`, 14, 40);
    
    const tableData = viewSaleDetails.items.map((it: any) => {
      const itemName = it.isRecipe 
        ? recipes.find(r => r.id === it.itemId)?.name || 'Receta Eliminada'
        : products.find(p => p.id === it.itemId)?.name || 'Producto Eliminado';
      
      return [
        itemName,
        it.isRecipe ? 'Receta' : 'Producto',
        it.quantity,
        formatMoney(it.customPrice || 0, viewSaleDetails.currency),
        formatMoney((it.quantity || 0) * (it.customPrice || 0), viewSaleDetails.currency)
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Ítem', 'Tipo', 'Cant.', 'Precio U.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] } // amber-500
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${formatMoney(viewSaleDetails.totalAmount, viewSaleDetails.currency)}`, 14, finalY + 10);

    doc.save(`Venta_${viewSaleDetails.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación / Ventas</h1>
          <p className="text-zinc-500 mt-1">Registra ventas y emite cotizaciones a tus clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm border-zinc-200/60 md:col-span-2">
          <CardHeader>
            <CardTitle>Nueva Venta</CardTitle>
            <CardDescription>Añade los productos, define las cantidades y registra la venta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>Cliente / Referencia</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej. Juan Pérez" />
               </div>
               <div className="space-y-2">
                 <Label>Moneda de la Factura</Label>
                 <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
            </div>
            
            <div className="border border-zinc-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 w-24">Cantidad</th>
                      <th className="px-4 py-3 w-28">Precio U.</th>
                      <th className="px-4 py-3">Subtotal</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((it, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-2">
                           <Select value={it.isRecipe ? 'recipe' : 'product'} onValueChange={v => updateItem(idx, 'isRecipe', v === 'recipe')}>
                              <SelectTrigger className="w-28 border-0 shadow-none">
                                <SelectValue>
                                  {it.isRecipe ? 'Receta' : 'Prod.'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">Prod.</SelectItem>
                                <SelectItem value="recipe">Receta</SelectItem>
                              </SelectContent>
                           </Select>
                        </td>
                        <td className="px-4 py-2">
                           <Select value={it.itemId || undefined} onValueChange={v => updateItem(idx, 'itemId', v)}>
                              <SelectTrigger className="w-full border-0 shadow-none">
                                <SelectValue placeholder="Seleccionar...">
                                  {it.itemId 
                                     ? (it.isRecipe 
                                         ? recipes.find(r => r.id === it.itemId)?.name 
                                         : products.find(p => p.id === it.itemId)?.name) 
                                     : ''}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {it.isRecipe ? 
                                    recipes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>) :
                                    products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                }
                              </SelectContent>
                           </Select>
                        </td>
                        <td className="px-4 py-2">
                           <Input type="number" min="0.1" step="any" value={it.quantity === '' ? '' : it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))} className="w-20" />
                        </td>
                        <td className="px-4 py-2">
                           <Input type="number" min="0" step="any" value={it.customPrice === '' ? '' : it.customPrice} onChange={e => updateItem(idx, 'customPrice', e.target.value === '' ? '' : Number(e.target.value))} className="w-24" />
                        </td>
                        <td className="px-4 py-2 font-medium">
                           {it.quantity !== '' && it.customPrice !== '' ? formatMoney(Number(it.quantity) * Number(it.customPrice), currency) : ''}
                        </td>
                        <td className="px-4 py-2">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-sm">
                          No hay ítems en esta venta.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="bg-zinc-50 p-4 flex justify-between items-center border-t border-zinc-200">
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ítem
                  </Button>
                  <div className="text-lg flex items-center">
                     <span className="text-zinc-500 mr-2">Total:</span>
                     <span className="font-bold tracking-tight text-xl text-zinc-900 bg-white px-3 py-1 rounded-md border border-zinc-200 shadow-sm">{formatMoney(totalAmount, currency)}</span>
                  </div>
                </div>
            </div>

            <div className="flex justify-end pt-2 gap-3">
               {editSaleId && (
                  <Button variant="ghost" onClick={() => {
                     setEditSaleId(null);
                     setClientName('');
                     setItems([]);
                  }}>Cancelar</Button>
               )}
               <Button onClick={handleSave} className="h-12 px-8 text-base font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950">
                 {editSaleId ? 'Guardar Cambios' : 'Registrar Venta'}
               </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <h2 className="text-xl font-bold tracking-tight mb-4 mt-6">Historial de Ventas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
             {sales.map(s => (
               <Card key={s.id} className="shadow-sm border-zinc-200/60 transition-all hover:shadow-md">
                 <CardHeader className="pb-3">
                   <div className="flex justify-between items-start">
                     <div className="min-w-0 pr-1">
                       <CardTitle className="text-base truncate" title={s.clientName}>{s.clientName}</CardTitle>
                       <CardDescription>{new Date(s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now()).toLocaleDateString()}</CardDescription>
                     </div>
                     <div className="flex -mt-1 -mr-1 flex-shrink-0">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => setViewSaleDetails(s)}>
                         <Eye className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => handleEditSale(s)}>
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50" onClick={() => setDeleteConfirmId(s.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="text-xl font-bold tracking-tight text-amber-600">
                     {formatMoney(s.totalAmount, s.currency || 'ARS')}
                   </div>
                   <div className="text-xs text-zinc-500 mt-2">
                     {s.items.length} ítem{s.items.length !== 1 && 's'}
                   </div>
                 </CardContent>
               </Card>
             ))}
             {sales.length === 0 && (
               <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center py-12 text-zinc-500 bg-white border border-dashed rounded-xl">
                 Aún no has registrado ninguna venta.
               </div>
             )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro de venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el registro de venta permanentemente de tu base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmId) handleDeleteSale(deleteConfirmId);
              setDeleteConfirmId(null);
            }} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewSaleDetails} onOpenChange={(open) => !open && setViewSaleDetails(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Venta - {viewSaleDetails?.clientName}</DialogTitle>
            <DialogDescription>
              Fecha: {viewSaleDetails && new Date(viewSaleDetails.createdAt?.toMillis ? viewSaleDetails.createdAt.toMillis() : Date.now()).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border rounded-md overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Ítem</th>
                  <th className="px-4 py-2 text-center">Tipo</th>
                  <th className="px-4 py-2 text-right">Cant.</th>
                  <th className="px-4 py-2 text-right">Precio U.</th>
                  <th className="px-4 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y text-zinc-700">
                {viewSaleDetails?.items.map((it: any, i: number) => {
                  const itemName = it.isRecipe 
                    ? recipes.find(r => r.id === it.itemId)?.name || 'Receta Eliminada'
                    : products.find(p => p.id === it.itemId)?.name || 'Producto Eliminado';
                  
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2">{itemName}</td>
                      <td className="px-4 py-2 text-center text-xs text-zinc-500">{it.isRecipe ? 'Receta' : 'Producto'}</td>
                      <td className="px-4 py-2 text-right">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(it.customPrice || 0, viewSaleDetails.currency)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatMoney((it.quantity || 0) * (it.customPrice || 0), viewSaleDetails.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-zinc-50 border-t">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-amber-600">{viewSaleDetails && formatMoney(viewSaleDetails.totalAmount, viewSaleDetails.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <DialogFooter className="flex items-center sm:justify-between">
            <Button variant="outline" className="mr-auto border-amber-200 text-amber-700 hover:bg-amber-50 group" onClick={exportToPdf}>
              <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
              Descargar PDF
            </Button>
            <Button variant="outline" onClick={() => setViewSaleDetails(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
