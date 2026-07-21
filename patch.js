const fs = require('fs');
let code = fs.readFileSync('src/pages/Suppliers.tsx', 'utf8');

code = code.replace(
  "const [compareA, setCompareA] = useState<string>('');\n  const [compareB, setCompareB] = useState<string>('');",
  "const [compareA, setCompareA] = useState<string>('');\n  const [compareB, setCompareB] = useState<string>('');\n  const [searchA, setSearchA] = useState('');\n  const [searchB, setSearchB] = useState('');"
);

code = code.replace(
  `<SearchableSelect 
                value={compareA} 
                onValueChange={setCompareA}
                options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                placeholder="Seleccionar"
                searchPlaceholder="Buscar..."
                className="bg-input border-border text-white"
              />`,
  `<Select value={compareA} onValueChange={setCompareA}>
                <SelectTrigger className="bg-input border-border text-white">
                  <SelectValue placeholder="Seleccionar">
                    {suppliers.find(s => s.id === compareA)?.name || 'Seleccionar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectSearch value={searchA} onChange={setSearchA} />
                  {suppliers.filter(s => s.name.toLowerCase().includes(searchA.toLowerCase())).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>`
);

code = code.replace(
  `<SearchableSelect 
                value={compareB} 
                onValueChange={setCompareB}
                options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                placeholder="Seleccionar"
                searchPlaceholder="Buscar..."
                className="bg-input border-border text-white"
              />`,
  `<Select value={compareB} onValueChange={setCompareB}>
                <SelectTrigger className="bg-input border-border text-white">
                  <SelectValue placeholder="Seleccionar">
                    {suppliers.find(s => s.id === compareB)?.name || 'Seleccionar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectSearch value={searchB} onChange={setSearchB} />
                  {suppliers.filter(s => s.name.toLowerCase().includes(searchB.toLowerCase())).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>`
);

fs.writeFileSync('src/pages/Suppliers.tsx', code);
