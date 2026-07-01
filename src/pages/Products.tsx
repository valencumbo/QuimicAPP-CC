import React, { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Search, Trash2, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Products() {
  const { user } = useAuth();
  const { settings, products, suppliers } = useWorkspaceData(user?.uid);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    const margin = Number(p.targetMargin) || 0;
    return getUnitCost(p) * (1 + margin / 100);
  };

  const getMargin = (p: any) => {
    const sp = Number(p.salePrice);
    if (!sp) return NaN;
    const cost = getUnitCost(p);
    if (!cost) return NaN;
    return ((sp - cost) / cost) * 100;
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
      const currentUnit = p.unit || 'Unidades';
      const allU = Array.from(new Set(['Unidades', 'KG', 'GRS', 'LTS', ...(settings?.customUnits || [])]));
      if (!allU.includes(currentUnit)) {
        setCustomUnit(currentUnit);
      } else {
        setCustomUnit('');
      }
      
      const currentCategory = p.category || '';
      const allC = Array.from(new Set(products.map(pr => pr.category).filter(Boolean)));
      if (currentCategory && !allC.includes(currentCategory)) {
        setCustomCategory(currentCategory);
      } else {
        setCustomCategory('');
      }

      setFormData({
        name: p.name || '', sku: p.sku || '', type: p.type || 'resale', unit: currentUnit,
        supplier: p.supplier || 'Sin proveedor especificado', category: currentCategory || 'Sin categoría', currency: p.currency || settings?.currency || 'ARS',
        stock: p.stock ?? '', minStock: p.minStock ?? '', purchaseCost: p.purchaseCost ?? '', extraCost: p.extraCost ?? '',
        wasteRate: p.wasteRate ?? '', targetMargin: p.targetMargin ?? '',
        salePrice: p.salePrice ?? ''
      });
    } else {
      setEditId(null);
      setCustomUnit('');
      setCustomCategory('');
      setFormData({
        name: '', sku: '', type: 'resale', unit: 'Unidades', supplier: 'Sin proveedor especificado', category: 'Sin categoría', currency: settings?.currency || 'ARS',
        stock: '', minStock: '', purchaseCost: '', extraCost: '', wasteRate: '', targetMargin: settings?.defaultMargin || 35, salePrice: ''
      });
    }
    setIsDialogOpen(true);
  };

  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const defaultUnits = ['Unidades', 'KG', 'GRS', 'LTS'];
  const allUnits = Array.from(new Set([...defaultUnits, ...(settings?.customUnits || [])]));
  const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    const id = editId || crypto.randomUUID();
    const docRef = doc(db, `workspaces/${user.uid}/products/${id}`);
    
    let finalUnit = formData.unit;
    if (finalUnit === 'otra') {
      finalUnit = customUnit.trim() || 'Unidades';
      if (!allUnits.includes(finalUnit)) {
        try {
          const wsRef = doc(db, 'workspaces', user.uid);
          await updateDoc(wsRef, {
            'settings.customUnits': [...(settings?.customUnits || []), finalUnit],
            updatedAt: serverTimestamp()
          });
        } catch(err) {
          console.error("Error saving custom unit", err);
        }
      }
    }

    let finalCategory = formData.category;
    if (finalCategory === 'otra') {
      finalCategory = customCategory.trim();
    } else if (finalCategory === 'Sin categoría') {
      finalCategory = '';
    }

    let finalSupplier = formData.supplier;
    if (finalSupplier === 'Sin proveedor especificado') {
      finalSupplier = '';
    }

    const payload = {
      ...formData,
      unit: finalUnit,
      category: finalCategory,
      supplier: finalSupplier,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
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

    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/products/${id}`));
      toast.success('Producto eliminado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/products/${id}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Beaker className="w-8 h-8 text-primary" />
            Catálogo de Productos
          </h1>
          <p className="text-muted-foreground mt-2">Administra tu inventario de materias primas y procesados.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-orange-500 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo producto
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar producto o SKU..." 
            className="pl-9 bg-card border-border text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] bg-card border-border">
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

      <div className="border border-border rounded-xl bg-card shadow-lg overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Producto</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Stock</TableHead>
              <TableHead className="text-muted-foreground">Costo (Base)</TableHead>
              <TableHead className="text-muted-foreground">Precio Sug.</TableHead>
              <TableHead className="text-muted-foreground">Precio Venta</TableHead>
              <TableHead className="text-muted-foreground">Margen</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No hay productos registrados con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(p => {
                const margin = getMargin(p);
                const marginClass = margin < (p.targetMargin - 5) ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                
                return (
                  <TableRow key={p.id} className="group border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-zinc-100">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.sku || 'Sin SKU'} • {p.supplier || 'Sin proveedor'}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] uppercase font-bold tracking-wider">
                        {p.type === 'raw' ? 'M. Prima' : p.type === 'processed' ? 'Procesado' : 'Reventa'}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-200">{p.stock} {p.unit}</TableCell>
                    <TableCell>
                      <div className="text-zinc-200">{formatter.format(getUnitCost(p))}</div>
                      {p.currency === 'USD' && settings?.currency === 'ARS' && (
                        <div className="text-[10px] text-zinc-500 font-medium">Orig: {usdFormatter.format(p.purchaseCost)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatter.format(getSuggestedPrice(p))}</TableCell>
                    <TableCell className="font-medium text-white">{p.salePrice > 0 ? formatter.format(p.salePrice) : '-'}</TableCell>
                    <TableCell>
                      {isNaN(margin) ? '-' : (
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${marginClass}`}>
                            {margin.toFixed(1)}%
                         </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(p)} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white">
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
        <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-auto overflow-y-auto bg-card border-border text-foreground">
          <DialogHeader className="flex flex-row items-center justify-between mt-2">
            <DialogTitle className="text-xl font-bold">{editId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 mt-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del producto</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Jabón líquido pino" className="bg-input" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                    <SelectTrigger className="bg-input">
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
                  <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ej. JAB-001" className="bg-input" />
                </div>
                <div className="space-y-2">
                  <Label>Unidad de medida</Label>
                  <Select value={allUnits.includes(formData.unit) ? formData.unit : (formData.unit ? 'otra' : 'Unidades')} onValueChange={val => {
                    setFormData({...formData, unit: val});
                    if (val !== 'otra') setCustomUnit('');
                  }}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar unidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allUnits.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                      <SelectItem value="otra">Otra...</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!allUnits.includes(formData.unit) || formData.unit === 'otra') && (
                    <Input autoFocus required placeholder="Escriba la unidad..." value={customUnit} onChange={e => setCustomUnit(e.target.value)} className="bg-input" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select value={formData.supplier} onValueChange={val => setFormData({...formData, supplier: val})}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar proveedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin proveedor especificado">Sin proveedor especificado</SelectItem>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.category === 'Sin categoría' ? 'Sin categoría' : (allCategories.includes(formData.category) ? formData.category : (formData.category ? 'otra' : 'Sin categoría'))} onValueChange={val => {
                    setFormData({...formData, category: val});
                    if (val !== 'otra') setCustomCategory('');
                  }}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin categoría">Sin categoría</SelectItem>
                      {allCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectItem value="otra">Otra...</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!allCategories.includes(formData.category) || formData.category === 'otra') && formData.category !== 'Sin categoría' && formData.category !== '' && (
                    <Input autoFocus placeholder="Escriba la categoría..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="bg-input mt-2" />
                  )}
                </div>
             </div>

             <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-4 text-white">Costos y cantidades</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Moneda de compra</Label>
                    <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger className="bg-input">
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
                    <Input type="number" step="0.01" min="0" required value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gasto extra (flete)</Label>
                    <Input type="number" step="0.01" min="0" value={formData.extraCost} onChange={e => setFormData({...formData, extraCost: e.target.value})} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock actual</Label>
                    <Input type="number" step="0.01" min="0" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Límite stock bajo</Label>
                    <Input type="number" step="0.01" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Merma (%)</Label>
                    <Input type="number" step="0.01" min="0" max="99" value={formData.wasteRate} onChange={e => setFormData({...formData, wasteRate: e.target.value})} className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>Margen obj. (%)</Label>
                    <Input type="number" step="0.01" min="0" required value={formData.targetMargin} onChange={e => setFormData({...formData, targetMargin: e.target.value})} className="bg-input" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Precio de venta (Opcional, en {settings?.currency || 'ARS'})</Label>
                    <Input type="number" step="0.01" min="0" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} className="bg-input" />
                  </div>
                </div>
             </div>

             <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-around text-center border border-border relative overflow-hidden shadow-inner">
                {formData.currency === 'USD' && settings?.currency === 'ARS' && (
                  <div className="absolute top-0 inset-x-0 bg-emerald-500/20 text-emerald-400 text-[10px] py-1 font-bold tracking-widest uppercase border-b border-emerald-500/20">
                    Calculado usando tipo de cambio: ${settings.usdRate || 1}
                  </div>
                )}
                <div className="mt-4">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Costo Unit. Real</span>
                  <strong className="text-xl text-white">{formatter.format(getUnitCost(formData))}</strong>
                </div>
                <div className="mt-4">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Precio Sugerido</span>
                  <strong className="text-xl text-primary">{formatter.format(getSuggestedPrice(formData))}</strong>
                </div>
                <div className="mt-4">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Margen Actual</span>
                  <strong className="text-xl text-white">
                    {formData.salePrice ? `${getMargin(formData).toFixed(1)}%` : '-'}
                  </strong>
                </div>
             </div>

             <DialogFooter className="flex items-center justify-between mt-6">
                {editId ? (
                  <Button type="button" variant="destructive" onClick={() => { setIsDialogOpen(false); setDeleteConfirmId(editId); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </Button>
                ) : <div></div>}
                <div className="flex gap-2 ml-auto">
                  <DialogClose render={<Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted" />}>
                    Cancelar
                  </DialogClose>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-orange-500">Guardar producto</Button>
                </div>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará el producto permanentemente de tu base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmId) handleDelete(deleteConfirmId);
              setDeleteConfirmId(null);
            }} className="bg-destructive hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
