# Backup and Security Plan

## Backup Strategy
- Primary: Supabase automated backups / PITR (if enabled on your plan) for the production project.
- Secondary: Scheduled SQL exports of critical tables (`products`, `orders`, `order_items`, `admin_action_logs`) to secure object storage.
- Frequency:
  - Daily full export.
  - Before every production migration.
  - Retain at least 30 days.

## Recovery Steps
1. Identify incident scope and affected timestamp.
2. If PITR is enabled, restore to a new project at the last known-good time.
3. Validate restored data (`orders` totals, product stock, auth users).
4. Re-point environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to restored project.
5. Run pending migrations, smoke-test checkout/admin flows, then switch traffic.
6. If PITR is unavailable, import latest SQL export into a clean project and repeat validation/switch.

## Authentication Security
- Authentication is handled by Supabase Auth (email/password and session tokens).
- Client uses the anon key; no service-role key is exposed in frontend code.
- Session state is retrieved via Supabase SDK and role checks are applied in UI and RLS policies.

## Access Control
- Row Level Security (RLS) is enabled on `orders` and `order_items`.
- Customers can only read/insert their own orders/items.
- Admin users can read all orders/items and update order payment status.
- Product soft-delete (`is_archived`) prevents storefront visibility while preserving historical records.

## Sensitive Data Handling
- Email addresses and auth credentials remain inside Supabase Auth.
- Delivery addresses are stored for fulfillment in `orders.address` and `orders.address_json`.
- Never log plaintext passwords or secrets in app logs.
