import { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Trash2, Plus, ArrowRight, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Recipes() {
  const { user } = useAuth();
  const { settings, products, recipes } = useWorkspaceData(user?.uid);
  
  const [recipeName, setRecipeName] = useState('');
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [components, setComponents] = useState<{productId: string, quantity: number}[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>('');
  const [yieldQty, setYieldQty] = useState<number | ''>(1);
  const [processCost, setProcessCost] = useState<number | ''>(0);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: settings?.currency || 'ARS' });

  const getProductCost = (productId: string) => {
     const p = products.find(p => p.id === productId);
     if (!p) return 0;
     const base = Number(p.purchaseCost) + Number(p.extraCost);
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
    if (!confirm('¿Eliminar esta fórmula?')) return;

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

  const processedProducts = products.filter(p => p.type === 'processed');
  const materials = products.filter(p => p.type !== 'processed');
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Armador de Fórmulas</h1>
         <p className="text-zinc-500 mt-2 text-lg max-w-2xl">
           Calcula el costo real de tus elaboraciones. Define qué ingredientes usas, cuánto rinde la preparación y la app calculará automáticamente el costo de tu producto final.
         </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">1</div>
                <div>
                  <CardTitle className="text-lg text-emerald-950">¿Qué vas a elaborar?</CardTitle>
                  <CardDescription className="text-emerald-700/80">Escribe el nombre de la receta o del producto final</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
               <Input 
                 type="text" 
                 value={recipeName} 
                 onChange={e => setRecipeName(e.target.value)} 
                 placeholder="Ej. Jabón, Suavizante, etc..." 
                 className="h-12 text-base"
               />
            </CardContent>
          </Card>

          <Card className={!recipeName.trim() ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity shadow-sm"}>
            <CardHeader className="bg-zinc-50 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold">2</div>
                <div>
                  <CardTitle className="text-lg">Ingredientes de la receta</CardTitle>
                  <CardDescription>¿Qué insumos y en qué cantidad necesitas para esta preparación?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-[1fr_120px_auto] gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">Materia Prima</Label>
                  <Select value={currentMaterial} onValueChange={setCurrentMaterial}>
                    <SelectTrigger>
                       <SelectValue placeholder="Seleccionar insumo">
                         {materials.find(m => m.id === currentMaterial)?.name || 'Seleccionar insumo'}
                       </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">Cantidad</Label>
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    value={currentQuantity} 
                    onChange={e => setCurrentQuantity(Number(e.target.value) || '')} 
                    placeholder="Ej: 2.5" 
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddComponent} variant="secondary">
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </Button>
                </div>
              </div>

              {components.length > 0 && (
                <div className="mt-6 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.map((c, i) => {
                        const p = products.find(x => x.id === c.productId);
                        const cost = getProductCost(c.productId) * c.quantity;
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{p?.name || '...'}</TableCell>
                            <TableCell className="text-right">{c.quantity} {p?.unit}</TableCell>
                            <TableCell className="text-right">{formatter.format(cost)}</TableCell>
                            <TableCell className="w-[50px]">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => setComponents(components.filter((_, idx) => idx !== i))}>
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

          <Card className={components.length === 0 ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity shadow-sm"}>
            <CardHeader className="bg-zinc-50 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold">3</div>
                <div>
                  <CardTitle className="text-lg">Rendimiento y Producción</CardTitle>
                  <CardDescription>¿Cuántas unidades salen de esta tanda y qué otros gastos hubo?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base text-zinc-900">Rendimiento Total (Tanda)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    className="h-12 text-lg pr-12 font-medium" 
                    value={yieldQty} 
                    onChange={e => setYieldQty(Number(e.target.value) || '')} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium whitespace-nowrap">
                    Unidades
                  </div>
                </div>
                <p className="text-xs text-zinc-500">¿Cuántos productos obtienes al usar todos esos ingredientes?</p>
              </div>

              <div className="space-y-3">
                <Label className="text-base text-zinc-900">Costo de Elaboración</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</div>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    className="h-12 text-lg pl-8 font-medium" 
                    value={processCost} 
                    onChange={e => setProcessCost(Number(e.target.value) || '')} 
                  />
                </div>
                <p className="text-xs text-zinc-500">Gasto estimado en gas, luz, mano de obra o packaging de esta tanda entera.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 space-y-6">
            <Card className="border-zinc-950 shadow-xl overflow-hidden bg-zinc-950 text-white">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 opacity-80">
                  <Calculator className="w-5 h-5" />
                  <h3 className="font-semibold uppercase tracking-wider text-sm">Resumen de Costos</h3>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Costo Materiales:</span>
                    <span className="font-medium">{formatter.format(currentRecipeTotalCost - Number(processCost || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                    <span className="text-zinc-400">Costo Elaboración:</span>
                    <span className="font-medium">{formatter.format(Number(processCost || 0))}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-zinc-400">Costo Total Tanda:</span>
                    <span className="text-2xl font-bold">{formatter.format(currentRecipeTotalCost)}</span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mb-8">
                  <span className="block text-emerald-400/80 text-sm mb-1 font-medium">Costo por unidad de producto:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-400">
                      {formatter.format(currentRecipeTotalCost / Math.max(Number(yieldQty || 1), 1))}
                    </span>
                    <span className="text-emerald-400/60 font-medium">/ un</span>
                  </div>
                  <p className="text-emerald-400/60 text-xs mt-3 leading-relaxed">
                    Este costo se actualizará automáticamente en tu listado de productos como el costo base del producto terminado.
                  </p>
                </div>
              </div>
              <div className="bg-zinc-900 p-2">
                <Button 
                  className="w-full h-12 text-base font-bold bg-white text-zinc-950 hover:bg-zinc-200" 
                  onClick={handleSave}
                  disabled={!recipeName.trim() || components.length === 0}
                >
                  {editingRecipeId ? 'Actualizar Fórmula' : 'Guardar Fórmula'}
                </Button>
                {editingRecipeId && (
                  <Button 
                    variant="ghost"
                    className="w-full h-10 mt-2 text-sm text-zinc-400 hover:text-white"
                    onClick={() => {
                      setRecipeName('');
                      setEditingRecipeId(null);
                      setComponents([]);
                      setYieldQty(1);
                      setProcessCost(0);
                    }}
                  >
                    Cancelar edición
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="pt-10 border-t mt-12">
          <h2 className="text-2xl font-bold mb-6">Tus Fórmulas Guardadas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map(recipe => {
              const product = products.find(p => p.id === recipe.productId);
              const totalCost = recipe.components.reduce((acc, comp) => acc + (getProductCost(comp.productId) * comp.quantity), 0) + recipe.processCost;
              const unitCost = totalCost / Math.max(recipe.yield, 1);
              const isExpanded = expandedRecipeId === recipe.id;

              return (
                <Card key={recipe.id} className="overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md">
                  <div 
                    className="p-5 cursor-pointer bg-white"
                    onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-semibold text-lg text-zinc-900">{product?.name || 'Producto eliminado'}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                          <span className="font-medium bg-zinc-100 px-2 py-0.5 rounded-md">Rinde: {recipe.yield} un</span>
                          <span>{recipe.components.length} ingredientes</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-emerald-600 text-lg">{formatter.format(unitCost)}</span>
                        <span className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide block leading-none">Costo un.</span>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t bg-zinc-50/50 p-5 p-0">
                      <div className="p-5">
                        <h5 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">Ingredientes de esta fórmula</h5>
                        <div className="space-y-2">
                          {recipe.components.map((c, i) => {
                            const p = products.find(x => x.id === c.productId);
                            const cost = getProductCost(c.productId) * c.quantity;
                            return (
                              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-zinc-100 last:border-0">
                                <span className="font-medium text-zinc-700">{c.quantity} {p?.unit} <span className="text-zinc-400 font-normal ml-1">{p?.name}</span></span>
                                <span className="text-zinc-600">{formatter.format(cost)}</span>
                              </div>
                            )
                          })}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Gastos de elaboración:</span>
                          <span className="font-medium">{formatter.format(recipe.processCost)}</span>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Costo Total de Tanda:</span>
                          <span className="font-bold text-zinc-900">{formatter.format(totalCost)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 p-3 bg-zinc-100/50 border-t justify-end">
                         <Button variant="outline" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe); }}>
                            Editar Fórmula
                         </Button>
                         <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
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
    </div>
  );
}
