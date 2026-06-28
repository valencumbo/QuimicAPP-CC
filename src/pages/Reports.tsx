import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Package, Archive, RefreshCw, ShoppingCart, TestTube, DownloadCloud, ShieldCheck, Beaker } from 'lucide-react';
import { useAuth, useWorkspaceData } from '../lib/hooks';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export default function Reports() {
  const { user } = useAuth();
  const { products, batches, purchases, recipes, suppliers, settings } = useWorkspaceData(user?.uid);
  const [exporting, setExporting] = useState(false);

  const downloadPDF = (data: any[], filename: string, title: string) => {
    if (!data || data.length === 0) {
      toast.error('No hay datos disponibles para exportar en este reporte.');
      return;
    }

    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h]));

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 22);

    // @ts-ignore
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27] }, // zinc-900
      styles: { fontSize: 8 }
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(`Archivo PDF generado: ${filename}.pdf`);
  };

  const exportStock = () => {
    const data = products.map(p => ({
      'ID': p.sku || p.id,
      'Nombre del Producto': p.name,
      'Categoría': p.category,
      'Stock Actual': p.stock,
      'Unidad de Medida': p.unit,
      'Costo de Reposición': p.purchaseCost,
      'Moneda': p.currency || settings?.currency || 'ARS',
      'Margen Obj.': p.targetMargin,
    }));
    downloadPDF(data, 'Inventario_Productos', 'Reporte de Inventario y Stock');
  };

  const exportBatches = () => {
    const data = batches.map(b => {
      const p = products.find(prod => prod.id === b.productId);
      const s = suppliers.find(sup => sup.id === b.supplierId);
      return {
        'Lote N°': b.lotNumber,
        'Producto': p?.name || 'Desconocido',
        'Cantidad Actual': b.currentQuantity,
        'Cantidad Inicial': b.initialQuantity,
        'Fecha Vencimiento': b.expirationDate,
        'Fecha Elaboración': b.manufacturingDate,
        'Ubicación': b.location,
        'Proveedor Origen': s?.name || b.supplierId || 'Ninguno',
        'Costo Unitario Lote': b.unitCost,
        'Moneda': b.currency || settings?.currency || 'ARS'
      };
    });
    downloadPDF(data, 'Lotes_y_Trazabilidad', 'Reporte de Lotes y Trazabilidad');
  };

  const exportPurchases = () => {
    const data = purchases.map(p => {
      const prod = products.find(prod => prod.id === p.productId);
      return {
        'Fecha': p.date,
        'Producto': prod?.name || 'Desconocido',
        'Cantidad': p.quantity,
        'Costo Unitario': p.unitCost,
        'Costo Extra': p.extraCost,
        'Costo Total': (p.quantity * p.unitCost) + (p.extraCost || 0),
        'Moneda': p.currency || settings?.currency || 'ARS',
        'Nota / N° Factura': p.note
      };
    });
    downloadPDF(data, 'Historial_Compras', 'Historial de Compras y Recepciones');
  };

  const exportRecipes = () => {
    const getExchangeRate = (pCurrency?: string) => {
      const base = settings?.currency || 'ARS';
      const prodCurr = pCurrency || base;
      if (prodCurr === 'USD' && base === 'ARS') return settings?.usdRate || 1;
      if (prodCurr === 'ARS' && base === 'USD') return 1 / Math.max(settings?.usdRate || 1, 0.01);
      return 1;
    };

    const getProductCost = (productId: string) => {
       const cp = products.find(prod => prod.id === productId);
       if (!cp) return 0;
       const rate = getExchangeRate(cp.currency);
       const base = (Number(cp.purchaseCost) + Number(cp.extraCost)) * rate;
       const usable = 1 - Math.min(Number(cp.wasteRate) || 0, 99) / 100;
       return base / Math.max(usable, 0.01);
    };

    const data = recipes.map(r => {
      const p = products.find(prod => prod.id === r.productId);
      let totalCost = r.processCost || 0;
      r.components.forEach(c => {
         totalCost += (getProductCost(c.productId) * c.quantity);
      });
      return {
        'Producto Resultante': p?.name || 'Desconocido',
        'Rinde (Cantidad)': r.yield,
        'Unidad': p?.unit || 'unid.',
        'Costo de Producción Estimado': totalCost,
        'Costo Fijo de Proceso': r.processCost,
        'Cantidad de Ingredientes': r.components.length
      };
    });
    downloadPDF(data, 'Catalogo_Recetas', 'Análisis de Costos de Producción y Recetas');
  };

  const handleExportBackup = async () => {
    if (!user?.uid) return;
    setExporting(true);
    toast.info('Generando archivo de resguardo...');

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Reporte Maestro de Resguardo', 14, 22);
      doc.setFontSize(10);
      doc.text(`Fecha de exportación: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Usuario Autorizado: ${user.email}`, 14, 35);

      doc.setFontSize(14);
      doc.text('Inventario Principal', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Nombre', 'SKU', 'Stock', 'Costo']],
        body: products.map(p => [
          p.name, 
          p.sku, 
          `${p.stock} ${p.unit}`, 
          `${p.currency || 'ARS'} ${p.purchaseCost}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [24, 24, 27] },
      });

      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Fórmulas Activas', 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Receta', 'Rendimiento', 'Costo Operativo']],
        body: recipes.map(r => [
          products.find(p => p.id === r.productId)?.name || 'Receta', 
          `${r.yield} unidades`, 
          `$${r.processCost}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [24, 24, 27] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
      const q = query(collection(db, `workspaces/${user.uid}/sales`), where('workspaceId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const sales = snap.docs.map(d => d.data());

      doc.setFontSize(14);
      doc.text('Registros Comerciales Recientes', 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Cliente', 'Fecha', 'Ítems', 'Total']],
        body: sales.slice(0, 50).map(s => [
          s.clientName,
          new Date(s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now()).toLocaleDateString(),
          s.items?.length || 0,
          `${s.currency} ${s.totalAmount}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [24, 24, 27] },
      });

      doc.save(`Resguardo_Maestro_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Resguardo maestro generado exitosamente');
    } catch(err) {
      console.error(err);
      toast.error('Ocurrió un error crítico al generar el resguardo');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Archive className="w-8 h-8 text-primary" />
            Reportes y Resguardo
          </h1>
          <p className="text-muted-foreground mt-2">Exporta listas, balances e información clasificada en formato PDF.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-2">
              <Package className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-white">Inventario Base</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Exporta el listado completo de productos, costos unitarios y existencias.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm border-border hover:bg-muted text-foreground" onClick={exportStock}>
              <FileText className="w-4 h-4 mr-2 text-emerald-500" />
              Descargar PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-2">
              <TestTube className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-white">Lotes y Trazabilidad</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Listado de lotes elaborados, trazabilidad e inspección de vencimientos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm border-border hover:bg-muted text-foreground" onClick={exportBatches}>
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Descargar PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-white">Compras y Abastecimiento</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Balance histórico de todas las compras de materias primas a proveedores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm border-border hover:bg-muted text-foreground" onClick={exportPurchases}>
              <FileText className="w-4 h-4 mr-2 text-purple-500" />
              Descargar PDF
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-2">
              <Beaker className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-white">Análisis de Fórmulas</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Detalle de recetas maestras y proyecciones de costos operativos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm border-border hover:bg-muted text-foreground" onClick={exportRecipes}>
              <FileText className="w-4 h-4 mr-2 text-amber-500" />
              Descargar PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cierre Comercial</h2>
        <Card className="bg-card border-border shadow-lg mb-8">
          <CardHeader className="pb-4 border-b border-border bg-muted/20">
            <CardTitle className="text-base text-white">Cierre entre Fechas</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Genera un balance de ingresos (ventas) y egresos (compras) para un período.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-end gap-4">
               <div className="space-y-2 flex-1">
                 <label className="text-sm text-zinc-300">Fecha de Inicio</label>
                 <input type="date" className="w-full h-10 px-3 py-2 bg-input border border-border rounded-md text-sm" id="startDate" defaultValue={new Date(new Date().setDate(1)).toISOString().split('T')[0]} />
               </div>
               <div className="space-y-2 flex-1">
                 <label className="text-sm text-zinc-300">Fecha de Fin</label>
                 <input type="date" className="w-full h-10 px-3 py-2 bg-input border border-border rounded-md text-sm" id="endDate" defaultValue={new Date().toISOString().split('T')[0]} />
               </div>
               <Button className="h-10 bg-primary text-white hover:bg-orange-500 shrink-0" onClick={async () => {
                  const start = (document.getElementById('startDate') as HTMLInputElement).value;
                  const end = (document.getElementById('endDate') as HTMLInputElement).value;
                  if (!start || !end) return toast.error('Selecciona ambas fechas');
                  if (start > end) return toast.error('La fecha de inicio debe ser menor a la de fin');
                  
                  toast.info('Generando cierre de caja...');
                  
                  // Fetch sales in range
                  const startTimestamp = new Date(start + 'T00:00:00');
                  const endTimestamp = new Date(end + 'T23:59:59');
                  
                  const qSales = query(collection(db, `workspaces/${user?.uid}/sales`), where('workspaceId', '==', user?.uid));
                  const snapSales = await getDocs(qSales);
                  const sales = snapSales.docs.map(d => d.data() as any).filter(s => {
                    const d = new Date(s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now());
                    return d >= startTimestamp && d <= endTimestamp;
                  });
                  
                  // Filter purchases in range
                  const purchasesInRange = purchases.filter(p => {
                    const d = new Date(p.date + 'T12:00:00'); // Midday to avoid timezone issues
                    return d >= startTimestamp && d <= endTimestamp;
                  });
                  
                  let totalSalesARS = 0;
                  let totalPurchasesARS = 0;
                  
                  sales.forEach(s => {
                     // Assume ARS if not specified, simplify for report
                     if (s.currency === 'ARS' || !s.currency) totalSalesARS += s.totalAmount;
                     else totalSalesARS += (s.totalAmount * (settings?.usdRate || 1));
                  });
                  
                  purchasesInRange.forEach(p => {
                     const total = (p.quantity * p.unitCost) + (p.extraCost || 0);
                     if (p.currency === 'ARS' || !p.currency) totalPurchasesARS += total;
                     else totalPurchasesARS += (total * (settings?.usdRate || 1));
                  });
                  
                  const doc = new jsPDF();
                  doc.setFontSize(18);
                  doc.text('Cierre de Caja Operativa', 14, 22);
                  doc.setFontSize(10);
                  doc.text(`Período: ${start} hasta ${end}`, 14, 30);
                  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 35);
                  
                  doc.setFontSize(14);
                  doc.text('Balance General (Expresado en Moneda Base)', 14, 45);
                  
                  autoTable(doc, {
                    startY: 50,
                    head: [['Concepto', 'Total (Aprox. ARS)']],
                    body: [
                      ['Ingresos por Ventas', `$ ${totalSalesARS.toFixed(2)}`],
                      ['Egresos por Compras', `$ ${totalPurchasesARS.toFixed(2)}`],
                      ['BALANCE DEL PERÍODO', `$ ${(totalSalesARS - totalPurchasesARS).toFixed(2)}`]
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [24, 24, 27] },
                  });
                  
                  let currentY = (doc as any).lastAutoTable.finalY + 15;
                  doc.setFontSize(14);
                  doc.text('Detalle de Ventas', 14, currentY);
                  
                  autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Fecha', 'Cliente', 'Moneda', 'Total']],
                    body: sales.map(s => [
                      new Date(s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now()).toLocaleDateString(),
                      s.clientName || 'Consumidor Final',
                      s.currency || 'ARS',
                      s.totalAmount.toFixed(2)
                    ]),
                    theme: 'grid'
                  });
                  
                  currentY = (doc as any).lastAutoTable.finalY + 15;
                  doc.addPage();
                  doc.setFontSize(14);
                  doc.text('Detalle de Compras', 14, 22);
                  
                  autoTable(doc, {
                    startY: 28,
                    head: [['Fecha', 'Producto', 'Cant.', 'Total Pago']],
                    body: purchasesInRange.map(p => {
                      const prod = products.find(pr => pr.id === p.productId);
                      const total = (p.quantity * p.unitCost) + (p.extraCost || 0);
                      return [
                        p.date,
                        prod?.name || 'Item',
                        `${p.quantity} ${prod?.unit || ''}`,
                        `${p.currency || 'ARS'} ${total.toFixed(2)}`
                      ]
                    }),
                    theme: 'grid'
                  });
                  
                  doc.save(`Cierre_${start}_${end}.pdf`);
                  toast.success('Cierre generado exitosamente');
               }}>
                 <FileText className="w-4 h-4 mr-2" /> Generar Cierre
               </Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold text-white mb-4">Acciones Críticas</h2>
        <Card className="bg-muted/30 border-border shadow-inner">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
               <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-base font-bold text-white mb-1">Resguardo Maestro del Sistema</h3>
                 <p className="text-sm text-muted-foreground">Genera un documento PDF global que consolida todo el estado actual del inventario, recetas y ventas recientes. Recomendado realizar semanalmente para auditoría externa.</p>
               </div>
            </div>
            <Button className="shrink-0 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20" onClick={handleExportBackup} disabled={exporting}>
               <DownloadCloud className="w-5 h-5 mr-2" />
               {exporting ? 'Procesando...' : 'Descargar Resguardo'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
