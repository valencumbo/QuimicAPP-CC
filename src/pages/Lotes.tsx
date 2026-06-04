import React, { useState, useMemo } from 'react';
import { useWorkspaceData, useAuth, Batch } from '@/src/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Plus, Search, Trash2, ArrowRightLeft, CalendarCheck2, Beaker, MapPin, Edit3, Printer, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Lotes() {
  const { user } = useAuth();
  const { batches, products, suppliers, settings, loading } = useWorkspaceData(user?.uid);
  const [search, setSearch] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printBatch, setPrintBatch] = useState<Batch | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

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
    if (!expDateStr) return { status: 'unknown', text: 'Desconocido', color: 'bg-zinc-100 text-zinc-600' };
    const expDate = new Date(expDateStr);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', text: 'Vencido', color: 'bg-red-100 text-red-700 hover:bg-red-200' };
    if (diffDays <= 30) return { status: 'danger', text: 'Riesgo (< 30 días)', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' };
    if (diffDays <= 90) return { status: 'warning', text: 'Atención (< 90 días)', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' };
    return { status: 'ok', text: 'Vigente', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' };
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
    if (!formData.productId || !formData.lotNumber || !formData.expirationDate || !user?.uid) {
      return toast.error("El producto, código de lote y fecha de vencimiento son obligatorios.");
    }

    try {
      // Validar fecha
      const expDate = new Date(formData.expirationDate);
      const today = new Date();
      if (!editId && expDate <= today) {
        // Podría ser advertencia
        // return toast.error("La fecha de vencimiento debe ser a futuro.");
      }

      const isNew = !editId;
      const id = editId || crypto.randomUUID();
      const ref = doc(collection(db, `workspaces/${user.uid}/batches`), id);
      
      const payload: any = {
        workspaceId: user.uid,
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
      toast.success(`Lote ${isNew ? 'creado' : 'actualizado'} exitosamente.`);
      setIsDialogOpen(false);
    } catch(err) {
      handleFirestoreError(err, editId ? OperationType.UPDATE : OperationType.CREATE, `workspaces/${user?.uid}/batches`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || !user?.uid) return;
    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/batches/${deleteConfirmId}`));
      toast.success('Lote eliminado exitosamente.');
      setDeleteConfirmId(null);
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/batches/${deleteConfirmId}`);
    }
  };

  if (loading) return null;

  return (
    <div className="flex-1 overflow-auto bg-zinc-50 flex flex-col items-center">
      <div className="w-full max-w-6xl p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 border-b-2 border-emerald-500 pb-1 inline-block">Lotes y Vencimientos</h1>
            <p className="text-sm text-zinc-500 mt-1">Gestión de stock, ubicaciones y control de calidad.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lote
          </Button>
        </div>

        <Card className="shadow-sm border-zinc-200">
          <CardContent className="p-4 relative">
            <Search className="w-4 h-4 absolute left-7 top-7 text-zinc-400" />
            <Input 
              className="pl-9 bg-white max-w-md rounded-md border-zinc-200 focus-visible:ring-emerald-500" 
              placeholder="Buscar por lote, producto o ubicación..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            
            <div className="mt-4 border rounded-md overflow-x-auto bg-white border-zinc-200">
              <Table>
                <TableHeader className="bg-zinc-100">
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Lote #</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Ubicación</TableHead>
                    <TableHead className="w-[80px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                         No se encontraron lotes.
                       </TableCell>
                     </TableRow>
                  ) : filteredBatches.map(b => {
                    const prod = products.find(p => p.id === b.productId);
                    const status = getExpirationStatus(b.expirationDate);
                    return (
                      <TableRow key={b.id} className="group">
                        <TableCell className="font-medium text-zinc-900">
                          {prod?.name || 'Desconocido'}
                          <span className="block text-xs text-zinc-500 font-normal">SKU: {prod?.sku || '-'}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-zinc-700">{b.lotNumber}</TableCell>
                        <TableCell>
                          <span className={`${status.color} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold pb-1 pt-1`}>
                            {status.text}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-zinc-700">
                           {b.expirationDate ? new Date(b.expirationDate).toISOString().split('T')[0] : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`${b.currentQuantity === 0 ? 'text-red-500 font-semibold' : 'text-zinc-900 font-medium'}`}>
                            {b.currentQuantity}
                          </span>
                          <span className="text-xs text-zinc-500 ml-1">/{b.initialQuantity}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {b.location ? (
                            <span className="inline-flex items-center text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">
                              <MapPin className="w-3 h-3 mr-1" />
                              {b.location}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button title="Imprimir Etiqueta QR" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setPrintBatch(b)}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleOpenDialog(b)}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteConfirmId(b.id)}>
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Lote' : 'Nuevo Lote'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Producto Relacionado</Label>
                <Select required value={formData.productId} onValueChange={v => setFormData({...formData, productId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto...">
                      {formData.productId ? (products.find(p => p.id === formData.productId)?.name || formData.productId) : "Seleccionar producto..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Nº de Lote</Label>
                <Input required value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} placeholder="Ej: LOT-2026-A" />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input required type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Cantidad Inicial</Label>
                <div className="relative">
                  <Input required type="number" min="0" step="0.01" value={formData.initialQuantity} onChange={e => setFormData({...formData, initialQuantity: e.target.value})} className="pr-12" />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-500">{products.find(p => p.id === formData.productId)?.unit || ''}</span>
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Cantidad Actual (Stock del Lote)</Label>
                <div className="relative">
                  <Input required type="number" min="0" step="0.01" value={formData.currentQuantity} onChange={e => setFormData({...formData, currentQuantity: e.target.value})} className="pr-12" />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-500">{products.find(p => p.id === formData.productId)?.unit || ''}</span>
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Ubicación Física</Label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej: Depósito Norte, Heladera..." />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Costo Unitario y Moneda</Label>
                <div className="flex gap-2">
                  <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="ARS">
                        {formData.currency || 'ARS'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min="0" step="0.01" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: e.target.value})} placeholder="0.00" className="flex-1" />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Proveedor Origen (Opcional)</Label>
                <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proveedor especificado">
                      {formData.supplierId === 'none' || !formData.supplierId ? 'Sin proveedor especificado' : suppliers.find(s => s.id === formData.supplierId)?.name || formData.supplierId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor especificado</SelectItem>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                {editId ? 'Guardar Cambios' : 'Ingresar Lote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lote?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no descontará el stock general del producto, solo eliminará el registro de trazabilidad del lote. ¿Estás seguro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!printBatch} onOpenChange={(open) => !open && setPrintBatch(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Etiqueta de Lote</DialogTitle>
          </DialogHeader>
          {printBatch && (
             <div className="flex flex-col items-center justify-center py-6 space-y-4">
               <div className="border border-zinc-200 p-6 rounded-xl flex flex-col items-center bg-white shadow-sm w-full max-w-[250px]">
                  <QRCodeCanvas 
                    id="qr-canvas"
                    value={`Prod: ${products.find(p => p.id === printBatch.productId)?.name || ''} | Lote: ${printBatch.lotNumber} | Vto: ${printBatch.expirationDate || 'N/A'}`} 
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
               <p className="text-xs text-zinc-500 text-center px-4">Puedes descargar esta etiqueta como PDF para imprimirla o compartirla.</p>
               <Button onClick={() => {
                 const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
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
               }} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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
