const fs = require('fs');

let landing = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

// Add Hero image placeholder
landing = landing.replace(
  `<div className="flex flex-col sm:flex-row items-center justify-center gap-4">`,
  `<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">`
);

landing = landing.replace(
  `</ScrollReveal>\n          </div>\n        </section>`,
  `</ScrollReveal>
            <ScrollReveal delay={0.4} yOffset={60} className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative group mt-16">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
              {/* Sugerencia: Captura del Dashboard principal o de la sección Fórmulas */}
              <div className="aspect-[16/9] bg-muted/30 flex items-center justify-center relative">
                 <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" alt="Dashboard Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                 <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-white font-medium text-sm flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       [Reemplazar con captura del Dashboard]
                    </div>
                 </div>
              </div>
            </ScrollReveal>
          </div>
        </section>`
);

// Add images to features
landing = landing.replace(
  `{/* Feature 1 */}`,
  `{/* Feature 1 */}
              <ScrollReveal delay={0.1} className="bg-background rounded-3xl overflow-hidden border border-border flex flex-col group transition-all hover:border-zinc-700 shadow-md">
                 <div className="h-48 bg-muted/30 relative border-b border-border">
                    {/* Sugerencia: Captura de la creación de una Fórmula */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-xs text-zinc-500 font-medium">[Captura: Creador de Fórmulas]</span>
                    </div>
                 </div>
                 <div className="p-8 md:p-10 flex flex-col items-center text-center flex-1">`
);
landing = landing.replace(
  `<ScrollReveal delay={0.1} className="bg-background rounded-3xl p-8 md:p-12 border border-border flex flex-col items-center text-center group transition-all hover:border-zinc-700 shadow-md">`,
  ``
);
landing = landing.replace(
  `<p className="text-zinc-400 leading-relaxed text-balance">Combina materias primas con extrema precisión. Ingresa el rendimiento, densidad, mermas y gastos fijos para obtener el costo exacto por lote y por unidad.</p>\n              </ScrollReveal>`,
  `<p className="text-zinc-400 leading-relaxed text-balance">Combina materias primas con extrema precisión. Ingresa el rendimiento, densidad, mermas y gastos fijos para obtener el costo exacto por lote y por unidad.</p>\n                 </div>\n              </ScrollReveal>`
);


landing = landing.replace(
  `{/* Feature 2 */}`,
  `{/* Feature 2 */}
              <ScrollReveal delay={0.2} className="bg-background rounded-3xl overflow-hidden border border-border flex flex-col group transition-all hover:border-zinc-700 shadow-md">
                 <div className="h-48 bg-muted/30 relative border-b border-border">
                    {/* Sugerencia: Captura de la sección de Lotes o Compras */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-xs text-zinc-500 font-medium">[Captura: Inventario / Lotes]</span>
                    </div>
                 </div>
                 <div className="p-8 md:p-10 flex flex-col items-center text-center flex-1">`
);
landing = landing.replace(
  `<ScrollReveal delay={0.2} className="bg-background rounded-3xl p-8 md:p-12 border border-border flex flex-col items-center text-center group transition-all hover:border-zinc-700 shadow-md">`,
  ``
);
landing = landing.replace(
  `<p className="text-zinc-400 leading-relaxed text-balance">Maneja números de lote, fechas de vencimiento y códigos QR. Promedio de costos automático al ingresar compras para nunca perder rentabilidad.</p>\n              </ScrollReveal>`,
  `<p className="text-zinc-400 leading-relaxed text-balance">Maneja números de lote, fechas de vencimiento y códigos QR. Promedio de costos automático al ingresar compras para nunca perder rentabilidad.</p>\n                 </div>\n              </ScrollReveal>`
);


fs.writeFileSync('src/pages/Landing.tsx', landing);

