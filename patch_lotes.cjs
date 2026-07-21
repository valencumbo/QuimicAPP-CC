const fs = require('fs');
let code = fs.readFileSync('src/pages/Lotes.tsx', 'utf8');

code = code.replace(
  "import { SearchableSelect } from '@/components/ui/searchable-select';",
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { SelectSearch } from '@/components/ui/select-search';"
);

code = code.replace(
  "const [formData, setFormData] = useState({",
  "const [searchProduct, setSearchProduct] = useState('');\n  const [searchSupplier, setSearchSupplier] = useState('');\n  const [formData, setFormData] = useState({"
);

code = code.replace(
  `<SearchableSelect 
                  value={formData.productId} 
                  onValueChange={v => setFormData({...formData, productId: v})}
                  options={products.map(p => ({ value: p.id, label: \`\${p.name} \${p.sku ? \`(\${p.sku})\` : ''}\`, sku: p.sku }))}
                  placeholder="Seleccionar producto..."
                  searchPlaceholder="Buscar producto..."
                  className="bg-input border-border"
                />`,
  `<Select required value={formData.productId} onValueChange={v => setFormData({...formData, productId: v})}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Seleccionar producto...">
                      {products.find(p => p.id === formData.productId)?.name || 'Seleccionar producto...'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectSearch value={searchProduct} onChange={setSearchProduct} placeholder="Buscar producto..." />
                    {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()))).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? \`(\${p.sku})\` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>`
);

code = code.replace(
  `<SearchableSelect 
                    value={formData.currency} 
                    onValueChange={v => setFormData({...formData, currency: v})}
                    options={[
                      { value: 'ARS', label: 'ARS' },
                      { value: 'USD', label: 'USD' }
                    ]}
                    className="w-[100px] bg-input border-border"
                  />`,
  `<Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                    <SelectTrigger className="w-[100px] bg-input border-border">
                      <SelectValue placeholder="ARS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>`
);

code = code.replace(
  `<SearchableSelect 
                  value={formData.supplierId} 
                  onValueChange={v => setFormData({...formData, supplierId: v})}
                  options={[
                    { value: 'none', label: 'Sin proveedor especificado' },
                    ...suppliers.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  placeholder="Sin proveedor especificado"
                  searchPlaceholder="Buscar proveedor..."
                  className="bg-input border-border"
                />`,
  `<Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v})}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Sin proveedor especificado">
                      {formData.supplierId === 'none' ? 'Sin proveedor especificado' : suppliers.find(s => s.id === formData.supplierId)?.name || 'Sin proveedor especificado'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectSearch value={searchSupplier} onChange={setSearchSupplier} placeholder="Buscar proveedor..." />
                    <SelectItem value="none">Sin proveedor especificado</SelectItem>
                    {suppliers.filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase())).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>`
);

fs.writeFileSync('src/pages/Lotes.tsx', code);
