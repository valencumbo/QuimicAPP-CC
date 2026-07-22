const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

// The block to extract
const dashboardBlockRegex = /<ScrollReveal delay=\{0\.4\} yOffset=\{60\} className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative group mt-16">\s*<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"><\/div>\s*\{\/\* Sugerencia: Captura del Dashboard principal o de la sección Fórmulas \*\/\}\s*<div className="aspect-\[16\/9\] bg-muted\/30 flex items-center justify-center relative">\s*<img src="\/captura-dashboard\.png" alt="Dashboard Principal" className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-700 cursor-pointer" onClick=\{\(\) => setSelectedImage\('\/captura-dashboard\.png'\)\} \/>\s*<\/div>\s*<\/ScrollReveal>/;

const dashboardBlockMatch = code.match(dashboardBlockRegex);
if (dashboardBlockMatch) {
  let dashboardBlock = dashboardBlockMatch[0];
  
  // Update image name
  dashboardBlock = dashboardBlock.replace(/\/captura-dashboard\.png/g, '/captura-dashboard-1.png');

  // Remove it from current location
  code = code.replace(dashboardBlockMatch[0], '');

  // Add it after the features grid
  code = code.replace(
    /(\s*)<\/div>\s*<\/div>\s*<\/section>\s*\{\/\* Pricing \*\/\}/,
    `\n            ${dashboardBlock}$1</div>\n          </div>\n        </section>\n        {/* Pricing */}`
  );

  // Update modal reference
  code = code.replace(/\/captura-dashboard\.png/g, '/captura-dashboard-1.png');

  fs.writeFileSync('src/pages/Landing.tsx', code);
  console.log("Updated successfully");
} else {
  console.log("Could not find dashboard block");
}
