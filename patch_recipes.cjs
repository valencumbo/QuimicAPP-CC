const fs = require('fs');
let code = fs.readFileSync('src/pages/Recipes.tsx', 'utf8');

code = code.replace(
  "import { SearchableSelect } from '@/components/ui/searchable-select';",
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { SelectSearch } from '@/components/ui/select-search';"
);

code = code.replace(
  "const [currentMaterial, setCurrentMaterial] = useState('');",
  "const [currentMaterial, setCurrentMaterial] = useState('');\n  const [searchMaterial, setSearchMaterial] = useState('');"
);

code = code.replace(
  `<SearchableSelect 
                    value={currentMaterial} 
                    onValueChange={setCurrentMaterial}
                    options={materials.map(p => ({ value: p.id, label: \`\${p.name} (\${p.unit})\`, sku: p.sku }))}
                    placeholder="Seleccionar insumo"
                    searchPlaceholder="Buscar insumo..."
                    className="bg-input border-border"
                  />`,
  `<Select value={currentMaterial} onValueChange={setCurrentMaterial}>
                    <SelectTrigger className="bg-input border-border">
                       <SelectValue placeholder="Seleccionar insumo">
                         {materials.find(m => m.id === currentMaterial)?.name || 'Seleccionar insumo'}
                       </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectSearch value={searchMaterial} onChange={setSearchMaterial} placeholder="Buscar insumo..." />
                      {materials.filter(p => p.name.toLowerCase().includes(searchMaterial.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchMaterial.toLowerCase()))).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>`
);

fs.writeFileSync('src/pages/Recipes.tsx', code);
