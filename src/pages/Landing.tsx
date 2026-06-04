import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { LogIn, Image as ImageIcon, MessageCircle, BarChart3, Archive, ArrowRight, ShieldCheck, Zap, TestTube } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="py-4 px-6 md:px-8 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-200/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg shadow-sm shadow-amber-500/20">C</div>
          <span className="font-semibold text-zinc-900 tracking-tight text-lg">Costeo Comercial</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-zinc-600 hover:text-zinc-900"><LogIn className="w-4 h-4 mr-2" /> Ingresar</Button>
          </Link>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:inline-flex bg-zinc-950 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors">
            Suscribirse
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center max-w-5xl mx-auto flex flex-col items-center relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/50 via-zinc-50 to-zinc-50 pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-zinc-600 rounded-full text-xs font-semibold mb-8 border shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
            La herramienta definitiva para elaboradores
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 mb-8 leading-[1.1] max-w-4xl text-balance">
            Controlá tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">fórmulas</span>, inventario y costos.
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 mb-10 text-balance max-w-3xl leading-relaxed font-medium">
            Calcula el costo exacto de tus elaboraciones, registra ingresos de compras, gestiona a tus proveedores y mantené tu rentabilidad siempre bajo control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
             <Link to="/login" className="w-full sm:w-auto">
               <Button size="lg" className="w-full h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-zinc-900/10 border border-zinc-800 group">
                 Ingresar a mi cuenta
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
             </Link>
             <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto text-zinc-600 font-medium hover:text-zinc-900 transition-colors px-4 py-2 mt-2 sm:mt-0">
               Ver planes
             </button>
          </div>
        </section>

        {/* Features / Screenshots */}
        <section className="py-24 bg-white border-y relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent"></div>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 md:mb-24">
               <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Todo lo que necesitas para tu emprendimiento</h2>
               <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto text-balance">Nuestra app está diseñada específicamente para solucionar los problemas reales de quienes elaboran su propia mercadería.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Feature 1 */}
              <div className="bg-zinc-50 rounded-3xl p-8 md:p-12 border flex flex-col items-center text-center group transition-all hover:bg-zinc-100/50">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <TestTube className="w-8 h-8 text-amber-500" />
                 </div>
                 <h3 className="text-2xl font-bold mb-4">Armador de Fórmulas Dinámico</h3>
                 <p className="text-zinc-600 leading-relaxed text-balance">Olvidate de las planillas de excel desactualizadas. Combina tus materias primas en una sola receta, ingresa el rendimiento y los gastos extra (luz, gas, labor) y obtén el costo exacto por unidad al instante.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-zinc-50 rounded-3xl p-8 md:p-12 border flex flex-col items-center text-center group transition-all hover:bg-zinc-100/50">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Archive className="w-8 h-8 text-emerald-500" />
                 </div>
                 <h3 className="text-2xl font-bold mb-4">Inventario e Ingreso de Compras</h3>
                 <p className="text-zinc-600 leading-relaxed text-balance">Cada vez que compras insumos, el sistema promedia inteligentemente los costos y actualiza tu stock. Nunca más volverás a dudar sobre si los precios de tus productos quedaron desfasados.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-zinc-50 rounded-3xl p-8 md:p-12 border flex flex-col items-center text-center group transition-all hover:bg-zinc-100/50 md:col-span-2 md:flex-row md:text-left gap-8">
                 <div className="w-16 h-16 min-w-16 bg-white rounded-2xl shadow-sm border flex items-center justify-center group-hover:scale-110 transition-transform">
                   <BarChart3 className="w-8 h-8 text-indigo-500" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold mb-4">Facturación y Rentabilidad</h3>
                   <p className="text-zinc-600 leading-relaxed max-w-3xl">Lleva un registro de todas tus ventas y cotizaciones. Observa tu margen de ganancia real y exporta directamente tus cotizaciones en PDF para enviárselas a tus clientes al instante.</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-zinc-50 relative" id="pricing">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Suscripción Simple y Transparente</h2>
            <p className="text-zinc-500 text-lg mb-12 max-w-2xl mx-auto text-balance">Unite al grupo exclusivo de emprendedores que ya tienen el control absoluto de sus números y simplifican su operación.</p>
            
            <div className="bg-white border rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-zinc-200/50 max-w-lg mx-auto relative overflow-hidden group">
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
               <div className="flex items-center justify-center w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                 <ShieldCheck className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold mb-2">Acceso a Costeo Comercial</h3>
               <div className="my-6">
                 <span className="text-6xl font-extrabold tracking-tighter text-zinc-900">$15.000</span>
                 <span className="text-zinc-500 font-medium ml-1">/ mes</span>
               </div>
               <ul className="space-y-4 text-left mb-10 w-fit mx-auto">
                 <li className="flex items-center gap-3 text-zinc-700 font-medium">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">✓</div>
                   Acceso total a recetas y fórmulas ilimitadas
                 </li>
                 <li className="flex items-center gap-3 text-zinc-700 font-medium">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">✓</div>
                   Gestión de stock, insumos y proveedores
                 </li>
                 <li className="flex items-center gap-3 text-zinc-700 font-medium">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">✓</div>
                   Cálculo de márgenes, tickets y ventas en PDF
                 </li>
               </ul>
               <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })} className="w-full">
                 <Button className="w-full h-14 text-base font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md">Solicitar mi cuenta</Button>
               </button>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24 bg-zinc-950 text-white relative overflow-hidden" id="contacto">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>
           <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">¿Querés empezar a ordenar tus costos?</h2>
              <p className="text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed text-balance">
                El acceso es exclusivo mediante suscripción manual. No admitimos registro libre para garantizar soporte y seguridad. Escribinos para darle el alta a tu cuenta hoy mismo y empezar a usar la aplicación.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <a href="https://wa.me/XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                   <Button size="lg" className="w-full h-14 px-8 text-base font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20">
                     <MessageCircle className="w-5 h-5 mr-3" />
                     Contactar por WhatsApp
                   </Button>
                 </a>
                 <a href="mailto:tuemail@ejemplo.com" className="w-full sm:w-auto">
                   <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base font-bold rounded-xl border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 bg-transparent">
                     Enviar un email
                   </Button>
                 </a>
              </div>
           </div>
        </section>
      </main>
      
      <footer className="py-8 text-center text-zinc-500 text-sm bg-zinc-950 border-t border-zinc-900">
         <p>© {new Date().getFullYear()} Costeo Comercial. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
