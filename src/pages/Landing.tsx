import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { LogIn, Image as ImageIcon, MessageCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="py-4 px-6 md:px-8 flex justify-between items-center border-b bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg">C</div>
          <span className="font-semibold text-zinc-900 tracking-tight">Costeo Comercial</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" size="sm" className="font-semibold px-4"><LogIn className="w-4 h-4 mr-2" /> Ingresar</Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 text-center max-w-5xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold mb-8 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            La herramienta que necesitabas
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-8 leading-[1.1] max-w-4xl">
            Controlá tus <span className="text-amber-600">fórmulas</span>, inventario y estructura de costos en un solo lugar.
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 mb-10 text-balance max-w-3xl leading-relaxed">
            Calcula el costo exacto de tus elaboraciones, registra ingresos de compras, gestiona a tus proveedores y mantené tu rentabilidad siempre bajo control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
             <Link to="/login">
               <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-md border border-zinc-800">
                 Ingresar a mi cuenta
               </Button>
             </Link>
             <a href="#contacto" className="text-zinc-600 font-medium hover:text-zinc-900 transition-colors px-4 py-2">
               Quiero suscribirme
             </a>
          </div>
        </section>

        {/* Features / Screenshots (Placeholders) */}
        <section className="py-24 bg-white border-y">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas para tu emprendimiento</h2>
               <p className="text-zinc-500 max-w-2xl mx-auto">Nuestra app está diseñada específicamente para solucionar los problemas reales de quienes elaboran su propia mercadería.</p>
            </div>
            
            <div className="space-y-24">
              {/* Feature 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 relative aspect-video bg-zinc-100 rounded-2xl border flex items-center justify-center overflow-hidden shadow-sm">
                   {/* ACA SE SUBIRA LA IMAGEN LUEGO */}
                   <div className="text-center text-zinc-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <span className="text-sm font-medium">Captura: Armador de Fórmulas</span>
                   </div>
                </div>
                <div className="order-1 md:order-2 space-y-4">
                   <h3 className="text-2xl font-bold">Armador de Fórmulas Dinámico</h3>
                   <p className="text-zinc-600 text-lg leading-relaxed">Olvidate de las planillas de excel desactualizadas. Combina tus materias primas en una sola receta, ingresa el rendimiento y los gastos extra (luz, gas, labor) y obtén el costo exacto por unidad al instante.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                   <h3 className="text-2xl font-bold">Inventario e Historial de Compras</h3>
                   <p className="text-zinc-600 text-lg leading-relaxed">Cada vez que compras insumos, el sistema promedia inteligentemente los costos y actualiza tu stock. Nunca más volverás a dudar sobre si los precios de tus productos quedaron desfasados.</p>
                </div>
                <div className="relative aspect-[4/3] bg-zinc-100 rounded-2xl border flex items-center justify-center overflow-hidden shadow-sm">
                   {/* ACA SE SUBIRA LA IMAGEN LUEGO */}
                   <div className="text-center text-zinc-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <span className="text-sm font-medium">Captura: Ingreso de compras</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-zinc-50" id="pricing">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Suscripción Simple y Transparente</h2>
            <p className="text-zinc-600 text-lg mb-12 max-w-2xl mx-auto">Unite al grupo exclusivo de emprendedores que ya tienen el control absoluto de sus números.</p>
            
            <div className="bg-white border rounded-3xl p-8 md:p-12 shadow-xl max-w-lg mx-auto relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-2 bg-amber-500"></div>
               <h3 className="text-2xl font-bold mb-2">Acceso a Costeo Comercial</h3>
               <div className="my-6">
                 <span className="text-5xl font-extrabold">$15.000</span>
                 <span className="text-zinc-500 font-medium"> / mes</span>
               </div>
               <ul className="space-y-4 text-left mb-8">
                 <li className="flex items-center gap-3 text-zinc-700">
                   <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
                   Acceso total a recetas y fórmulas ilimitadas
                 </li>
                 <li className="flex items-center gap-3 text-zinc-700">
                   <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
                   Gestión de stock e inventario dinámico
                 </li>
                 <li className="flex items-center gap-3 text-zinc-700">
                   <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
                   Cálculo de márgenes y precios de venta sugeridos
                 </li>
               </ul>
               <a href="#contacto">
                 <Button className="w-full h-14 text-base font-bold text-lg rounded-xl">Solicitar mi cuenta</Button>
               </a>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24 bg-zinc-950 text-white" id="contacto">
           <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Querés empezar a ordenar tus costos?</h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed text-balance">
                El acceso es exclusivo mediante suscripción manual. No admitimos registro libre para garantizar soporte y seguridad. Escribinos para darle el alta a tu cuenta hoy mismo y empezar a usar la aplicación.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <a href="https://wa.me/XXXXXXXXXX" target="_blank" rel="noopener noreferrer">
                   <Button size="lg" className="h-14 px-8 text-base font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white border-0">
                     <MessageCircle className="w-5 h-5 mr-3" />
                     Contactar por WhatsApp
                   </Button>
                 </a>
                 <a href="mailto:tuemail@ejemplo.com">
                   <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold rounded-xl border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                     Enviar un email
                   </Button>
                 </a>
              </div>
           </div>
        </section>
      </main>
      
      <footer className="py-8 text-center text-zinc-500 text-sm bg-zinc-950">
         <p>© {new Date().getFullYear()} Costeo Comercial. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
