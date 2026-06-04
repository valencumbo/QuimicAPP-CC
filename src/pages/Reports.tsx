import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Package, Archive, RefreshCw, ShoppingCart, TestTube } from 'lucide-react';
import { useAuth, useWorkspaceData } from '../lib/hooks';
import { toast } from 'sonner';

export default function Reports() {
  const { user } = useAuth();
  const { products, batches, purchases, recipes, suppliers, settings } = useWorkspaceData(user?.uid);

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
      headStyles: { fillColor: [39, 39, 42] }, // zinc-800
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
      'Costo de Reposición': p.replacementCost,
      'Moneda': p.currency || settings?.currency || 'ARS',
      'Minimo Ideal': p.idealStock,
      'Limite de Alerta': p.lowStockLimit,
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
    const data = recipes.map(r => {
      const p = products.find(prod => prod.id === r.productId);
      let totalCost = r.processCost || 0;
      r.components.forEach(c => {
         const cp = products.find(prod => prod.id === c.productId);
         if (cp) {
            totalCost += (cp.replacementCost * c.quantity);
         }
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Reportes y Exportación</h1>
          <p className="text-sm text-zinc-500">Descarga tu información en formato PDF para balances y análisis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <Package className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Inventario Stock</CardTitle>
            <CardDescription className="text-xs">Exporta el listado completo de productos y sus niveles de inventario.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={exportStock}>
              <FileText className="w-4 h-4 mr-2 text-zinc-500" />
              Generar PDF Stock
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              <Archive className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Lotes y Trazabilidad</CardTitle>
            <CardDescription className="text-xs">Descarga todos los lotes activos e inactivos con sus fechas de vencimiento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={exportBatches}>
              <FileText className="w-4 h-4 mr-2 text-zinc-500" />
              Generar PDF Lotes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Historial de Compras</CardTitle>
            <CardDescription className="text-xs">Balance de todos los ingresos de mercadería, notas y costos totales.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={exportPurchases}>
              <FileText className="w-4 h-4 mr-2 text-zinc-500" />
              Generar PDF Compras
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
              <TestTube className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">Análisis de Costos</CardTitle>
            <CardDescription className="text-xs">Descarga de recetas armadas y sus costos estimados de producción.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={exportRecipes}>
              <FileText className="w-4 h-4 mr-2 text-zinc-500" />
              Generar PDF Costos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
