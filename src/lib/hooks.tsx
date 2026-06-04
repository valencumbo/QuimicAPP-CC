import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, doc, onSnapshot, query, serverTimestamp, setDoc, getDocFromServer, where
} from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

// Types mapped from blueprint
export interface AppSettings {
  currency: string;
  defaultMargin: number;
  lowStockLimit: number;
  usdRate?: number;
  usdRateHistory?: { rate: number; date: string }[];
  customUnits?: string[];
}
export interface UserWorkspace {
  ownerId: string;
  settings: AppSettings;
  createdAt: any;
  updatedAt: any;
}
export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  sku: string;
  type: 'resale' | 'raw' | 'processed';
  unit: string;
  currency?: string;
  supplier: string;
  category: string;
  stock: number;
  purchaseCost: number;
  extraCost: number;
  wasteRate: number;
  targetMargin: number;
  salePrice: number;
  createdAt: any;
  updatedAt: any;
}
export interface Purchase {
  id: string;
  workspaceId: string;
  productId: string;
  date: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  extraCost: number;
  note: string;
  createdAt: any;
}
export interface Recipe {
  id: string;
  workspaceId: string;
  productId: string;
  components: { productId: string; quantity: number }[];
  yield: number;
  processCost: number;
  createdAt: any;
  updatedAt: any;
}
export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  contact: string;
  paymentTerms: string;
  currency: string;
  deliveryTime: number;
  location: string;
  notes: string;
  createdAt: any;
  updatedAt: any;
}
export interface Reminder {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: any;
  updatedAt: any;
}

interface WorkspaceContextValue {
  settings: AppSettings | null;
  products: Product[];
  purchases: Purchase[];
  recipes: Recipe[];
  suppliers: Supplier[];
  reminders: Reminder[];
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  settings: null,
  products: [],
  purchases: [],
  recipes: [],
  suppliers: [],
  reminders: [],
  loading: true
});

export function WorkspaceProvider({ children, userId }: { children: React.ReactNode, userId?: string }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSettings(null);
      setProducts([]);
      setPurchases([]);
      setRecipes([]);
      setSuppliers([]);
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const wsRef = doc(db, 'workspaces', userId);
    
    const initWorkspace = async () => {
      try {
        const snap = await getDocFromServer(wsRef);
        if (!snap.exists()) {
          await setDoc(wsRef, {
            ownerId: userId,
            settings: { currency: "ARS", defaultMargin: 35, lowStockLimit: 5 },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `workspaces/${userId}`);
      }
    };
    initWorkspace();

    const unsubWS = onSnapshot(wsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserWorkspace;
        setSettings(data.settings);
      }
    }, err => handleFirestoreError(err, OperationType.GET, `workspaces/${userId}`));

    const unsubProducts = onSnapshot(query(collection(db, `workspaces/${userId}/products`), where('workspaceId', '==', userId)), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, err => handleFirestoreError(err, OperationType.LIST, `workspaces/${userId}/products`));

    const unsubPurchases = onSnapshot(query(collection(db, `workspaces/${userId}/purchases`), where('workspaceId', '==', userId)), (snap) => {
      setPurchases(snap.docs.map(d => ({ id: d.id, ...d.data() } as Purchase)));
    }, err => handleFirestoreError(err, OperationType.LIST, `workspaces/${userId}/purchases`));

    const unsubRecipes = onSnapshot(query(collection(db, `workspaces/${userId}/recipes`), where('workspaceId', '==', userId)), (snap) => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
    }, err => handleFirestoreError(err, OperationType.LIST, `workspaces/${userId}/recipes`));

    const unsubSuppliers = onSnapshot(query(collection(db, `workspaces/${userId}/suppliers`), where('workspaceId', '==', userId)), (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));
    }, err => handleFirestoreError(err, OperationType.LIST, `workspaces/${userId}/suppliers`));

    const unsubReminders = onSnapshot(query(collection(db, `workspaces/${userId}/reminders`), where('workspaceId', '==', userId)), (snap) => {
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder)));
    }, err => handleFirestoreError(err, OperationType.LIST, `workspaces/${userId}/reminders`));

    setLoading(false);

    return () => {
      unsubWS();
      unsubProducts();
      unsubPurchases();
      unsubRecipes();
      unsubSuppliers();
      unsubReminders();
    };
  }, [userId]);

  return (
    <WorkspaceContext.Provider value={{ settings, products, purchases, recipes, suppliers, reminders, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceData(userId?: string) {
  // We keep userId for API compatibility with existing files,
  // but it's ignored since the context provides it from the wrapper
  return useContext(WorkspaceContext);
}
