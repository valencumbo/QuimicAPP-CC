import { Link, useLocation } from 'react-router';
import { Home, Package, ShoppingCart, TestTube, Users, Bell, Settings, Receipt, Truck, Archive, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Panel', path: '/dashboard', icon: Home },
    { name: 'Productos', path: '/products', icon: Package },
    { name: 'Compras', path: '/purchases', icon: ShoppingCart },
    { name: 'Lotes y Venc.', path: '/lotes', icon: Archive },
    { name: 'Recetas', path: '/recipes', icon: TestTube },
    { name: 'Fact. y Ventas', path: '/billing', icon: Receipt },
    { name: 'Proveedores', path: '/suppliers', icon: Users },
    { name: 'Ped. Sugeridos', path: '/order-generator', icon: Truck },
    { name: 'Reportes y Exp.', path: '/reports', icon: FileSpreadsheet },
    { name: 'Recordatorios', path: '/reminders', icon: Bell },
    { name: 'Configuración', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-100 flex-shrink-0 hidden md:flex flex-col border-r border-zinc-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg">
          C
        </div>
        <div>
          <strong className="block text-sm font-semibold tracking-tight">Costeo Comercial</strong>
          <span className="block text-xs text-zinc-500">Compras y recetas</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive 
                  ? "bg-zinc-800 text-zinc-50 font-medium" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-amber-500" : "text-zinc-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800/50">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3">
          <strong className="block text-xs text-zinc-300 truncate">{user?.email}</strong>
          <span className="block text-[10px] text-zinc-500 mt-0.5 truncate">Conectado</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 h-7 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => signOut(auth)}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  );
}
