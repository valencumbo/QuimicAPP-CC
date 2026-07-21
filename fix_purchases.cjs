const fs = require('fs');

let purchases = fs.readFileSync('src/pages/Purchases.tsx', 'utf8');
purchases = purchases.replace(
  `<Input type="text" value={invoiceSupplier} onChange={e => setInvoiceSupplier(e.target.value)} placeholder="Opcional" className="bg-input border-border" />`,
  `<Input type="text" list="suppliers-list" value={invoiceSupplier} onChange={e => setInvoiceSupplier(e.target.value)} placeholder="Opcional" className="bg-input border-border" />
                 <datalist id="suppliers-list">
                    {suppliers.map(s => <option key={s.id} value={s.name} />)}
                 </datalist>`
);
fs.writeFileSync('src/pages/Purchases.tsx', purchases);
