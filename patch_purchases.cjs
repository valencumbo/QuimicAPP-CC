const fs = require('fs');
let code = fs.readFileSync('src/pages/Purchases.tsx', 'utf8');

code = code.replace(
  "import { SearchableSelect } from '@/components/ui/searchable-select';",
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { SelectSearch } from '@/components/ui/select-search';"
);

// We need to add state for the searches. Let's find where to add it.
// Purchases.tsx has:
// const [formData, setFormData] = useState({ productId: '', quantity: '', unitCost: '', currency: 'ARS', receiptNumber: '', notes: '' });
code = code.replace(
  "const [formData, setFormData] = useState({",
  "const [searchProduct, setSearchProduct] = useState('');\n  const [formData, setFormData] = useState({"
);

code = code.replace(
  `<SearchableSelect 
                    value={formData.productId} 
                    onValueChange={v => {
                      const prod = products.find(p => p.id === v);
                      setFormData({...formData, productId: v, currency: prod?.currency || settings?.currency || 'ARS'})
                    }}
                    options={products.map(p => ({ value: p.id, label: \`\${p.name} (\${p.unit})\`, sku: p.sku }))}
                    placeholder="Selecciona un producto..."
                    searchPlaceholder="Buscar producto..."
                    className="bg-input border-border text-white"
                 />`,
  `<Select value={formData.productId} onValueChange={v => {
                    const prod = products.find(p => p.id === v);
                    setFormData({...formData, productId: v, currency: prod?.currency || settings?.currency || 'ARS'})
                 }}>
                    <SelectTrigger className="bg-input border-border text-white">
                      <SelectValue placeholder="Selecciona un producto...">
                         {products.find(p => p.id === formData.productId) ? \`\${products.find(p => p.id === formData.productId)?.name} (\${products.find(p => p.id === formData.productId)?.unit})\` : 'Selecciona un producto...'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectSearch value={searchProduct} onChange={setSearchProduct} placeholder="Buscar producto..." />
                      {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()))).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>`
);

code = code.replace(
  `<SearchableSelect 
                      value={selectedCurrency} 
                      onValueChange={v => setFormData({...formData, currency: v})}
                      options={[
                        { value: 'ARS', label: 'ARS' },
                        { value: 'USD', label: 'USD' },
                        ...(settings?.currency !== 'ARS' && settings?.currency !== 'USD' ? [{ value: settings?.currency || 'ARS', label: settings?.currency || 'ARS' }] : [])
                      ]}
                      className="bg-input border-border text-white"
                   />`,
  `<Select value={selectedCurrency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger className="bg-input border-border text-white"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        {settings?.currency !== 'ARS' && settings?.currency !== 'USD' && (
                          <SelectItem value={settings?.currency || 'ARS'}>{settings?.currency}</SelectItem>
                        )}
                      </SelectContent>
                   </Select>`
);

fs.writeFileSync('src/pages/Purchases.tsx', code);
