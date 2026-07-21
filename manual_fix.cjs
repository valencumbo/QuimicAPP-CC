const fs = require('fs');

let purchases = fs.readFileSync('src/pages/Purchases.tsx', 'utf8');
purchases = purchases.replace(
  `onValueChange={v = onOpenChange={(o) => { if(!o) setSearchProduct(''); }}> {`,
  `onValueChange={v => {`
);
purchases = purchases.replace(
  `<Select value={formData.productId} onValueChange={v => {`,
  `<Select value={formData.productId} onValueChange={v => {` // just checking
);
purchases = purchases.replace(
  `<Select value={formData.productId} onValueChange={v => {`,
  `<Select value={formData.productId} onOpenChange={(o) => { if(!o) setSearchProduct(''); }} onValueChange={v => {`
);
fs.writeFileSync('src/pages/Purchases.tsx', purchases);


let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');

products = products.replace(
  `onValueChange={val = onOpenChange={(o) => { if(!o) setSearchUnit(''); }}> {`,
  `onValueChange={val => {`
);
products = products.replace(
  `<Select value={allUnits.includes(formData.unit) ? formData.unit : (formData.unit ? 'otra' : 'Unidades')} onValueChange={val => {`,
  `<Select value={allUnits.includes(formData.unit) ? formData.unit : (formData.unit ? 'otra' : 'Unidades')} onOpenChange={(o) => { if(!o) setSearchUnit(''); }} onValueChange={val => {`
);

products = products.replace(
  `onValueChange={val = onOpenChange={(o) => { if(!o) setSearchSupplier(''); }}> setFormData({...formData, supplier: val})}>`,
  `onOpenChange={(o) => { if(!o) setSearchSupplier(''); }} onValueChange={val => setFormData({...formData, supplier: val})}>`
);

products = products.replace(
  `onValueChange={val = onOpenChange={(o) => { if(!o) setSearchCategory(''); }}> {`,
  `onValueChange={val => {`
);
products = products.replace(
  `<Select value={formData.category === 'Sin categoría' ? 'Sin categoría' : (allCategories.includes(formData.category) ? formData.category : (formData.category ? 'otra' : 'Sin categoría'))} onValueChange={val => {`,
  `<Select value={formData.category === 'Sin categoría' ? 'Sin categoría' : (allCategories.includes(formData.category) ? formData.category : (formData.category ? 'otra' : 'Sin categoría'))} onOpenChange={(o) => { if(!o) setSearchCategory(''); }} onValueChange={val => {`
);

fs.writeFileSync('src/pages/Products.tsx', products);

