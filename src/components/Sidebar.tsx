import { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Home, Beaker, ShoppingCart, TestTube, Users, Bell, Settings, Receipt, Truck, Archive, FileSpreadsheet, FlaskConical, LayoutDashboard, Factory, Droplets, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../lib/hooks';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import ShinyText from '@/src/components/ShinyText';

const gooeyStyles = `
.particle,
.point {
  display: block;
  opacity: 0;
  width: 15px;
  height: 15px;
  border-radius: 100%;
  transform-origin: center;
  pointer-events: none;
}

.particle {
  --time: 5s;
  position: absolute;
  top: calc(50% - 7.5px);
  left: calc(50% - 7.5px);
  animation: particle calc(var(--time)) ease 1 -350ms forwards;
  z-index: 0;
}

.point {
  background: var(--color);
  opacity: 1;
  width: 100%;
  height: 100%;
  border-radius: 100%;
  animation: point calc(var(--time)) ease 1 -350ms forwards;
}

@keyframes particle {
  0% {
    transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
    opacity: 1;
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
  }
  70% {
    transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
    opacity: 1;
    animation-timing-function: ease;
  }
  85% {
    transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
    opacity: 1;
  }
  100% {
    transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
    opacity: 1;
  }
}

@keyframes point {
  0% {
    transform: scale(0);
    opacity: 0;
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
  }
  25% {
    transform: scale(calc(var(--scale) * 0.25));
  }
  38% {
    opacity: 1;
  }
  65% {
    transform: scale(var(--scale));
    opacity: 1;
    animation-timing-function: ease;
  }
  85% {
    transform: scale(var(--scale));
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
`;

function SidebarItem({ item, isActive }: { item: any, isActive: boolean }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const hoverBgRef = useRef<HTMLDivElement>(null);
  
  const animationDefaults = { duration: 0.3, ease: 'power2.out' };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  useEffect(() => {
    if (hoverBgRef.current) {
      if (isActive) {
        gsap.to(hoverBgRef.current, { y: '101%', opacity: 0, duration: 0.2 });
      } else {
        gsap.to(hoverBgRef.current, { y: '101%', opacity: 0, duration: 0.2 });
      }
    }
  }, [isActive]);

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current || !hoverBgRef.current || isActive) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap.timeline({ defaults: animationDefaults })
      .set(hoverBgRef.current, { y: edge === 'top' ? '-101%' : '101%', opacity: 1 })
      .to(hoverBgRef.current, { y: '0%' });
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current || !hoverBgRef.current || isActive) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap.timeline({ defaults: animationDefaults })
      .to(hoverBgRef.current, { y: edge === 'top' ? '-101%' : '101%' });
  };

  const makeParticles = () => {
    if (!itemRef.current) return;
    const element = itemRef.current;
    const particleCount = 12;
    const animationTime = 500;
    const timeVariance = 200;
    const particleDistances = [40, 20];
    const particleR = 40;
    const colors = ['#f97316', '#fb923c', '#fdba74', '#ea580c'];

    const noise = (n = 1) => n / 2 - Math.random() * n;
    
    const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
      const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
      return [distance * Math.cos(angle), distance * Math.sin(angle)];
    };
    
    const createParticle = (i: number, t: number, d: number[], r: number) => {
      let rotate = noise(r / 10);
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
      };
    };

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, particleDistances, particleR);
      
      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);
        
        point.classList.add('point');
        point.style.setProperty('--color', p.color);
        
        particle.appendChild(point);
        element.appendChild(particle);
        
        setTimeout(() => {
          try {
            if (element.contains(particle)) {
              element.removeChild(particle);
            }
          } catch {}
        }, t);
      }, i * 15);
    }
  };

  const handleClick = () => {
    if (!isActive) {
      makeParticles();
    }
  };

  return (
    <div 
      ref={itemRef}
      className="relative overflow-hidden rounded-lg group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div 
        ref={hoverBgRef}
        className="absolute inset-0 bg-zinc-800/60 pointer-events-none translate-y-[101%]"
      />
      <Link
        to={item.path}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors z-10",
          isActive 
            ? "bg-zinc-800/80 text-primary shadow-sm border border-zinc-700/50" 
            : "text-zinc-400 group-hover:text-zinc-200 border border-transparent"
        )}
      >
        <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")} />
        {item.name}
      </Link>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  
  const navGroups = [
    {
      title: 'Principal',
      items: [
        { name: 'Panel de Control', path: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Productos', path: '/products', icon: Beaker },
        { name: 'Lotes y Venc.', path: '/lotes', icon: Archive },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { name: 'Fórmulas / Recetas', path: '/recipes', icon: FlaskConical },
        { name: 'Compras', path: '/purchases', icon: ShoppingCart },
        { name: 'Ped. Sugeridos', path: '/order-generator', icon: Truck },
      ]
    },
    {
      title: 'Administración',
      items: [
        { name: 'Facturación / Ventas', path: '/billing', icon: Receipt },
        { name: 'Proveedores', path: '/suppliers', icon: Factory },
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { name: 'Reportes y Exp.', path: '/reports', icon: FileSpreadsheet },
        { name: 'Recordatorios', path: '/reminders', icon: Bell },
        { name: 'Auditoría', path: '/audit', icon: ShieldAlert },
        { name: 'Configuración', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col border-r border-sidebar-border shadow-xl z-20">
      <style>{gooeyStyles}</style>
      <div className="px-6 py-5 flex items-center justify-center">
        <ShinyText
          text="QuimicAPP"
          className="font-bold tracking-tight text-xl text-center"
          speed={2}
          delay={0}
          color="#b5b5b5"
          shineColor="#ffffff"
          spread={120}
          direction="left"
        />
      </div>
      
      <nav className="flex-1 px-4 overflow-y-auto space-y-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              {group.title}
            </h4>
            {group.items.map((item) => (
              <SidebarItem key={item.path} item={item} isActive={location.pathname === item.path} />
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3">
          <strong className="block text-xs text-zinc-200 truncate">{user?.email}</strong>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[10px] text-zinc-400 truncate">Operador Conectado</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 h-8 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            onClick={() => signOut(auth)}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  );
}
