/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router';
import { useAuth, WorkspaceProvider } from './lib/hooks';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

function HomeOrLanding() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-50" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Recipes from './pages/Recipes';
import Settings from './pages/Settings';
import Suppliers from './pages/Suppliers';
import Reminders from './pages/Reminders';
import Billing from './pages/Billing';
import OrderGenerator from './pages/OrderGenerator';
import Topbar from './components/Topbar';
import QuickActionBtn from './components/QuickActionBtn';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-zinc-400 w-8 h-8" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <WorkspaceProvider userId={user.uid}>
      <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans relative">
        <Sidebar />
        <main className="flex-1 overflow-auto flex flex-col">
          <Topbar />
          <div className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full relative">
            <Outlet />
          </div>
        </main>
        <QuickActionBtn />
        <Toaster />
      </div>
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeOrLanding />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/order-generator" element={<OrderGenerator />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
