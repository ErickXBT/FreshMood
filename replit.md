# FreshMood

FreshMood is a full-stack QR ordering and order management system for modern dine-in restaurants.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/freshmood run dev` — run the customer/admin web app (port 23784)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Shadcn UI, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema files (categories, menu-items, tables, orders, order-items, payments)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/freshmood/src/` — React frontend (pages: menu, checkout, order-status, admin/*)

## Architecture decisions

- All prices stored as `numeric(12,2)` strings in DB; parsed to float in API responses
- Tax = 10%, service fee = 5% of subtotal — calculated server-side on order creation
- Admin auth uses a simple token returned at login (stored in localStorage); default credentials: `admin` / `freshmood2024`
- QR codes point to `/menu?table=<number>`; table number is read from the URL query param and stored in localStorage
- Kitchen page auto-refreshes every 10 seconds via React Query `refetchInterval`

## Product

- **Customer app**: Scan QR → browse menu by category → add to cart → checkout → track order status
- **Admin dashboard**: Analytics, revenue charts, best-selling items, recent orders
- **Kitchen display**: Real-time order queue grouped by status, one-click status advancement
- **Menu management**: Full CRUD for categories and menu items, availability toggle, best seller badge

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Zod schema names from codegen use operation-shaped names (`CreateCategoryBody`, not `CategoryInput`)
- Restart the API server workflow after backend code changes
- The `@workspace/db run push` must be run after any schema changes before the server will work

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
