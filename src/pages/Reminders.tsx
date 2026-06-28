import React, { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, CheckCircle2, Circle, Trash2, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Reminders() {
  const { user } = useAuth();
  const { reminders } = useWorkspaceData(user?.uid);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', dueDate: '', completed: false
  });

  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });

  const handleOpenDialog = (r?: any) => {
    if (r) {
      setEditId(r.id);
      setFormData({
        title: r.title || '', description: r.description || '',
        dueDate: r.dueDate || '', completed: r.completed || false
      });
    } else {
      setEditId(null);
      setFormData({
        title: '', description: '', dueDate: '', completed: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    const id = editId || crypto.randomUUID();
    const docRef = doc(db, `workspaces/${user.uid}/reminders/${id}`);
    
    try {
      if (!editId) {
        await setDoc(docRef, {
          ...formData,
          workspaceId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
      }
      toast.success(editId ? 'Recordatorio actualizado' : 'Recordatorio creado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, editId ? OperationType.UPDATE : OperationType.CREATE, `workspaces/${user.uid}/reminders/${id}`);
    }
  };

  const toggleCompleted = async (id: string, currentStatus: boolean) => {
    if (!user?.uid) return;
    
    const rem = reminders.find(x => x.id === id);
    if (!rem) return;

    try {
      await updateDoc(doc(db, `workspaces/${user.uid}/reminders/${id}`), {
        completed: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workspaces/${user.uid}/reminders/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, `workspaces/${user.uid}/reminders/${id}`));
      toast.success('Recordatorio eliminado');
      setIsDialogOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/reminders/${id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Recordatorios</h1>
            <p className="text-muted-foreground mt-1 text-sm">Lleva un control de tus tareas pendientes.</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-orange-500 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo recordatorio
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-lg divide-y divide-border/50">
        {sortedReminders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            No tienes recordatorios. ¡Añade uno para empezar!
          </div>
        ) : (
          sortedReminders.map(r => (
            <div key={r.id} className={cn("p-4 flex items-start gap-4 transition-colors group", r.completed ? "bg-muted/10" : "hover:bg-muted/20")}>
              <button onClick={() => toggleCompleted(r.id, r.completed)} className="mt-1 flex-shrink-0 text-zinc-500 hover:text-primary transition-colors focus:outline-none">
                {r.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
              </button>
              <div className="flex-1 min-w-0" onClick={() => handleOpenDialog(r)}>
                <div className="flex items-center gap-3 cursor-pointer">
                  <h3 className={cn("font-medium text-base", r.completed ? "text-zinc-500 line-through" : "text-zinc-100 group-hover:text-primary transition-colors")}>
                    {r.title}
                  </h3>
                  {r.dueDate && (
                    <span className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wide",
                      r.completed ? "bg-muted text-zinc-500 border border-border" :
                      new Date(r.dueDate) < new Date() ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    )}>
                      {new Date(r.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {r.description && <p className={cn("text-sm mt-1.5", r.completed ? "text-zinc-600 line-through" : "text-zinc-400")}>{r.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-white">{editId ? 'Editar recordatorio' : 'Nuevo Recordatorio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Recordatorio / Tarea</Label>
              <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Descripción (Opcional)</Label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Fecha límite</Label>
              <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="bg-input border-border" />
            </div>
            
            <DialogFooter className="flex items-center justify-between mt-6">
              {editId ? (
                <Button type="button" variant="destructive" onClick={() => { setIsDialogOpen(false); setDeleteConfirmId(editId); }} className="bg-red-600 hover:bg-red-500 text-white">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              ) : <div></div>}
              <div className="flex gap-2">
                <DialogClose render={<Button type="button" variant="outline" className="border-border hover:bg-muted text-zinc-300" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-orange-500 text-white font-bold">Guardar</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar este recordatorio?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted text-zinc-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmId) handleDelete(deleteConfirmId);
              setDeleteConfirmId(null);
            }} className="bg-red-600 hover:bg-red-500 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
