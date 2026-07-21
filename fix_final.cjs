const fs = require('fs');

let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');
products = products.replace(
  `}} onOpenChange={(o) => { if(!o) setSearchUnit(''); }}>\n                    <SelectTrigger className="bg-input">`,
  `}}>\n                    <SelectTrigger className="bg-input">`
);
fs.writeFileSync('src/pages/Products.tsx', products);

let billing = fs.readFileSync('src/pages/Billing.tsx', 'utf8');
billing = billing.replace(
  `const [items, setItems] = useState<any[]>([]);`,
  `const [items, setItems] = useState<any[]>([]);\n  const [searchItem, setSearchItem] = useState('');`
);
fs.writeFileSync('src/pages/Billing.tsx', billing);

