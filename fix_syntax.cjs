const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Fix the broken arrow functions. 
  // It looks like: `onValueChange={v = onOpenChange={(o) => { if(!o) setSearchXYZ(''); }}> setFormData({...formData, prop: v})}>`
  // Actually, we can just find `onValueChange={v = onOpenChange={` and rewrite.
  
  // Let's use regex to fix: `v = onOpenChange={(o) => { if(!o) (.*?); }}> (.*?)}>`
  // to `v => $2} onOpenChange={(o) => { if(!o) $1; }}>`
  
  code = code.replace(/v = onOpenChange=\{\(o\) => \{ if\(!o\) (.*?); \}\}> (.*?)\}>/g, 
    "v => $2} onOpenChange={(o) => { if(!o) $1; }}>");

  // There is another one in Billing: `onValueChange={v = onOpenChange={(o) => { if(!o) setSearchItem(''); }}> updateItem(idx, 'itemId', v)}>`
  
  fs.writeFileSync(file, code);
}

['src/pages/Lotes.tsx', 'src/pages/Products.tsx', 'src/pages/Purchases.tsx', 'src/pages/Recipes.tsx', 'src/pages/Suppliers.tsx', 'src/pages/Billing.tsx'].forEach(fixFile);
