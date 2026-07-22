# Security Spec

## 1. Data Invariants
- A user can only access their own workspace document and its subcollections where `workspaceId == request.auth.uid`.
- User profiles (`users/{userId}`) can only be created/updated by the user themselves, and `emailVerified` should preferably be true.
- All documents inside a workspace must contain `workspaceId == request.auth.uid`.
- Strict schema validation for all entities (Product, Purchase, Recipe, Supplier, Reminder, Sale, AuditLog, User, UserWorkspace).

## 2. The "Dirty Dozen" Payloads
1. Create a workspace for another user.
2. Update another user's workspace.
3. Add a ghost field (e.g. `isAdmin: true`) to a Product.
4. Set `workspaceId` of a new Product to another user's UID.
5. Create a Product without required fields.
6. Bypass string limits on a Product name (e.g. 5000 chars).
7. Read a workspace not belonging to the user.
8. Delete a workspace not belonging to the user.
9. Inject wrong types (e.g. `stock: "many"`) in a Product.
10. Update a document with wrong `updatedAt` (not `request.time`).
11. Update `createdAt` field on an existing document.
12. Read from `users/{userId}` as another user.

## 3. The Test Runner
```typescript
// firestore.rules.test.ts
// Skipped actual execution since emulator is not configured, but rules are designed to prevent these.
```
