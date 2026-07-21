import React, { useState, useMemo } from 'react';
import { useWorkspaceData, useAuth, Batch, useAuditLog } from '../lib/hooks';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Plus, Search, Trash2, CalendarCheck2, Beaker, MapPin, Edit3, Printer, Download, TestTube2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectSearch } from '@/components/ui/select-search';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Lotes() {
  const { user } = useAuth();
  const workspaceId = user?.uid;
  const { batches, products, suppliers, settings, loading } = useWorkspaceData(workspaceId);
  const { logAction } = useAuditLog();
  const [search, setSearch] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printBatch, setPrintBatch] = useState<Batch | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [searchProduct, setSearchProduct] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    lotNumber: '',
    manufacturingDate: '',
    expirationDate: '',
    initialQuantity: '',
    currentQuantity: '',
    location: '',
    supplierId: 'none',
    unitCost: '',
    currency: 'ARS',
    notes: ''
  });

  const getExpirationStatus = (expDateStr: string) => {
    if (!expDateStr) return { status: 'unknown', text: 'Desconocido', color: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700' };
    const expDate = new Date(expDateStr);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', text: 'Vencido', color: 'bg-red-500/10 text-red-400 border border-red-500/20' };
    if (diffDays <= 30) return { status: 'danger', text: 'Riesgo (< 30 días)', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' };
    if (diffDays <= 90) return { status: 'warning', text: 'Atención (< 90 días)', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    return { status: 'ok', text: 'Vigente', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
  };

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const prod = products.find(p => p.id === b.productId);
      const prodName = prod?.name || '';
      return prodName.toLowerCase().includes(search.toLowerCase()) || 
             b.lotNumber.toLowerCase().includes(search.toLowerCase()) || 
             (b.location || '').toLowerCase().includes(search.toLowerCase());
    }).sort((a, b) => new Date(a.expirationDate || 0).getTime() - new Date(b.expirationDate || 0).getTime());
  }, [batches, products, search]);

  const handleOpenDialog = (batch?: Batch) => {
    if (batch) {
      setEditId(batch.id);
      setFormData({
        productId: batch.productId,
        lotNumber: batch.lotNumber,
        manufacturingDate: batch.manufacturingDate || '',
        expirationDate: batch.expirationDate || '',
        initialQuantity: String(batch.initialQuantity),
        currentQuantity: String(batch.currentQuantity),
        location: batch.location || '',
        supplierId: batch.supplierId || 'none',
        unitCost: String(batch.unitCost),
        currency: batch.currency || settings?.currency || 'ARS',
        notes: batch.notes || ''
      });
    } else {
      setEditId(null);
      setFormData({
         productId: '', lotNumber: '', manufacturingDate: '', expirationDate: '',
         initialQuantity: '', currentQuantity: '', location: '', supplierId: 'none', unitCost: '', currency: settings?.currency || 'ARS', notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.lotNumber || !formData.expirationDate || !workspaceId) {
      return toast.error("El producto, código de lote y fecha de vencimiento son obligatorios.");
    }

    try {
      const isNew = !editId;
      const id = editId || crypto.randomUUID();
      const ref = doc(collection(db, `workspaces/${workspaceId}/batches`), id);
      
      const payload: any = {
        workspaceId: workspaceId,
        productId: formData.productId,
        lotNumber: formData.lotNumber,
        manufacturingDate: formData.manufacturingDate,
        expirationDate: formData.expirationDate,
        initialQuantity: Number(formData.initialQuantity) || 0,
        currentQuantity: Number(formData.currentQuantity) || 0,
        location: formData.location,
        supplierId: formData.supplierId === 'none' ? '' : formData.supplierId,
        unitCost: Number(formData.unitCost) || 0,
        currency: formData.currency,
        notes: formData.notes,
        updatedAt: serverTimestamp()
      };

      if (isNew) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(ref, payload, { merge: true });

      const prod = products.find(p => p.id === formData.productId);
      if (isNew) {
        await logAction('create', 'lote', `Creó lote ${formData.lotNumber} para ${prod?.name || 'producto'}`, id);
      } else {
        await logAction('update', 'lote', `Actualizó lote ${formData.lotNumber} para ${prod?.name || 'producto'}`, id);
      }

      toast.success(`Lote ${isNew ? 'creado' : 'actualizado'} exitosamente.`);
      setIsDialogOpen(false);
    } catch(err) {
      handleFirestoreError(err, editId ? OperationType.UPDATE : OperationType.CREATE, `workspaces/${workspaceId}/batches`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || !workspaceId) return;
    try {
      const b = batches.find(x => x.id === deleteConfirmId);
      await deleteDoc(doc(db, `workspaces/${workspaceId}/batches/${deleteConfirmId}`));
      if (b) {
         await logAction('delete', 'lote', `Eliminó lote ${b.lotNumber}`, deleteConfirmId);
      }
      toast.success('Lote eliminado exitosamente.');
      setDeleteConfirmId(null);
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${workspaceId}/batches/${deleteConfirmId}`);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <TestTube2 className="w-8 h-8 text-primary" />
            Lotes y Vencimientos
          </h1>
          <p className="text-muted-foreground mt-2">Gestión de stock, trazabilidad y control de calidad por lote.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-orange-500 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lote
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por lote, producto o ubicación..." 
            className="pl-9 bg-card border-border text-foreground focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card shadow-lg overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Producto</TableHead>
              <TableHead className="text-muted-foreground">Lote #</TableHead>
              <TableHead className="w-[120px] text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Vencimiento</TableHead>
              <TableHead className="text-right text-muted-foreground">Stock</TableHead>
              <TableHead className="text-right text-muted-foreground">Ubicación</TableHead>
              <TableHead className="w-[80px] text-right text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBatches.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                   No se encontraron lotes activos.
                 </TableCell>
               </TableRow>
            ) : filteredBatches.map(b => {
              const prod = products.find(p => p.id === b.productId);
              const status = getExpirationStatus(b.expirationDate);
              return (
                <TableRow key={b.id} className="group border-border hover:bg-muted/30">
                  <TableCell className="font-medium text-zinc-100">
                    {prod?.name || 'Desconocido'}
                    <span className="block text-xs text-muted-foreground font-normal">SKU: {prod?.sku || '-'}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-zinc-300">{b.lotNumber}</TableCell>
                  <TableCell>
                    <span className={`${status.color} inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider`}>
                      {status.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-zinc-300">
                     {b.expirationDate ? new Date(b.expirationDate).toISOString().split('T')[0] : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`${b.currentQuantity === 0 ? 'text-red-400 font-bold' : 'text-zinc-100 font-semibold'}`}>
                      {b.currentQuantity}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/{b.initialQuantity}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.location ? (
                      <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-700">
                        <MapPin className="w-3 h-3 mr-1" />
                        {b.location}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 transition-opacity">
                      <Button title="Imprimir Etiqueta QR" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10" onClick={() => setPrintBatch(b)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleOpenDialog(b)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteConfirmId(b.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editId ? 'Editar Lote' : 'Nuevo Lote'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Producto Relacionado</Label>
                <Select required value={formData.productId} onValueChange={v => setFormData({...formData, productId: v})} onOpenChange={(o) => { if(!o) setSearchProduct(''); }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Seleccionar producto...">
                      {products.find(p => p.id === formData.productId)?.name || 'Seleccionar producto...'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectSearch value={searchProduct} onChange={setSearchProduct} placeholder="Buscar producto..." />
                    {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()))).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Nº de Lote</Label>
                <Input required value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} placeholder="Ej: LOT-2026-A" className="bg-input border-border text-mono uppercase" />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input required type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="bg-input border-border" />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Cantidad Inicial</Label>
                <div className="relative">
                  <Input required type="number" min="0" step="0.01" value={formData.initialQuantity} onChange={e => setFormData({...formData, initialQuantity: e.target.value})} className="pr-12 bg-input border-border" />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground uppercase">{products.find(p => p.id === formData.productId)?.unit || ''}</span>
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Cantidad Actual (Stock del Lote)</Label>
                <div className="relative">
                  <Input required type="number" min="0" step="0.01" value={formData.currentQuantity} onChange={e => setFormData({...formData, currentQuantity: e.target.value})} className="pr-12 bg-input border-border" />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground uppercase">{products.find(p => p.id === formData.productId)?.unit || ''}</span>
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Ubicación Física</Label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej: Estante A1" className="bg-input border-border" />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Costo Unitario y Moneda</Label>
                <div className="flex gap-2">
                  <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                    <SelectTrigger className="w-[100px] bg-input border-border">
                      <SelectValue placeholder="ARS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min="0" step="0.01" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: e.target.value})} placeholder="0.00" className="flex-1 bg-input border-border" />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Proveedor Origen (Opcional)</Label>
                <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v})} onOpenChange={(o) => { if(!o) setSearchSupplier(''); }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Sin proveedor especificado">
                      {formData.supplierId === 'none' ? 'Sin proveedor especificado' : suppliers.find(s => s.id === formData.supplierId)?.name || 'Sin proveedor especificado'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectSearch value={searchSupplier} onChange={setSearchSupplier} placeholder="Buscar proveedor..." />
                    <SelectItem value="none">Sin proveedor especificado</SelectItem>
                    {suppliers.filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase())).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border hover:bg-muted">
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-orange-500 text-primary-foreground">
                {editId ? 'Guardar Cambios' : 'Ingresar Lote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lote?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no descontará el stock general del producto, solo eliminará el registro de trazabilidad del lote. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!printBatch} onOpenChange={(open) => !open && setPrintBatch(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Etiqueta de Lote</DialogTitle>
          </DialogHeader>
          {printBatch && (
             <div className="flex flex-col items-center justify-center py-6 space-y-4">
               <div className="border border-border p-6 rounded-xl flex flex-col items-center bg-white shadow-sm w-full max-w-[250px]">
                  <QRCodeCanvas 
                    id="qr-canvas"
                    value={`PRODUCTO: ${products.find(p => p.id === printBatch.productId)?.name || ''}\nLOTE: ${printBatch.lotNumber}\nVTO: ${printBatch.expirationDate || 'N/A'}`} 
                    size={130} 
                  />
                  <div className="text-center mt-4 w-full space-y-1">
                    <p className="font-bold text-sm text-zinc-900 border-b pb-1 mb-1">{products.find(p => p.id === printBatch.productId)?.name || 'Producto'}</p>
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>Lote:</span>
                      <span className="font-medium">{printBatch.lotNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>Vencimiento:</span>
                      <span className="font-medium">{printBatch.expirationDate ? new Date(printBatch.expirationDate).toISOString().split('T')[0] : '-'}</span>
                    </div>
                  </div>
               </div>
               <p className="text-xs text-muted-foreground text-center px-4">Puedes descargar esta etiqueta como PDF para imprimirla o compartirla.</p>
               <Button onClick={() => {
                 try {
                   const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
                   if (!canvas) {
                     toast.error('La imagen del QR aún no está lista');
                     return;
                   }
                   const qrImg = canvas.toDataURL('image/png');
                   const doc = new jsPDF({
                     orientation: 'landscape',
                     unit: 'mm',
                     format: [50, 70] // 70x50 mm label
                   });
                   
                   const prodName = products.find(p => p.id === printBatch.productId)?.name || 'Producto';
                   
                   // Add QR
                   doc.addImage(qrImg, 'PNG', 4, 10, 30, 30);
                   
                   doc.setFontSize(10);
                   doc.setFont('helvetica', 'bold');
                   const splitTitle = doc.splitTextToSize(prodName, 26);
                   doc.text(splitTitle, 36, 14);
                   
                   doc.setFontSize(8);
                   doc.setFont('helvetica', 'normal');
                   doc.text('Lote: ' + printBatch.lotNumber, 36, 14 + (splitTitle.length * 4) + 2);
                   doc.text('Vto: ' + (printBatch.expirationDate || 'N/A'), 36, 14 + (splitTitle.length * 4) + 6);
                   
                   doc.save(`Etiqueta_${printBatch.lotNumber}.pdf`);
                   toast.success('Etiqueta PDF descargada correctamente');
                 } catch (err) {
                   console.error('Error generando etiqueta:', err);
                   toast.error('Ocurrió un error al descargar el PDF de la etiqueta');
                 }
               }} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
                 <Download className="w-4 h-4 mr-2" />
                 Descargar PDF de Etiqueta
               </Button>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
