import React, { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Products() {
  const { user } = useAuth();
  const { settings, products } = useWorkspaceData(user?.uid);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', sku: '', type: 'resale', unit: 'un', supplier: '', category: '', currency: 'ARS',
    stock: '' as number | string, purchaseCost: '' as number | string, extraCost: '' as number | string, wasteRate: '' as number | string, targetMargin: 35 as number | string, salePrice: '' as number | string
  });

  const getExchangeRate = (pCurrency?: string) => {
    const base = settings?.currency || 'ARS';
    const prodCurr = pCurrency || base;
    if (prodCurr === 'USD' && base === 'ARS') return settings?.usdRate || 1;
    if (prodCurr === 'ARS' && base === 'USD') return 1 / Math.max(settings?.usdRate || 1, 0.01);
    return 1;
  };

  const getUnitCost = (p: any) => {
    const rate = getExchangeRate(p.currency);
    const base = (Number(p.purchaseCost) + Number(p.extraCost)) * rate;
    const usable = 1 - Math.min(Number(p.wasteRate) || 0, 99) / 100;
    return base / Math.max(usable, 0.01);
  };

  const getSuggestedPrice = (p: any) => {
    const margin = Math.min(Number(p.targetMargin) || 0, 95) / 100;
    return getUnitCost(p) / Math.max(1 - margin, 0.05);
  };

  const getMargin = (p: any) => {
    const sp = Number(p.salePrice);
    if (!sp) return NaN;
    return ((sp - getUnitCost(p)) / sp) * 100;
  };

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: settings?.currency || 'ARS' });
  const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleOpenDialog = (p?: any) => {
    if (p) {
      setEditId(p.id);
      setFormData({
        name: p.name || '', sku: p.sku || '', type: p.type || 'resale', unit: p.unit || 'un',
        supplier: p.supplier || '', category: p.category || '', currency: p.currency || settings?.currency || 'ARS',
        stock: p.stock ?? '', purchaseCost: p.purchaseCost ?? '', extraCost: p.extraCost ?? '',
        wasteRate: p.wasteRate ?? '', targetMargin: p.targetMargin ?? '',
        salePrice: p.salePrice ?? ''
      });
    } else {
      setEditId(null);
      setFormData({
        name: '', sku: '', type: 'resale', unit: 'un', supplier: '', category: '', currency: settings?.currency || 'ARS',
        stock: '', purchaseCost: '', extraCost: '', wasteRate: '', targetMargin: settings?.defaultMargin || 35, salePrice: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    const id = editId || crypto.randomUUID();
    const docRef = doc(db, `workspaces/${user.uid}/products/${id}`);
    
    const payload = {
      ...formData,
      stock: Number(formData.stock) || 0,
      purchaseCost: Number(formData.purchaseCost) || 0,
      extraCost: Number(formData.extraCost) || 0,
      wasteRate: Number(formData.wasteRate) || 0,
      targetMargin: Number(formData.targetMargin) || 0,
      salePrice: Number(formData.salePrice) || 0,
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
      toast.success(editId ? 'Producto actualizado' : 'Producto creado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, editId ? OperationType.UPDATE : OperationType.CREATE, `workspaces/${user.uid}/products/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/products/${id}`));
      toast.success('Producto eliminado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/products/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-zinc-500 mt-1">Administra tu inventario de materias primas y procesados.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar producto o SKU..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de producto">
               {filterType === 'all' && 'Todos los tipos'}
               {filterType === 'raw' && 'Materia prima'}
               {filterType === 'processed' && 'Procesado'}
               {filterType === 'resale' && 'Reventa'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="raw">Materia prima</SelectItem>
            <SelectItem value="processed">Procesado</SelectItem>
            <SelectItem value="resale">Reventa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Costo (Base)</TableHead>
              <TableHead>Precio Sug.</TableHead>
              <TableHead>Precio Venta</TableHead>
              <TableHead>Margen</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                  No hay productos registrados con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(p => {
                const margin = getMargin(p);
                const marginClass = margin < (p.targetMargin - 5) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800';
                
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <div className="font-medium text-zinc-900">{p.name}</div>
                      <div className="text-xs text-zinc-500">{p.sku || 'Sin SKU'} • {p.supplier || 'Sin proveedor'}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold">
                        {p.type === 'raw' ? 'M. Prima' : p.type === 'processed' ? 'Procesado' : 'Reventa'}
                      </span>
                    </TableCell>
                    <TableCell>{p.stock} {p.unit}</TableCell>
                    <TableCell>
                      <div>{formatter.format(getUnitCost(p))}</div>
                      {p.currency === 'USD' && settings?.currency === 'ARS' && (
                        <div className="text-[10px] text-zinc-400 font-medium">Original: {usdFormatter.format(p.purchaseCost)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500">{formatter.format(getSuggestedPrice(p))}</TableCell>
                    <TableCell className="font-medium">{p.salePrice > 0 ? formatter.format(p.salePrice) : '-'}</TableCell>
                    <TableCell>
                      {isNaN(margin) ? '-' : (
                         <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${marginClass}`}>
                            {margin.toFixed(1)}%
                         </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(p)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 mt-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del producto</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Jabón líquido pino" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                    <SelectTrigger>
                      <SelectValue>
                         {formData.type === 'raw' && 'Materia Prima'}
                         {formData.type === 'processed' && 'Producto Procesado'}
                         {formData.type === 'resale' && 'Reventa'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Materia Prima</SelectItem>
                      <SelectItem value="processed">Producto Procesado</SelectItem>
                      <SelectItem value="resale">Reventa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SKU / Código</Label>
                  <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ej. JAB-001" />
                </div>
                <div className="space-y-2">
                  <Label>Unidad de medida</Label>
                  <Input required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Ej. litros, kg, unid" />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Nombre del proveedor" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ej. Limpieza" />
                </div>
             </div>

             <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4 text-zinc-900">Costos y cantidades</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Moneda de compra</Label>
                    <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger>
                         <SelectValue>{formData.currency}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        {settings?.currency !== 'ARS' && settings?.currency !== 'USD' && (
                          <SelectItem value={settings?.currency || 'ARS'}>{settings?.currency}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Costo de compra</Label>
                    <Input type="number" step="0.01" min="0" required value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gasto extra (flete)</Label>
                    <Input type="number" step="0.01" min="0" value={formData.extraCost} onChange={e => setFormData({...formData, extraCost: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock actual</Label>
                    <Input type="number" step="0.01" min="0" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Merma (%)</Label>
                    <Input type="number" step="0.01" min="0" max="99" value={formData.wasteRate} onChange={e => setFormData({...formData, wasteRate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Margen obj. (%)</Label>
                    <Input type="number" step="0.01" min="0" required value={formData.targetMargin} onChange={e => setFormData({...formData, targetMargin: e.target.value})} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Precio de venta (Opcional, en {settings?.currency || 'ARS'})</Label>
                    <Input type="number" step="0.01" min="0" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} />
                  </div>
                </div>
             </div>

             <div className="bg-zinc-50 p-4 rounded-lg flex items-center justify-around text-center border relative overflow-hidden">
                {formData.currency === 'USD' && settings?.currency === 'ARS' && (
                  <div className="absolute top-0 inset-x-0 bg-emerald-100 text-emerald-800 text-[10px] py-0.5 font-bold tracking-widest uppercase">
                    Calculado usando tipo de cambio: ${settings.usdRate || 1}
                  </div>
                )}
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest">Costo Unit. Real</span>
                  <strong className="text-xl text-zinc-900">{formatter.format(getUnitCost(formData))}</strong>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest">Precio Sugerido</span>
                  <strong className="text-xl text-zinc-900">{formatter.format(getSuggestedPrice(formData))}</strong>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest">Margen Actual</span>
                  <strong className="text-xl text-zinc-900">
                    {formData.salePrice ? `${getMargin(formData).toFixed(1)}%` : '-'}
                  </strong>
                </div>
             </div>

             <DialogFooter className="flex items-center justify-between mt-6">
                {editId ? (
                  <Button type="button" variant="destructive" onClick={() => handleDelete(editId)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </Button>
                ) : <div></div>}
                <div className="flex gap-2 ml-auto">
                  <DialogClose render={<Button type="button" variant="outline" />}>
                    Cancelar
                  </DialogClose>
                  <Button type="submit">Guardar producto</Button>
                </div>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
