import { useState, useEffect } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, Coins, FlaskConical, Activity, Archive, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { db } from '@/src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

export default function Dashboard() {
  const { user } = useAuth();
  const { settings, products, purchases, batches, loading } = useWorkspaceData(user?.uid);
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchSales = async () => {
      try {
        const q = query(collection(db, `workspaces/${user.uid}/sales`), where('workspaceId', '==', user.uid), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSales(false);
      }
    };
    fetchSales();
  }, [user?.uid]);

  if (loading || loadingSales || !settings) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );

  const inventoryValue = products.reduce((acc, p) => {
    const usableRate = 1 - Math.min(p.wasteRate || 0, 99) / 100;
    const unitCost = ((p.purchaseCost || 0) + (p.extraCost || 0)) / Math.max(usableRate, 0.01);
    return acc + (unitCost * (p.stock || 0));
  }, 0);

  const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 0));
  
  const today = new Date();
  const expiringBatches = (batches || []).filter(b => {
     if (!b.expirationDate || b.currentQuantity <= 0) return false;
     const expDate = new Date(b.expirationDate);
     const diffTime = expDate.getTime() - today.getTime();
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays <= 90; 
  }).sort((a, b) => new Date(a.expirationDate || 0).getTime() - new Date(b.expirationDate || 0).getTime());
  
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: settings.currency || 'ARS'
  });

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

  const currentMonthSales = (sales || []).reduce((acc: number, s: any) => acc + (s.total || 0), 0);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Panel Operativo
          </h1>
          <p className="text-muted-foreground mt-2">Métricas y alertas en tiempo real de tu laboratorio.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Productos Activos</CardTitle>
            <FlaskConical className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Fórmulas e insumos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Valor de Inventario</CardTitle>
            <Coins className="h-5 w-5 text-emerald-400 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 break-all leading-tight">
              {formatter.format(inventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Capital inmovilizado</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ingresos Mensuales</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-all leading-tight">
              {formatter.format(currentMonthSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Facturación actual</p>
          </CardContent>
        </Card>
        <Card 
          className={`bg-card border-border shadow-lg transition-colors cursor-pointer hover:bg-zinc-900/50 ${lowStockProducts.length > 0 || expiringBatches.length > 0 ? "border-red-500/20" : ""}`}
          onClick={() => setAlertsOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alertas Criticas</CardTitle>
            <AlertTriangle className={`h-5 w-5 shrink-0 ${lowStockProducts.length > 0 || expiringBatches.length > 0 ? "text-red-500" : "text-zinc-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{lowStockProducts.length + expiringBatches.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Ver detalles</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-3 lg:col-span-2 bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Curva de Facturación (Últimos 14 días)</CardTitle>
            <CardDescription className="text-muted-foreground">Evolución de ventas y análisis de tendencia.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 w-full pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  formatter={(value: number) => [formatter.format(value), 'Facturado']}
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#27272A', borderRadius: '8px', color: '#F4F4F5' }}
                  itemStyle={{ color: '#FB923C' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#FB923C" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Stock Crítico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                 <p className="text-sm text-muted-foreground">Tu nivel de stock es óptimo.</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[150px]">{p.name}</span>
                        <span className="text-xs text-muted-foreground">Quedan {p.stock} {p.unit}</span>
                      </div>
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Bajo
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-red-400" />
                Lotes en Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringBatches.length === 0 ? (
                 <p className="text-sm text-muted-foreground">Sin vencimientos cercanos.</p>
              ) : (
                <div className="space-y-3">
                  {expiringBatches.slice(0, 4).map(b => {
                    const prodName = products.find(p => p.id === b.productId)?.name || 'Desconocido';
                    const expDate = new Date(b.expirationDate);
                    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isCritical = diffDays <= 30;

                    return (
                      <div key={b.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200 truncate max-w-[150px]">{prodName}</span>
                          <span className="text-xs text-muted-foreground">Vence: {expDate.toLocaleDateString()}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          isCritical 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          {diffDays < 0 ? 'Vencido' : `${diffDays}d`}
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

      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alertas Críticas
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Detalle de los insumos y lotes que requieren tu atención.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
            {lowStockProducts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Stock Crítico ({lowStockProducts.length})
                </h3>
                <div className="space-y-2">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="bg-zinc-900/50 p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-white">{p.name}</span>
                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Quedan {p.stock}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-3">Mínimo requerido: {p.minStock}</p>
                      <Link to="/products" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                        Ir a reponer stock <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expiringBatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Archive className="w-4 h-4 text-red-400" />
                  Lotes en Riesgo ({expiringBatches.length})
                </h3>
                <div className="space-y-2">
                  {expiringBatches.map(b => {
                    const prodName = products.find(p => p.id === b.productId)?.name || 'Desconocido';
                    const expDate = new Date(b.expirationDate);
                    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isCritical = diffDays <= 30;

                    return (
                      <div key={b.id} className="bg-zinc-900/50 p-3 rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-sm font-medium text-white block">{prodName}</span>
                            <span className="text-xs text-zinc-400">Lote: {b.lotNumber} • Quedan: {b.currentQuantity}</span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            isCritical ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {diffDays < 0 ? 'Vencido' : `${diffDays} días`}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">Vencimiento: {expDate.toLocaleDateString()}</p>
                        <Link to="/lotes" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                          Ir a revisar lote <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {lowStockProducts.length === 0 && expiringBatches.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No hay alertas críticas en este momento.</p>
              </div>
            )}
          </div>
          
          <div className="pt-4 flex justify-end border-t border-border mt-4">
            <Button variant="outline" onClick={() => setAlertsOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
