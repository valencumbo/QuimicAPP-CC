import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { LogIn, Image as ImageIcon, MessageCircle, BarChart3, Archive, ArrowRight, ShieldCheck, Zap, TestTube } from 'lucide-react';
import ScrollReveal from '@/src/components/ScrollReveal';

import ShinyText from '@/src/components/ShinyText';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30 selection:text-primary">
      <header className="py-4 px-6 md:px-8 flex justify-between items-center bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
        <div className="flex items-center gap-3">
          <ShinyText
            text="QuimicAPP"
            className="font-bold tracking-tight text-3xl"
            speed={2}
            delay={0}
            color="#b5b5b5"
            shineColor="#ffffff"
            spread={120}
            direction="left"
          />
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-zinc-400 hover:text-white hover:bg-muted/50"><LogIn className="w-4 h-4 mr-2" /> Ingresar</Button>
          </Link>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:inline-flex bg-primary text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-orange-500 transition-colors shadow-md">
            Suscribirse
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center max-w-5xl mx-auto flex flex-col items-center relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
          
          <ScrollReveal delay={0.1} yOffset={20} className="inline-flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border text-zinc-300 rounded-full text-xs font-semibold mb-8 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" />
            Software de gestión para la industria química
          </ScrollReveal>
          <ScrollReveal delay={0.2} yOffset={30}>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white mb-8 leading-[1.05] max-w-5xl text-balance">
              Control preciso de tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">fórmulas</span> e inventarios.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3} yOffset={30}>
            <p className="text-xl md:text-2xl text-zinc-400 mb-10 text-balance max-w-3xl leading-relaxed font-medium">
              Calcula el costo exacto de tus elaboraciones, trazabilidad de lotes, registra ingresos y mantené tu rentabilidad bajo control absoluto.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.4} yOffset={30} className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
             <Link to="/login" className="w-full sm:w-auto">
               <Button size="lg" className="w-full h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/20 border-0 bg-primary hover:bg-orange-500 text-white group">
                 Ingresar al Sistema
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
             </Link>
             <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto text-zinc-400 font-medium hover:text-white transition-colors px-4 py-2 mt-2 sm:mt-0">
               Ver planes
             </button>
          </ScrollReveal>
        </section>

        {/* Features / Screenshots */}
        <section className="py-24 bg-card border-y border-border relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          <div className="max-w-6xl mx-auto px-6">
            <ScrollReveal className="text-center mb-16 md:mb-24">
               <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                 Tecnología para laboratorios y elaboradores
               </h2>
               <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto text-balance">Diseñado con la seriedad y precisión que requiere el sector químico, farmacéutico y de manufactura.</p>
            </ScrollReveal>
            
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Feature 1 */}
              <ScrollReveal delay={0.1} className="bg-background rounded-3xl p-8 md:p-12 border border-border flex flex-col items-center text-center group transition-all hover:border-zinc-700 shadow-md">
                 <div className="w-16 h-16 bg-muted/50 rounded-2xl border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <TestTube className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-white">Ingeniería de Fórmulas</h3>
                 <p className="text-zinc-400 leading-relaxed text-balance">Combina materias primas con extrema precisión. Ingresa el rendimiento, densidad, mermas y gastos fijos para obtener el costo exacto por lote y por unidad.</p>
              </ScrollReveal>

              {/* Feature 2 */}
              <ScrollReveal delay={0.2} className="bg-background rounded-3xl p-8 md:p-12 border border-border flex flex-col items-center text-center group transition-all hover:border-zinc-700 shadow-md">
                 <div className="w-16 h-16 bg-muted/50 rounded-2xl border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Archive className="w-8 h-8 text-emerald-500" />
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-white">Trazabilidad de Lotes e Inventario</h3>
                 <p className="text-zinc-400 leading-relaxed text-balance">Maneja números de lote, fechas de vencimiento y códigos QR. Promedio de costos automático al ingresar compras para nunca perder rentabilidad.</p>
              </ScrollReveal>
              
              {/* Feature 3 */}
              <ScrollReveal delay={0.3} yOffset={40} className="bg-background rounded-3xl p-8 md:p-12 border border-border flex flex-col items-center text-center group transition-all hover:border-zinc-700 shadow-md md:col-span-2 md:flex-row md:text-left gap-8">
                 <div className="w-16 h-16 min-w-16 bg-muted/50 rounded-2xl border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                   <BarChart3 className="w-8 h-8 text-indigo-400" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold mb-4 text-white">Reportes y Rentabilidad</h3>
                   <p className="text-zinc-400 leading-relaxed max-w-3xl">Lleva un registro de tus ventas y cotizaciones. Observa tu margen de ganancia real y exporta reportes directamente en PDF para tomar decisiones con datos duros.</p>
                 </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-background relative overflow-hidden" id="pricing">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <ScrollReveal className="mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                Suscripción Simple y Transparente
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto text-balance">Suma a tu laboratorio al grupo de empresas que operan con control total de sus números y trazabilidad.</p>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2} yOffset={50} className="bg-card border border-border rounded-[2rem] p-8 md:p-12 shadow-2xl max-w-lg mx-auto relative overflow-hidden group">
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-orange-400"></div>
               <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform border border-primary/20">
                 <ShieldCheck className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold mb-2 text-white">Licencia Profesional</h3>
               <div className="my-6">
                 <span className="text-6xl font-extrabold tracking-tighter text-white font-mono">$15.000</span>
                 <span className="text-zinc-500 font-medium ml-1">/ mes</span>
               </div>
               <ul className="space-y-4 text-left mb-10 w-fit mx-auto">
                 <li className="flex items-center gap-3 text-zinc-300 font-medium">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">✓</div>
                   Acceso total a recetas y fórmulas ilimitadas
                 </li>
                 <li className="flex items-center gap-3 text-zinc-300 font-medium">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">✓</div>
                   Trazabilidad de lotes e inventario
                 </li>
                 <li className="flex items-center gap-3 text-zinc-300 font-medium">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">✓</div>
                   Cálculo de márgenes y exportación de reportes
                 </li>
               </ul>
               <Button
                 onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                 className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-orange-500 text-white shadow-md"
               >
                 Solicitar alta de cuenta
               </Button>
            </ScrollReveal>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24 bg-card border-t border-border text-white relative overflow-hidden" id="contacto">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
           <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
              <ScrollReveal className="mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                  ¿Listos para optimizar su producción?
                </h2>
                <p className="text-zinc-400 text-lg md:text-xl leading-relaxed text-balance">
                  El acceso es exclusivo mediante suscripción manual. No admitimos registro libre para garantizar soporte y seguridad. Escribinos para darle el alta a tu empresa hoy mismo y empezar a usar la aplicación.
                </p>
              </ScrollReveal>
              
              <ScrollReveal delay={0.2} yOffset={40} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <a href="https://wa.me/XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                   <Button size="lg" className="w-full h-14 px-8 text-base font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20">
                     <MessageCircle className="w-5 h-5 mr-3" />
                     Contactar por WhatsApp
                   </Button>
                 </a>
                 <a href="mailto:tuemail@ejemplo.com" className="w-full sm:w-auto">
                   <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base font-bold rounded-xl border-border text-zinc-300 hover:text-white hover:bg-muted/50 bg-transparent">
                     Enviar un email
                   </Button>
                 </a>
              </ScrollReveal>
           </div>
        </section>
      </main>
      
      <footer className="py-8 text-center text-zinc-600 text-sm bg-background border-t border-border">
         <p>© {new Date().getFullYear()} QuimicAPP. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
