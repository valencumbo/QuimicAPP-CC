import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg">
          C
        </div>
        <span className="font-semibold text-zinc-900">Costeo</span>
      </div>
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
           {/* Clone the sidebar content inside sheet, but usually we just render Sidebar Component */}
           {/* Since Sidebar has md:hidden, we can override or just reuse logic. For brevity we can just reuse it and override the class. */}
           <div className="flex bg-zinc-950 h-full w-full [&>aside]:w-full [&>aside]:flex">
            <Sidebar />
           </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
