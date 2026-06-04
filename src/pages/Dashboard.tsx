import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { settings, products, purchases, sales, batches, loading } = useWorkspaceData(user?.uid);

  if (loading || !settings) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;

  const inventoryValue = products.reduce((acc, p) => {
    const usableRate = 1 - Math.min(p.wasteRate || 0, 99) / 100;
    const unitCost = ((p.purchaseCost || 0) + (p.extraCost || 0)) / Math.max(usableRate, 0.01);
    return acc + (unitCost * (p.stock || 0));
  }, 0);

  const lowStockProducts = products.filter(p => p.stock <= settings.lowStockLimit);
  
  const today = new Date();
  const expiringBatches = (batches || []).filter(b => {
     if (!b.expirationDate || b.currentQuantity <= 0) return false;
     const expDate = new Date(b.expirationDate);
     const diffTime = expDate.getTime() - today.getTime();
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays <= 90; // Alerting under 90 days
  }).sort((a, b) => new Date(a.expirationDate || 0).getTime() - new Date(b.expirationDate || 0).getTime());
  
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: settings.currency || 'ARS'
  });

  // Analytics logic
  // 1. Sales over the last 14 days
  const last14Days = Array.from({ length: 14 }).map((_, i) => subDays(new Date(), 13 - i));
  const salesData = last14Days.map(date => {
    const daySales = (sales || []).filter((s: any) => {
      const sDate = s.createdAt?.toMillis ? new Date(s.createdAt.toMillis()) : new Date(s.createdAt);
      return isSameDay(sDate, date);
    });
    const totalDay = daySales.reduce((acc: number, s: any) => acc + (s.total || 0), 0);
    return {
      date: format(date, 'dd/MM'),
      ventas: totalDay
    };
  });

  // 2. Purchases vs Sales Summary (Last 30 days roughly, or overall)
  const currentMonthSales = (sales || []).reduce((acc: number, s: any) => acc + (s.total || 0), 0);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de control y Analíticas</h1>
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
            <CardTitle className="text-sm font-medium">Ingresos Totales (Mes)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatter.format(currentMonthSales)}</div>
            <p className="text-xs text-zinc-500">ventas registradas</p>
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
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Ventas (Últimos 14 días)</CardTitle>
          </CardHeader>
          <CardContent className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#e4e4e7" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  formatter={(value: number) => [formatter.format(value), 'Ventas']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ... (Existing sections integrated) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                 <p className="text-sm text-zinc-500">Tu nivel de stock es óptimo.</p>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
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
              <CardTitle>Lotes por vencer (Próximos 90 días)</CardTitle>
            </CardHeader>
            <CardContent>
              {expiringBatches.length === 0 ? (
                 <p className="text-sm text-zinc-500">No hay lotes en riesgo de vencimiento cercano.</p>
              ) : (
                <div className="space-y-4">
                  {expiringBatches.slice(0, 5).map(b => {
                    const prodName = products.find(p => p.id === b.productId)?.name || 'Producto Desconocido';
                    const expDate = new Date(b.expirationDate);
                    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const variantClass = diffDays < 0 ? 'bg-red-100 text-red-800' : diffDays <= 30 ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800';

                    return (
                      <div key={b.id} className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{prodName} <span className="text-zinc-500 text-xs font-normal ml-1">(Lote: {b.lotNumber})</span></span>
                          <span className="text-xs text-zinc-500">Restan: {b.currentQuantity} unid. - Vence: {expDate.toLocaleDateString()}</span>
                        </div>
                        <span className={`rounded-full text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${variantClass}`}>
                          {diffDays < 0 ? 'Vencido' : `${diffDays} días`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
