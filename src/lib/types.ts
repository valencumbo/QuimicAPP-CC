export type Role = 'superadmin' | 'admin' | 'seller' | 'stock' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  workspaceId: string | null;
  createdBy?: string;
  isActive: boolean;
  lastLogin?: any;
  createdAt: any;
  updatedAt: any;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export' | 'other';
  entityType: 'product' | 'batch' | 'sale' | 'purchase' | 'recipe' | 'supplier' | 'reminder' | 'user' | 'workspace' | 'settings';
  entityId?: string;
  description: string;
  timestamp: any;
  ip?: string;
}

// ... other existing types will be migrated here eventually, or we keep them in hooks.tsx
