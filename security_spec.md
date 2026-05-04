# The "Dirty Dozen" Payloads - Red Team Analysis

## Data Invariants
- `UserWorkspace`: A workspace cannot be created if the `ownerId` does not match the requester ID. A workspace can only be read/updated by the user possessing that `ownerId`.
- `Product`: Products must belong to a valid workspace owned by the user. `stock`, `purchaseCost`, `salePrice` must be valid numbers (can be 0 or positive). `type` must be strictly `raw`, `resale`, or `processed`. 
- `Purchase`: Must reference a valid `workspaceId` and `productId`. `quantity` and `unitCost` must be non-negative numbers.
- `Recipe`: Must reference a valid `workspaceId` and `productId`. `components` array must contain at least one element and all properties must be strictly numbers where appropriate.

## The 12 Payloads
1. **Creation Spoofing:** Create a workspace where `ownerId` does not match `request.auth.uid`.
2. **Ghost Admin Field:** Add `isAdmin: true` to a workspace update payload.
3. **Array Flooding:** Create a recipe where the `components` array has 5000 items.
4. **Data Type Poisoning (String in Number):** Set `stock` to `"99"` instead of `99` on a product.
5. **Cross-Tenant Read (The Blanket Read Leak):** Try to read a product from another user's workspace.
6. **Cross-Tenant Write:** Try to create a purchase in another user's workspace.
7. **Deletion of Immutable Document:** Try to delete a workspace settings doc (should be allowed only by owner).
8. **Invalid Entity State:** Set product `type` to `"magic"`.
9. **Missing Required Fields on Create:** Create a Product missing the `createdAt` timestamp.
10. **Timestamp Forgery on Update:** Pass `updatedAt == timestamp from yesterday` instead of `request.time`.
11. **Size Limit Breaching in Strings:** Create a Product where `supplier` is 2000 characters long.
12. **Malicious ID (Regex Break):** Create a document with an ID containing `../` or special characters.

We will develop rules to prevent all of these.
