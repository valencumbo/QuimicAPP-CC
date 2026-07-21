const fs = require('fs');
let code = fs.readFileSync('src/pages/Billing.tsx', 'utf8');

code = code.replace(
  "import { SearchableSelect } from '@/components/ui/searchable-select';",
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { SelectSearch } from '@/components/ui/select-search';"
);

code = code.replace(
  "const [items, setItems] = useState<any[]>([{ itemId: '', isRecipe: false, quantity: 1 }]);",
  "const [items, setItems] = useState<any[]>([{ itemId: '', isRecipe: false, quantity: 1 }]);\n  const [searchItem, setSearchItem] = useState('');"
);

code = code.replace(
  `<SearchableSelect 
                    value={currency} 
                    onValueChange={setCurrency}
                    options={[
                      { value: 'ARS', label: 'ARS' },
                      { value: 'USD', label: 'USD' }
                    ]}
                    className="bg-input border-border text-white"
                 />`,
  `<Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-input border-border text-white"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                 </Select>`
);

code = code.replace(
  `<SearchableSelect 
                              value={it.isRecipe ? 'recipe' : 'product'} 
                              onValueChange={v => updateItem(idx, 'isRecipe', v === 'recipe')}
                              options={[
                                { value: 'product', label: 'Prod.' },
                                { value: 'recipe', label: 'Receta' }
                              ]}
                              className="w-28 border-border bg-input text-white text-xs"
                           />`,
  `<Select value={it.isRecipe ? 'recipe' : 'product'} onValueChange={v => updateItem(idx, 'isRecipe', v === 'recipe')}>
                              <SelectTrigger className="w-28 border-border bg-input text-white text-xs">
                                <SelectValue>
                                  {it.isRecipe ? 'Receta' : 'Prod.'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">Prod.</SelectItem>
                                <SelectItem value="recipe">Receta</SelectItem>
                              </SelectContent>
                           </Select>`
);

code = code.replace(
  `<SearchableSelect 
                              value={it.itemId || ''} 
                              onValueChange={v => updateItem(idx, 'itemId', v)}
                              options={it.isRecipe ? 
                                recipes.map((r: any) => ({ value: r.id, label: products.find(p => p.id === r.productId)?.name || 'Receta' })) :
                                products.map((p: any) => ({ value: p.id, label: p.name, sku: p.sku }))
                              }
                              placeholder="Seleccionar..."
                              searchPlaceholder="Buscar..."
                              className="w-full border-border bg-input text-white text-sm"
                           />`,
  `<Select value={it.itemId || undefined} onValueChange={v => updateItem(idx, 'itemId', v)}>
                              <SelectTrigger className="w-full border-border bg-input text-white text-sm">
                                <SelectValue placeholder="Seleccionar...">
                                  {it.itemId 
                                     ? (it.isRecipe 
                                         ? products.find(p => p.id === recipes.find(r => r.id === it.itemId)?.productId)?.name 
                                         : products.find(p => p.id === it.itemId)?.name) 
                                     : ''}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectSearch value={searchItem} onChange={setSearchItem} />
                                {it.isRecipe ? 
                                    recipes.filter((r: any) => (products.find(p => p.id === r.productId)?.name || '').toLowerCase().includes(searchItem.toLowerCase())).map((r: any) => <SelectItem key={r.id} value={r.id}>{products.find(p => p.id === r.productId)?.name || 'Receta'}</SelectItem>) :
                                    products.filter((p: any) => p.name.toLowerCase().includes(searchItem.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchItem.toLowerCase()))).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                }
                              </SelectContent>
                           </Select>`
);

fs.writeFileSync('src/pages/Billing.tsx', code);
