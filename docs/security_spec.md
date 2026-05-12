# Nexus ERP Security Specification

## Data Invariants
1. A user cannot access data outside their `organizationId`.
2. Movements must have a valid `productId`, `warehouseId`, and `unitId` belonging to the organization.
3. Users with role `OPERATOR` cannot perform `ADJUSTMENT` movements.
4. Stock levels cannot be negative (enforced at application level and checked in rules where possible).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
   ```json
   { "uid": "victim_uid", "email": "attacker@nexus.com", "organizationId": "org_1", "role": "ADMIN" }
   ```
2. **Cross-Tenant Access**: Attempt to read an organization document without being a member.
3. **Privilege Escalation**: An `OPERATOR` attempting to change their role to `ADMIN`.
   ```json
   { "role": "ADMIN" }
   ```
4. **Orphaned Movement**: Creating a movement for a `productId` that doesn't exist.
5. **Ghost Field Injection**: Adding `isVerified: true` to a product document.
   ```json
   { "sku": "CAB-001", "name": "Cabo", "isVerified": true }
   ```
6. **Shadow Update**: Updating a movement's `quantity` after it was created.
7. **Negative Inventory**: Setting `quantity` in stock to `-100`.
8. **Resource Poisoning**: Using a 2KB string as a `sku`.
9. **PII Leak**: Accessing another user's email via a blanket collection query.
10. **State Shortcutting**: Skipping the `IN` status for a product.
11. **Bypassing Relation**: Creating a warehouse for an organization the user doesn't belong to.
12. **Timestamp Forgery**: Providing a `createdAt` from 2020.

## Test Runner (Conceptual)
The `firestore.rules` will be validated against these scenarios.
