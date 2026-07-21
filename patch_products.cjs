const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.tsx', 'utf8');

code = code.replace(
  "import { SearchableSelect } from '@/components/ui/searchable-select';",
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { SelectSearch } from '@/components/ui/select-search';"
);

code = code.replace(
  "const [formData, setFormData] = useState({",
  "const [searchSupplier, setSearchSupplier] = useState('');\n  const [searchCategory, setSearchCategory] = useState('');\n  const [searchUnit, setSearchUnit] = useState('');\n  const [formData, setFormData] = useState({"
);

code = code.replace(
  `<SearchableSelect 
          value={filterType} 
          onValueChange={setFilterType}
          options={[
            { value: 'all', label: 'Todos los tipos' },
            { value: 'raw', label: 'Materia prima' },
            { value: 'processed', label: 'Procesado' },
            { value: 'resale', label: 'Reventa' }
          ]}
          className="w-[180px] bg-card border-border"
        />`,
  `<Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Tipo de producto">
               {filterType === 'all' && 'Todos los tipos'}
               {filterType === 'raw' && 'Materia prima'}
               {filterType === 'processed' && 'Procesado'}
               {filterType === 'resale' && 'Reventa'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="raw">Materia prima</SelectItem>
            <SelectItem value="processed">Procesado</SelectItem>
            <SelectItem value="resale">Reventa</SelectItem>
          </SelectContent>
        </Select>`
);

code = code.replace(
  `<SearchableSelect 
                    value={formData.type} 
                    onValueChange={v => setFormData({...formData, type: v as any})}
                    options={[
                      { value: 'raw', label: 'Materia Prima' },
                      { value: 'processed', label: 'Producto Procesado' },
                      { value: 'resale', label: 'Reventa' }
                    ]}
                    className="bg-input"
                  />`,
  `<Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                    <SelectTrigger className="bg-input">
                      <SelectValue>
                         {formData.type === 'raw' && 'Materia Prima'}
                         {formData.type === 'processed' && 'Producto Procesado'}
                         {formData.type === 'resale' && 'Reventa'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Materia Prima</SelectItem>
                      <SelectItem value="processed">Producto Procesado</SelectItem>
                      <SelectItem value="resale">Reventa</SelectItem>
                    </SelectContent>
                  </Select>`
);

code = code.replace(
  `<SearchableSelect 
                    value={allUnits.includes(formData.unit) ? formData.unit : (formData.unit ? 'otra' : 'Unidades')} 
                    onValueChange={val => {
                      setFormData({...formData, unit: val});
                      if (val !== 'otra') setCustomUnit('');
                    }}
                    options={[
                      ...allUnits.map(u => ({ value: u, label: u })),
                      { value: 'otra', label: 'Otra...' }
                    ]}
                    placeholder="Seleccionar unidad..."
                    searchPlaceholder="Buscar unidad..."
                    className="bg-input"
                  />`,
  `<Select value={allUnits.includes(formData.unit) ? formData.unit : (formData.unit ? 'otra' : 'Unidades')} onValueChange={val => {
                    setFormData({...formData, unit: val});
                    if (val !== 'otra') setCustomUnit('');
                  }}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar unidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectSearch value={searchUnit} onChange={setSearchUnit} />
                      {allUnits.filter(u => u.toLowerCase().includes(searchUnit.toLowerCase())).map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                      <SelectItem value="otra">Otra...</SelectItem>
                    </SelectContent>
                  </Select>`
);

code = code.replace(
  `<SearchableSelect 
                    value={formData.supplier} 
                    onValueChange={val => setFormData({...formData, supplier: val})}
                    options={[
                      { value: 'Sin proveedor especificado', label: 'Sin proveedor especificado' },
                      ...suppliers.map(s => ({ value: s.name, label: s.name }))
                    ]}
                    placeholder="Seleccionar proveedor..."
                    searchPlaceholder="Buscar proveedor..."
                    className="bg-input"
                  />`,
  `<Select value={formData.supplier} onValueChange={val => setFormData({...formData, supplier: val})}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar proveedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectSearch value={searchSupplier} onChange={setSearchSupplier} />
                      <SelectItem value="Sin proveedor especificado">Sin proveedor especificado</SelectItem>
                      {suppliers.filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase())).map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>`
);

code = code.replace(
  `<SearchableSelect 
                    value={formData.category === 'Sin categoría' ? 'Sin categoría' : (allCategories.includes(formData.category) ? formData.category : (formData.category ? 'otra' : 'Sin categoría'))} 
                    onValueChange={val => {
                      setFormData({...formData, category: val});
                      if (val !== 'otra') setCustomCategory('');
                    }}
                    options={[
                      { value: 'Sin categoría', label: 'Sin categoría' },
                      ...allCategories.map(c => ({ value: c, label: c })),
                      { value: 'otra', label: 'Otra...' }
                    ]}
                    placeholder="Seleccionar categoría..."
                    searchPlaceholder="Buscar categoría..."
                    className="bg-input"
                  />`,
  `<Select value={formData.category === 'Sin categoría' ? 'Sin categoría' : (allCategories.includes(formData.category) ? formData.category : (formData.category ? 'otra' : 'Sin categoría'))} onValueChange={val => {
                    setFormData({...formData, category: val});
                    if (val !== 'otra') setCustomCategory('');
                  }}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectSearch value={searchCategory} onChange={setSearchCategory} />
                      <SelectItem value="Sin categoría">Sin categoría</SelectItem>
                      {allCategories.filter(c => c.toLowerCase().includes(searchCategory.toLowerCase())).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectItem value="otra">Otra...</SelectItem>
                    </SelectContent>
                  </Select>`
);

code = code.replace(
  `<SearchableSelect 
                      value={formData.currency} 
                      onValueChange={v => setFormData({...formData, currency: v})}
                      options={[
                        { value: 'ARS', label: 'ARS' },
                        { value: 'USD', label: 'USD' },
                        ...(settings?.currency !== 'ARS' && settings?.currency !== 'USD' ? [{ value: settings?.currency || 'ARS', label: settings?.currency || 'ARS' }] : [])
                      ]}
                      className="bg-input"
                    />`,
  `<Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger className="bg-input">
                         <SelectValue>{formData.currency}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        {settings?.currency !== 'ARS' && settings?.currency !== 'USD' && (
                          <SelectItem value={settings?.currency || 'ARS'}>{settings?.currency}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>`
);

fs.writeFileSync('src/pages/Products.tsx', code);
