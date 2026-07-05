import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../lib/hooks';
import { Navigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function Audit() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const workspaceId = user?.uid;

  useEffect(() => {
    if (workspaceId) {
      const loadLogs = async () => {
        try {
          setLoading(true);
          const q = query(collection(db, `workspaces/${workspaceId}/auditLogs`), orderBy('timestamp', 'desc'), limit(100));
          const snap = await getDocs(q);
          setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error(err);
          toast.error('Error al cargar logs de auditoría');
        } finally {
          setLoading(false);
        }
      };
      loadLogs();
    }
  }, [workspaceId]);

  const getActionColor = (action: string) => {
    switch(action) {
      case 'create': return 'text-green-600 bg-green-50 dark:bg-green-950/50';
      case 'update': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/50';
      case 'delete': return 'text-red-600 bg-red-50 dark:bg-red-950/50';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Registro de Auditoría</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Trazabilidad
          </CardTitle>
          <CardDescription>
            Registro de las últimas 100 acciones importantes realizadas en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> No hay registros de auditoría.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.userEmail}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {log.entityType}
                      </TableCell>
                      <TableCell>
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
