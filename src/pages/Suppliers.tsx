import React, { useState, useMemo } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Search, Trash2, ArrowRightLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    className={className}
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Suppliers() {
  const { user } = useAuth();
  const { suppliers, products, settings } = useWorkspaceData(user?.uid);
  const [search, setSearch] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '', contact: '', paymentTerms: '', currency: 'ARS',
    deliveryTime: '' as number | string, location: '', notes: ''
  });

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: settings?.currency || 'ARS' });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (s?: any) => {
    if (s) {
      setEditId(s.id);
      setFormData({
        name: s.name || '', contact: s.contact || '', paymentTerms: s.paymentTerms || '',
        currency: s.currency || 'ARS', deliveryTime: s.deliveryTime ?? '',
        location: s.location || '', notes: s.notes || ''
      });
    } else {
      setEditId(null);
      setFormData({
        name: '', contact: '', paymentTerms: '', currency: 'ARS',
        deliveryTime: '', location: '', notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    const id = editId || crypto.randomUUID();
    const docRef = doc(db, `workspaces/${user.uid}/suppliers/${id}`);
    
    const payload = {
      ...formData,
      deliveryTime: Number(formData.deliveryTime) || 0
    };

    try {
      if (!editId) {
        await setDoc(docRef, {
          ...payload,
          workspaceId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, {
          ...payload,
          updatedAt: serverTimestamp()
        });
      }
      toast.success(editId ? 'Proveedor actualizado' : 'Proveedor creado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, editId ? OperationType.UPDATE : OperationType.CREATE, `workspaces/${user.uid}/suppliers/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/suppliers/${id}`));
      toast.success('Proveedor eliminado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/suppliers/${id}`);
    }
  };

  const supplierAName = suppliers.find(s => s.id === compareA)?.name || '';
  const supplierBName = suppliers.find(s => s.id === compareB)?.name || '';

  const intersectionProducts = useMemo(() => {
    if (!supplierAName || !supplierBName) return [];
    
    const prodsA = products.filter(p => p.supplier.trim().toLowerCase() === supplierAName.trim().toLowerCase());
    const prodsB = products.filter(p => p.supplier.trim().toLowerCase() === supplierBName.trim().toLowerCase());

    const mapB = new Map<string, any>(prodsB.map(p => [p.name.trim().toLowerCase(), p]));
    
    const results = [];
    for (const pA of prodsA) {
      const matchB = mapB.get(pA.name.trim().toLowerCase());
      if (matchB) {
        results.push({
          name: pA.name,
          costA: pA.purchaseCost,
          costB: matchB.purchaseCost,
          unitA: pA.unit,
          unitB: matchB.unit
        });
      }
    }
    return results;
  }, [products, supplierAName, supplierBName]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-zinc-500 mt-1">Directorio de proveedores y condiciones comerciales.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCompareOpen(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Comparar precios
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo proveedor
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar proveedor o contacto..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tiempo de envío</TableHead>
              <TableHead>Cond. Pago</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  No hay proveedores registrados.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map(s => (
                <TableRow key={s.id} className="group">
                  <TableCell className="font-medium text-zinc-900">{s.name}</TableCell>
                  <TableCell>
                    {s.contact ? (
                      <div className="flex items-center gap-2">
                        <span>{s.contact}</span>
                        {s.contact.replace(/\D/g, '').length >= 8 && (
                          <a 
                            href={`https://wa.me/${s.contact.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-full transition-colors flex-shrink-0"
                            title="Abrir chat en WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{s.location || '-'}</TableCell>
                  <TableCell>{s.deliveryTime > 0 ? `${s.deliveryTime} días` : '-'}</TableCell>
                  <TableCell>{s.paymentTerms || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(s)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Razón social / Nombre</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="Teléfono o Email" />
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Condiciones de pago</Label>
                <Input value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} placeholder="Ej. Contado, 30 días" />
              </div>
              <div className="space-y-2">
                <Label>Moneda de la lista</Label>
                <Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} placeholder="ARS, USD" />
              </div>
              <div className="space-y-2">
                <Label>Llegada prom. (días)</Label>
                <Input type="number" min="0" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Información extra" />
            </div>

            <DialogFooter className="flex items-center justify-between mt-6">
              {editId ? (
                <Button type="button" variant="destructive" onClick={() => { setIsDialogOpen(false); setDeleteConfirmId(editId); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              ) : <div></div>}
              <div className="flex gap-2">
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit">Guardar</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Comparar precios de proveedores</DialogTitle>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor A</Label>
              <Select value={compareA} onValueChange={setCompareA}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">
                    {suppliers.find(s => s.id === compareA)?.name || 'Seleccionar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proveedor B</Label>
              <Select value={compareB} onValueChange={setCompareB}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">
                    {suppliers.find(s => s.id === compareB)?.name || 'Seleccionar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            {supplierAName && supplierBName ? (
               intersectionProducts.length === 0 ? (
                 <div className="text-center p-8 bg-zinc-50 border rounded-lg text-zinc-500">
                   No se encontraron productos con el mismo nombre en ambos proveedores para comparar.
                 </div>
               ) : (
                 <div className="border rounded-lg bg-white overflow-hidden max-h-[40vh] overflow-y-auto">
                   <Table>
                     <TableHeader className="bg-zinc-50 sticky top-0">
                       <TableRow>
                         <TableHead>Producto</TableHead>
                         <TableHead className="text-right">{supplierAName}</TableHead>
                         <TableHead className="text-right">{supplierBName}</TableHead>
                         <TableHead className="text-right">Diferencia</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {intersectionProducts.map((ip, i) => {
                         const diff = ip.costB - ip.costA;
                         const betterA = ip.costA < ip.costB;
                         const betterB = ip.costB < ip.costA;
                         return (
                           <TableRow key={i}>
                             <TableCell className="font-medium text-zinc-900">{ip.name}</TableCell>
                             <TableCell className={`text-right ${betterA ? 'text-emerald-600 font-bold' : ''}`}>
                               {formatter.format(ip.costA)}
                             </TableCell>
                             <TableCell className={`text-right ${betterB ? 'text-emerald-600 font-bold' : ''}`}>
                               {formatter.format(ip.costB)}
                             </TableCell>
                             <TableCell className="text-right">
                               <span className={diff < 0 ? 'text-red-500' : diff > 0 ? 'text-emerald-500' : 'text-zinc-500'}>
                                 {diff === 0 ? 'Igual' : diff > 0 ? `A es ${formatter.format(Math.abs(diff))} mejor` : `B es ${formatter.format(Math.abs(diff))} mejor`}
                               </span>
                             </TableCell>
                           </TableRow>
                         )
                       })}
                     </TableBody>
                   </Table>
                 </div>
               )
            ) : (
              <div className="text-center p-8 bg-zinc-50 border rounded-lg text-zinc-500">
                Selecciona dos proveedores para ver la comparación.
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cerrar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el proveedor permanentemente de tu base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmId) handleDelete(deleteConfirmId);
              setDeleteConfirmId(null);
            }} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
