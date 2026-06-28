import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border px-6 py-4 flex items-center justify-between md:hidden shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-[0_0_10px_rgba(251,146,60,0.4)]">
          C
        </div>
        <span className="font-bold text-white tracking-tight">QuimicAPP</span>
      </div>
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white" />}>
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-border bg-sidebar">
           <div className="flex h-full w-full [&>aside]:w-full [&>aside]:flex">
            <Sidebar />
           </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
