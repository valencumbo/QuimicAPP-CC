const fs = require('fs');

function patchFile(file, searchVar) {
  let code = fs.readFileSync(file, 'utf8');
  let selectRegex = new RegExp(`<Select([^>]*)>`, 'g');
  
  code = code.replace(selectRegex, (match, p1) => {
    // Only patch Selects that actually use a SelectSearch inside them for the given file
    // To be safe, we'll just check if the match is one of the ones we know about.
    if (p1.includes('onValueChange') && !p1.includes('onOpenChange')) {
       // if it's compareA, searchA etc.
       if (p1.includes('compareA')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchA(''); }}>`;
       if (p1.includes('compareB')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchB(''); }}>`;
       if (p1.includes('currentMaterial')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchMaterial(''); }}>`;
       if (p1.includes('formData.productId')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchProduct(''); }}>`;
       if (p1.includes('formData.supplierId')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchSupplier(''); }}>`;
       if (p1.includes('formData.supplier')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchSupplier(''); }}>`;
       if (p1.includes('formData.category')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchCategory(''); }}>`;
       if (p1.includes('formData.unit')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchUnit(''); }}>`;
       if (p1.includes('it.itemId')) return `<Select${p1} onOpenChange={(o) => { if(!o) setSearchItem(''); }}>`;
    }
    return match;
  });
  
  fs.writeFileSync(file, code);
}

patchFile('src/pages/Suppliers.tsx');
patchFile('src/pages/Purchases.tsx');
patchFile('src/pages/Recipes.tsx');
patchFile('src/pages/Lotes.tsx');
patchFile('src/pages/Products.tsx');
patchFile('src/pages/Billing.tsx');
