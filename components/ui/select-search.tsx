import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function SelectSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center px-3 py-2 border-b border-border sticky top-0 bg-popover z-50", className)}>
      <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}
