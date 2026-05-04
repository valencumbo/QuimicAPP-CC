import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const { settings, products, purchases, loading } = useWorkspaceData(user?.uid);

  if (loading || !settings) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;

  const inventoryValue = products.reduce((acc, p) => {
    const usableRate = 1 - Math.min(p.wasteRate || 0, 99) / 100;
    const unitCost = ((p.purchaseCost || 0) + (p.extraCost || 0)) / Math.max(usableRate, 0.01);
    return acc + (unitCost * (p.stock || 0));
  }, 0);

  const lowStockProducts = products.filter(p => p.stock <= settings.lowStockLimit);
  
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: settings.currency || 'ARS'
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de costos</h1>
        <p className="text-zinc-500 mt-2">Resumen operativo para tu negocio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-zinc-500">fichas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor de Stock</CardTitle>
            <Coins className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(inventoryValue)}</div>
            <p className="text-xs text-zinc-500">costo acumulado estimado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Recientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-zinc-500">movimientos de ingreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStockProducts.length > 0 ? "text-amber-500" : "text-zinc-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-zinc-500">productos bajos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas advertencias</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
               <p className="text-sm text-zinc-500">Tu stock parece estar en orden.</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-zinc-500">Stock actual: {p.stock} {p.unit}</span>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] px-2 py-1 font-bold uppercase tracking-wider">Stock bajo</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Últimas compras registradas</CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
               <p className="text-sm text-zinc-500">No hay compras recientes.</p>
            ) : (
              <div className="space-y-4">
                {purchases.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(p => {
                  const product = products.find(prod => prod.id === p.productId);
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{product?.name || 'Producto eliminado'}</span>
                        <span className="text-xs text-zinc-500">{new Date(p.date).toLocaleDateString()} - {p.supplier}</span>
                      </div>
                      <span className="text-sm font-bold">{formatter.format(p.quantity * p.unitCost + p.extraCost)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
