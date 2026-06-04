import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Receipt, Package, ShoppingCart, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickActionBtn() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { label: 'Nueva Venta', icon: Receipt, path: '/billing' },
    { label: 'Nueva Compra', icon: ShoppingCart, path: '/purchases' },
    { label: 'Registrar Producción', icon: TestTube, path: '/recipes' },
    { label: 'Nuevo Producto', icon: Package, path: '/products' },
  ];

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      {open && (
        <div className="flex flex-col gap-3 mb-4 animate-in slide-in-from-bottom-4 items-end">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                navigate(action.path);
                setOpen(false);
              }}
              className="group flex items-center justify-end gap-3"
            >
              <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200 text-sm font-medium text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                {action.label}
              </div>
              <div className="w-12 h-12 rounded-full bg-white text-zinc-600 shadow-lg border border-zinc-200 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <action.icon className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      )}
      <Button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 p-0"
      >
        <Plus className={`w-7 h-7 transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`} />
      </Button>
    </div>
  );
}
