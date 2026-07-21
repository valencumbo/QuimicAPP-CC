const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(/val = onOpenChange=\{\(o\) => \{ if\(!o\) (.*?); \}\}> \{(.*?)\}>/gs, 
    "val => {$2} onOpenChange={(o) => { if(!o) $1; }}>");

  code = code.replace(/val = onOpenChange=\{\(o\) => \{ if\(!o\) (.*?); \}\}> (.*?)\}>/gs, 
    "val => $2} onOpenChange={(o) => { if(!o) $1; }}>");

  fs.writeFileSync(file, code);
}

['src/pages/Lotes.tsx', 'src/pages/Products.tsx', 'src/pages/Purchases.tsx', 'src/pages/Recipes.tsx', 'src/pages/Suppliers.tsx', 'src/pages/Billing.tsx'].forEach(fixFile);
