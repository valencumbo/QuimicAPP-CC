import { useState, useMemo } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderGenerator() {
  const { user } = useAuth();
  const { products, settings } = useWorkspaceData(user?.uid);
  
  // Group low stock products by supplier
  const suggestedOrders = useMemo(() => {
    const limit = settings?.lowStockLimit || 5;
    const lowStock = products.filter(p => p.stock <= limit);
    
    const bySupplier: Record<string, any[]> = {};
    lowStock.forEach(p => {
      const supplierName = p.supplier?.trim() || 'Sin Proveedor';
      if (!bySupplier[supplierName]) bySupplier[supplierName] = [];
      bySupplier[supplierName].push(p);
    });

    return bySupplier;
  }, [products, settings]);

  const suppliersList = Object.keys(suggestedOrders).sort((a,b) => a.localeCompare(b));

  const copyToClipboard = (supplier: string) => {
    const items = suggestedOrders[supplier];
    const header = `📦 *Pedido sugerido para ${supplier}*\n\n`;
    
    const itemsText = items.map(p => {
      const needed = settings?.lowStockLimit ? (settings.lowStockLimit * 2) - p.stock : 10;
      return `- ${p.name} (SKU: ${p.sku || 'N/A'})\n  Stock actual: ${p.stock} ${p.unit} | Sugerido pedir: ${needed > 0 ? needed : 5} ${p.unit}`;
    }).join('\n\n');
    
    const text = header + itemsText + '\n\nGenerado por Costeo Comercial';
    
    navigator.clipboard.writeText(text);
    toast.success('Pedido copiado al portapapeles');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-border pb-4 flex items-center gap-3">
        <Truck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Generador de Pedidos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Automatiza la reposición de stock sugiriendo compras basadas en tu inventario bajo.</p>
        </div>
      </div>

      {suppliersList.length === 0 ? (
        <Card className="bg-card border-border border-dashed border-2 shadow-sm">
          <CardContent className="h-64 flex flex-col items-center justify-center text-center p-6">
            <Truck className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white">¡Todo en orden!</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">No hay productos por debajo del límite de stock ({settings?.lowStockLimit || 5} unidades). No necesitas pedir nada por ahora.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {suppliersList.map(supplier => {
            const items = suggestedOrders[supplier];
            return (
              <Card key={supplier} className="flex flex-col bg-card border-border shadow-lg hover:border-zinc-700 transition-colors">
                <CardHeader className="pb-3 border-b border-border bg-muted/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-white font-bold">{supplier}</CardTitle>
                      <CardDescription className="text-zinc-400 font-mono text-xs mt-1">{items.length} productos con bajo stock</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div className="pr-4">
                          <span className="font-medium text-zinc-200 block">{item.name}</span>
                          <span className="text-xs text-red-400 block font-mono mt-0.5">Quedan: {item.stock} {item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="p-4 bg-muted/20 border-t border-border rounded-b-xl flex gap-2">
                  <Button variant="outline" className="w-full text-xs font-semibold border-primary/50 text-primary hover:bg-primary hover:text-white transition-colors group" onClick={() => copyToClipboard(supplier)}>
                    <Copy className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Copiar lista
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
