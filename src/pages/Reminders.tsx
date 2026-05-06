import React, { useState } from 'react';
import { useWorkspaceData, useAuth } from '@/src/lib/hooks';
import { auth } from '@/src/lib/firebase';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
          <p className="text-zinc-500 mt-1">Lleva un control de tus tareas pendientes.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo recordatorio
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm divide-y">
        {sortedReminders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No tienes recordatorios. ¡Añade uno para empezar!
          </div>
        ) : (
          sortedReminders.map(r => (
            <div key={r.id} className={cn("p-4 flex items-start gap-4 transition-colors", r.completed ? "bg-zinc-50/50" : "hover:bg-zinc-50")}>
              <button onClick={() => toggleCompleted(r.id, r.completed)} className="mt-1 flex-shrink-0 text-zinc-400 hover:text-blue-500 transition-colors">
                {r.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
              </button>
              <div className="flex-1 min-w-0" onClick={() => handleOpenDialog(r)}>
                <div className="flex items-center gap-3 cursor-pointer">
                  <h3 className={cn("font-medium", r.completed ? "text-zinc-400 line-through" : "text-zinc-900")}>
                    {r.title}
                  </h3>
                  {r.dueDate && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      r.completed ? "bg-zinc-100 text-zinc-500" :
                      new Date(r.dueDate) < new Date() ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {new Date(r.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {r.description && <p className={cn("text-sm mt-1", r.completed ? "text-zinc-400" : "text-zinc-500")}>{r.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar recordatorio' : 'Ninguno'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Recordatorio / Tarea</Label>
              <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
            </div>
            
            <DialogFooter className="flex items-center justify-between mt-6">
              {editId ? (
                <Button type="button" variant="destructive" onClick={() => { setIsDialogOpen(false); setDeleteConfirmId(editId); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              ) : <div></div>}
              <div className="flex gap-2">
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit">Guardar</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este recordatorio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmId) handleDelete(deleteConfirmId);
              setDeleteConfirmId(null);
            }} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
