const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const targetContent = `            <ScrollReveal delay={0.2} yOffset={50} className="bg-card border border-border rounded-[2rem] p-8 md:p-12 shadow-2xl max-w-lg mx-auto relative overflow-hidden group">
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-orange-400"></div>
               <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform border border-primary/20">
                 <ShieldCheck className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold mb-2 text-white">Licencia Profesional</h3>
               <div className="my-6">
                 <span className="text-6xl font-extrabold tracking-tighter text-white font-mono">$20.000</span>
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
            </ScrollReveal>`;

const replacement = `            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <ScrollReveal delay={0.2} yOffset={50} className="bg-card border border-border rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group flex flex-col">
                 <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-2xl mb-6 group-hover:scale-110 transition-transform border border-primary/20">
                   <ShieldCheck className="w-7 h-7" />
                 </div>
                 <h3 className="text-2xl font-bold mb-2 text-white text-left">Plan Mensual</h3>
                 <p className="text-left text-zinc-400 mb-6 font-medium text-sm">Prueba de 7 días gratuita incluida</p>
                 <div className="mb-8 text-left">
                   <span className="text-5xl font-extrabold tracking-tighter text-white font-mono">$25.000</span>
                   <span className="text-zinc-500 font-medium ml-1">/ mes</span>
                 </div>
                 <ul className="space-y-4 text-left mb-10 flex-1">
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
                     Cálculo de márgenes y reportes
                   </li>
                 </ul>
                 <Button
                   onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                   variant="outline"
                   className="w-full h-14 text-base font-bold rounded-xl border-zinc-700 hover:bg-zinc-800 text-white"
                 >
                   Comenzar prueba gratis
                 </Button>
              </ScrollReveal>

              <ScrollReveal delay={0.3} yOffset={50} className="bg-card border border-primary rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group flex flex-col">
                 <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-orange-400"></div>
                 <div className="absolute top-6 right-6 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                   Más popular
                 </div>
                 <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-2xl mb-6 group-hover:scale-110 transition-transform border border-primary/20">
                   <ShieldCheck className="w-7 h-7" />
                 </div>
                 <h3 className="text-2xl font-bold mb-2 text-white text-left">Plan Semestral</h3>
                 <p className="text-left text-zinc-400 mb-6 font-medium text-sm">Prueba de 7 días gratuita incluida</p>
                 <div className="mb-2 text-left flex items-end gap-2">
                   <span className="text-5xl font-extrabold tracking-tighter text-white font-mono">$20.000</span>
                   <span className="text-zinc-500 font-medium pb-1">/ mes</span>
                 </div>
                 <p className="text-left text-primary/80 mb-6 font-semibold text-sm">Facturado $120.000 cada 6 meses</p>
                 <ul className="space-y-4 text-left mb-10 flex-1">
                   <li className="flex items-center gap-3 text-zinc-300 font-medium">
                     <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">✓</div>
                     Todo lo del plan mensual
                   </li>
                   <li className="flex items-center gap-3 text-zinc-300 font-medium">
                     <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">✓</div>
                     Ahorro de $30.000 por semestre
                   </li>
                   <li className="flex items-center gap-3 text-zinc-300 font-medium">
                     <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">✓</div>
                     Soporte prioritario
                   </li>
                 </ul>
                 <Button
                   onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                   className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-orange-500 text-white shadow-md"
                 >
                   Comenzar prueba gratis
                 </Button>
              </ScrollReveal>
            </div>`;

if (code.includes('max-w-lg mx-auto relative overflow-hidden group">')) {
  code = code.replace(targetContent, replacement);
  fs.writeFileSync('src/pages/Landing.tsx', code);
  console.log("Success");
} else {
  console.log("Could not find target content");
}
