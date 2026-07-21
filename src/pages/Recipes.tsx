import { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Trash2, Plus, ArrowRight, Calculator, PackagePlus, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectSearch } from '@/components/ui/select-search';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Recipes() {
  const { user } = useAuth();
  const { settings, products, recipes, batches } = useWorkspaceData(user?.uid);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [produceRecipe, setProduceRecipe] = useState<any>(null);
  const [produceQuantity, setProduceQuantity] = useState<number | ''>('');

  const [recipeName, setRecipeName] = useState('');
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [components, setComponents] = useState<{productId: string, quantity: number}[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [searchMaterial, setSearchMaterial] = useState('');

  const [currentQuantity, setCurrentQuantity] = useState<number | ''>('');
  const [yieldQty, setYieldQty] = useState<number | ''>(1);
  const [processCost, setProcessCost] = useState<number | ''>(0);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: settings?.currency || 'ARS' });

  const getExchangeRate = (pCurrency?: string) => {
    const base = settings?.currency || 'ARS';
    const prodCurr = pCurrency || base;
    if (prodCurr === 'USD' && base === 'ARS') return settings?.usdRate || 1;
    if (prodCurr === 'ARS' && base === 'USD') return 1 / Math.max(settings?.usdRate || 1, 0.01);
    return 1;
  };

  const getProductCost = (productId: string) => {
     const p = products.find(p => p.id === productId);
     if (!p) return 0;
     const rate = getExchangeRate(p.currency);
     const base = (Number(p.purchaseCost) + Number(p.extraCost)) * rate;
     const usable = 1 - Math.min(Number(p.wasteRate) || 0, 99) / 100;
     return base / Math.max(usable, 0.01);
  }

  const handleAddComponent = () => {
    if (!currentMaterial || !currentQuantity || currentQuantity <= 0) return toast.error('Ingresa un material y su cantidad');
    
    // Check if it exists and sum it
    const existingIndex = components.findIndex(c => c.productId === currentMaterial);
    if (existingIndex >= 0) {
      const newComps = [...components];
      newComps[existingIndex].quantity += Number(currentQuantity);
      setComponents(newComps);
    } else {
       setComponents([...components, { productId: currentMaterial, quantity: Number(currentQuantity) }]);
    }

    setCurrentMaterial('');
    setCurrentQuantity('');
  };

  const currentRecipeTotalCost = components.reduce((acc, comp) => acc + (getProductCost(comp.productId) * comp.quantity), 0) + Number(processCost || 0);

  const handleSave = async () => {
    if (!user?.uid || !recipeName.trim()) return toast.error('Ingresa el nombre de la receta');
    if (components.length === 0) return toast.error('Añade al menos un ingrediente a la fórmula');
    if (!yieldQty || yieldQty <= 0) return toast.error('El rendimiento debe ser mayor a 0');
    
    let productIdToUse = '';
    let isNewProduct = false;
    let existingProduct = products.find(p => p.type === 'processed' && p.name.trim().toLowerCase() === recipeName.trim().toLowerCase());
    
    if (editingRecipeId) {
      const editingRecipe = recipes.find(r => r.id === editingRecipeId);
      if (editingRecipe) productIdToUse = editingRecipe.productId;
    }
    
    if (!productIdToUse && existingProduct) {
       productIdToUse = existingProduct.id;
    }
    
    if (!productIdToUse) {
       productIdToUse = crypto.randomUUID();
       isNewProduct = true;
    }

    try {
      const batch = writeBatch(db);
      
      const recipeRef = doc(db, `workspaces/${user.uid}/recipes/${editingRecipeId || crypto.randomUUID()}`);
      
      if (editingRecipeId) {
        batch.update(recipeRef, {
          components,
          yield: Number(yieldQty),
          processCost: Number(processCost || 0),
          updatedAt: serverTimestamp()
        });
      } else {
        batch.set(recipeRef, {
          workspaceId: user.uid,
          productId: productIdToUse,
          components,
          yield: Number(yieldQty),
          processCost: Number(processCost || 0),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Update product cost automatically depending on the new recipe yield
      const unitProducedCost = currentRecipeTotalCost / Math.max(Number(yieldQty), 1);
      const prodRef = doc(db, `workspaces/${user.uid}/products/${productIdToUse}`);
      
      if (isNewProduct) {
        batch.set(prodRef, {
          workspaceId: user.uid,
          name: recipeName.trim(),
          type: 'processed',
          unit: 'un',
          stock: 0,
          purchaseCost: unitProducedCost,
          extraCost: 0,
          wasteRate: 0,
          targetMargin: settings?.defaultMargin || 35,
          salePrice: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        batch.update(prodRef, {
          name: recipeName.trim(), 
          purchaseCost: unitProducedCost,
          extraCost: 0,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      toast.success(editingRecipeId ? 'Fórmula actualizada' : 'Fórmula guardada exitosamente');
      setRecipeName('');
      setEditingRecipeId(null);
      setComponents([]);
      setYieldQty(1);
      setProcessCost(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `workspaces/${user.uid}/recipes/new`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/recipes/${id}`));
      toast.success('Fórmula eliminada');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/recipes/${id}`);
    }
  };

  const handleEditRecipe = (recipe: any) => {
    const product = products.find(p => p.id === recipe.productId);
    setRecipeName(product?.name || '');
    setEditingRecipeId(recipe.id);
    setComponents(recipe.components);
    setYieldQty(recipe.yield);
    setProcessCost(recipe.processCost);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProduce = async () => {
    if (!user?.uid || !produceRecipe || !produceQuantity || produceQuantity <= 0) return toast.error('Ingresa una cantidad válida');
    
    const multiplier = Number(produceQuantity) / Math.max(produceRecipe.yield, 1);
    
    try {
      const batch = writeBatch(db);
      
      // Increase product stock
      const productRef = doc(db, `workspaces/${user.uid}/products/${produceRecipe.productId}`);
      const productObj = products.find(p => p.id === produceRecipe.productId);
      const currentStock = Number(productObj?.stock || 0);
      batch.update(productRef, {
        stock: currentStock + Number(produceQuantity),
        updatedAt: serverTimestamp()
      });
      
      // Decrease components stock
      produceRecipe.components.forEach((c: any) => {
        const compRef = doc(db, `workspaces/${user.uid}/products/${c.productId}`);
        const compObj = products.find(p => p.id === c.productId);
        const compCurrentStock = Number(compObj?.stock || 0);
        const qtyToSubtract = c.quantity * multiplier;
        batch.update(compRef, {
          stock: Math.max(0, compCurrentStock - qtyToSubtract), // Avoid negative stock if possible, though you might allow it depending on rules. Leaving as Math.max(0, ...) or just compCurrentStock - qtyToSubtract.
          updatedAt: serverTimestamp()
        });

        // FIFO Batch Reduction for Component
        let remaining = qtyToSubtract;
        const compBatches = batches
          .filter(b => b.productId === c.productId && b.currentQuantity > 0)
          .sort((a, b) => new Date(a.expirationDate || 0).getTime() - new Date(b.expirationDate || 0).getTime());
        
        for (const b of compBatches) {
          if (remaining <= 0) break;
          const deduct = Math.min(b.currentQuantity, remaining);
          remaining -= deduct;
          const bRef = doc(db, `workspaces/${user.uid}/batches/${b.id}`);
          batch.update(bRef, {
            currentQuantity: b.currentQuantity - deduct,
            updatedAt: serverTimestamp()
          });
        }
      });
      
      await batch.commit();
      toast.success(`Producción de ${produceQuantity} registradas exitosamente`);
      setProduceRecipe(null);
      setProduceQuantity('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workspaces/${user.uid}/products/production`);
    }
  };

  const processedProducts = products.filter(p => p.type === 'processed');
  const materials = products.filter(p => p.type !== 'processed');
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="border-b border-border pb-4 flex items-center gap-3">
         <Beaker className="w-8 h-8 text-primary" />
         <div>
           <h1 className="text-3xl font-bold tracking-tight text-white">Ingeniería de Fórmulas</h1>
           <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
             Diseña recetas y calcula algoritmos de costo real considerando mermas y rendimientos exactos de producción.
           </p>
         </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">1</div>
                <div>
                  <CardTitle className="text-lg text-white">Especificación del Producto Final</CardTitle>
                  <CardDescription className="text-muted-foreground">Define el nombre de la formulación (Ej. Solución Alcalina 5%)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
               <Input 
                 type="text" 
                 value={recipeName} 
                 onChange={e => setRecipeName(e.target.value)} 
                 placeholder="Denominación de la fórmula..." 
                 className="h-12 text-base bg-input border-border text-foreground"
               />
            </CardContent>
          </Card>

          <Card className={!recipeName.trim() ? "opacity-50 pointer-events-none transition-opacity bg-card border-border shadow-lg" : "transition-opacity bg-card border-border shadow-lg"}>
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">2</div>
                <div>
                  <CardTitle className="text-lg text-white">Composición Química / Materiales</CardTitle>
                  <CardDescription className="text-muted-foreground">Añade los insumos que componen esta mezcla y sus proporciones exactas.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-[1fr_120px_auto] gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Insumo</Label>
                  <Select value={currentMaterial} onValueChange={setCurrentMaterial} onOpenChange={(o) => { if(!o) setSearchMaterial(''); }}>
                    <SelectTrigger className="bg-input border-border">
                       <SelectValue placeholder="Seleccionar insumo">
                         {materials.find(m => m.id === currentMaterial)?.name || 'Seleccionar insumo'}
                       </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectSearch value={searchMaterial} onChange={setSearchMaterial} placeholder="Buscar insumo..." />
                      {materials.filter(p => p.name.toLowerCase().includes(searchMaterial.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchMaterial.toLowerCase()))).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cantidad</Label>
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    value={currentQuantity} 
                    onChange={e => setCurrentQuantity(Number(e.target.value) || '')} 
                    placeholder="Ej: 2.5" 
                    className="bg-input border-border"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddComponent} variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </Button>
                </div>
              </div>

              {components.length > 0 && (
                <div className="mt-6 border border-border rounded-lg overflow-hidden bg-muted/10">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Ingrediente</TableHead>
                        <TableHead className="text-right text-muted-foreground">Cantidad</TableHead>
                        <TableHead className="text-right text-muted-foreground">Costo Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.map((c, i) => {
                        const p = products.find(x => x.id === c.productId);
                        const cost = getProductCost(c.productId) * c.quantity;
                        return (
                          <TableRow key={i} className="border-border hover:bg-muted/30">
                            <TableCell className="font-medium text-zinc-200">{p?.name || '...'}</TableCell>
                            <TableCell className="text-right text-zinc-300 font-mono text-sm">{c.quantity} {p?.unit}</TableCell>
                            <TableCell className="text-right text-zinc-300 font-mono text-sm">{formatter.format(cost)}</TableCell>
                            <TableCell className="w-[50px]">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setComponents(components.filter((_, idx) => idx !== i))}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={components.length === 0 ? "opacity-50 pointer-events-none transition-opacity bg-card border-border shadow-lg" : "transition-opacity bg-card border-border shadow-lg"}>
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">3</div>
                <div>
                  <CardTitle className="text-lg text-white">Parámetros de Rendimiento</CardTitle>
                  <CardDescription className="text-muted-foreground">Métricas de conversión y costos operativos por tanda de producción.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-300">Volumen Resultante (Tanda)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    className="h-12 text-lg pr-12 font-medium bg-input border-border text-white text-right font-mono" 
                    value={yieldQty} 
                    onChange={e => setYieldQty(Number(e.target.value) || '')} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium whitespace-nowrap text-sm">
                    Unid.
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">Cuántas unidades completas resultan de esta preparación.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-300">Costo Operativo Fijo</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</div>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    className="h-12 text-lg pl-8 font-medium bg-input border-border text-white text-right font-mono" 
                    value={processCost} 
                    onChange={e => setProcessCost(Number(e.target.value) || '')} 
                  />
                </div>
                <p className="text-[11px] text-zinc-500">Estimación de gastos indirectos (energía, envases, hora hombre).</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 space-y-6">
            <Card className="border-border shadow-xl overflow-hidden bg-sidebar text-white">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 opacity-80">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">Proyección de Costos</h3>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Suma Materiales:</span>
                    <span className="font-mono text-zinc-300">{formatter.format(currentRecipeTotalCost - Number(processCost || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border pb-4">
                    <span className="text-zinc-400">Cargo Operativo:</span>
                    <span className="font-mono text-zinc-300">{formatter.format(Number(processCost || 0))}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-zinc-300 text-sm font-medium">Inversión por Tanda:</span>
                    <span className="text-2xl font-bold font-mono text-white">{formatter.format(currentRecipeTotalCost)}</span>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-8">
                  <span className="block text-primary/80 text-[11px] uppercase tracking-wider mb-2 font-bold">Costo Unitario Real Resultante</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-primary font-mono tracking-tight">
                      {formatter.format(currentRecipeTotalCost / Math.max(Number(yieldQty || 1), 1))}
                    </span>
                    <span className="text-primary/60 font-medium text-sm">/ un</span>
                  </div>
                  <p className="text-primary/60 text-[10px] uppercase font-bold tracking-wider mt-4">
                    Se sincronizará con el maestro de productos automáticamente.
                  </p>
                </div>
              </div>
              <div className="bg-background border-t border-border p-3">
                <Button 
                  className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-orange-500 shadow-lg" 
                  onClick={handleSave}
                  disabled={!recipeName.trim() || components.length === 0}
                >
                  {editingRecipeId ? 'Actualizar Receta' : 'Guardar Receta'}
                </Button>
                {editingRecipeId && (
                  <Button 
                    variant="ghost"
                    className="w-full h-10 mt-2 text-sm text-zinc-400 hover:text-white hover:bg-muted/50"
                    onClick={() => {
                      setRecipeName('');
                      setEditingRecipeId(null);
                      setComponents([]);
                      setYieldQty(1);
                      setProcessCost(0);
                    }}
                  >
                    Abortar edición
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="pt-10 border-t border-border mt-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Fórmulas Vigentes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map(recipe => {
              const product = products.find(p => p.id === recipe.productId);
              const totalCost = recipe.components.reduce((acc, comp) => acc + (getProductCost(comp.productId) * comp.quantity), 0) + recipe.processCost;
              const unitCost = totalCost / Math.max(recipe.yield, 1);
              const isExpanded = expandedRecipeId === recipe.id;

              return (
                <Card key={recipe.id} className="overflow-hidden transition-all duration-200 bg-card border-border shadow-sm hover:border-zinc-700">
                  <div 
                    className="p-5 cursor-pointer bg-card hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-semibold text-lg text-white">{product?.name || 'Producto eliminado'}</h4>
                        <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
                          <span className="font-medium bg-muted text-zinc-300 px-2 py-0.5 rounded border border-border text-xs">Rendimiento: {recipe.yield} un</span>
                          <span className="text-xs">{recipe.components.length} insumos</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-primary font-mono text-xl">{formatter.format(unitCost)}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block leading-none mt-1">Costo un.</span>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-border bg-sidebar p-0">
                      <div className="p-5">
                        <h5 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-4">Composición de fórmula</h5>
                        <div className="space-y-2">
                          {recipe.components.map((c: any, i: number) => {
                            const p = products.find(x => x.id === c.productId);
                            const cost = getProductCost(c.productId) * c.quantity;
                            return (
                              <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                                <span className="font-mono text-zinc-300 text-xs">{c.quantity} {p?.unit} <span className="text-zinc-500 font-sans ml-2">{p?.name}</span></span>
                                <span className="font-mono text-zinc-400 text-xs">{formatter.format(cost)}</span>
                              </div>
                            )
                          })}
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-border flex justify-between items-center text-sm">
                          <span className="text-zinc-400">Costos operativos adicionales:</span>
                          <span className="font-mono text-zinc-300">{formatter.format(recipe.processCost)}</span>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-sm">
                          <span className="text-zinc-400 font-medium">Costo Total de la Tanda:</span>
                          <span className="font-bold text-white font-mono text-base">{formatter.format(totalCost)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 p-3 bg-background border-t border-border justify-end w-full">
                         <div className="flex-1">
                           <Button variant="default" size="sm" className="h-9 bg-primary hover:bg-orange-500 w-auto text-xs px-4 text-white font-medium" onClick={(e) => { e.stopPropagation(); setProduceRecipe(recipe); }}>
                              <PackagePlus className="w-4 h-4 mr-1.5" /> Procesar Lote
                           </Button>
                         </div>
                         <Button variant="outline" size="sm" className="h-9 border-border text-zinc-300 hover:text-white hover:bg-muted" onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe); }}>
                            Modificar
                         </Button>
                         <Button variant="ghost" size="sm" className="h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(recipe.id); }}>
                            <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Destruir fórmula técnica?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta acción eliminará la fórmula de los registros. El historial de costos del producto asociado quedará huérfano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted text-zinc-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmId) handleDelete(deleteConfirmId);
              setDeleteConfirmId(null);
            }} className="bg-red-600 hover:bg-red-500 text-white">Ejecutar Destrucción</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!produceRecipe} onOpenChange={(open) => !open && setProduceRecipe(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Declaración de Producción</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Registra el volumen producido para afectar el inventario:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="bg-muted/30 border border-border p-4 rounded-lg">
                <p className="text-xs text-zinc-400 mb-2 font-bold uppercase tracking-wider">Impacto en Sistema</p>
                <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-4 marker:text-primary">
                   <li>Se descontarán los insumos de stock usando FIFO.</li>
                   <li>Aumentará el stock del producto {products.find(p => p.id === produceRecipe?.productId)?.name}.</li>
                </ul>
             </div>

            <div className="space-y-2 pt-2">
               <Label className="text-zinc-300">Volumen obtenido (Unidades reales)</Label>
               <Input 
                 type="number" 
                 min="0.1" 
                 step="0.1" 
                 value={produceQuantity}
                 onChange={(e) => setProduceQuantity(Number(e.target.value) || '')} 
                 placeholder="Ej: 50"
                 className="text-lg bg-input border-border font-mono h-12"
               />
               <p className="text-xs text-zinc-500 mt-2">
                 Rendimiento estándar declarado: <strong className="text-zinc-300">{produceRecipe?.yield} unid</strong>.
               </p>
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setProduceRecipe(null)} className="border-border hover:bg-muted text-zinc-300">Cancelar</Button>
             <Button onClick={handleProduce} disabled={!produceQuantity} className="bg-primary hover:bg-orange-500 text-white font-bold">Autorizar Procesamiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
