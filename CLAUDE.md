# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Point of Sale (POS) system for a second-hand clothing shop built with Next.js 15, using the App Router architecture. The system features lot-based inventory management where clothing batches are purchased from suppliers, with costs tracked per lot including purchase and washing expenses.

## Technology Stack

- **Framework**: Next.js 15.5.6 with App Router
- **Runtime**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with `tw-animate-css`
- **UI Components**: shadcn/ui (New York style) with Lucide icons
- **Package Manager**: Bun (based on bun.lock)
- **Build Tool**: Turbopack (Next.js's bundler)
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **Environment Variables**: @t3-oss/env-nextjs with Zod validation

## Development Commands

```bash
# Start development server with Turbopack
bun dev

# Build for production with Turbopack
bun build

# Start production server
bun start

# Run linter
bun lint

# Database commands (Drizzle)
bun db:generate    # Generate migrations from schema
bun db:migrate     # Run migrations
bun db:push        # Push schema changes directly (dev only)
bun db:studio      # Open Drizzle Studio for database inspection
```

## Project Structure

```
/app                      # Next.js App Router pages and layouts
  /globals.css            # Global styles including Tailwind directives
  /layout.tsx             # Root layout with font configuration
  /page.tsx               # Home page component
  /api                    # API routes for Better Auth and other endpoints
  /dashboard              # Dashboard page
  /inventory              # Inventory management pages
    /page.tsx             # Main inventory page (lots view)
    /lots/[id]/page.tsx   # Individual lot detail page
  /login                  # Login page
/lib                      # Utility functions and shared logic
  /utils.ts               # cn() helper for merging Tailwind classes
  /db.ts                  # Drizzle database client instance
  /auth.ts                # Better Auth configuration
  /auth-client.ts         # Better Auth client for use in components
  /env.ts                 # Environment variable validation and type-safe access
  /actions                # Server Actions
    /inventory.ts         # Inventory CRUD operations
/db                       # Database related files
  /schema.ts              # Drizzle schema definitions (auth + inventory tables)
  /migrations             # Generated migration files
/components               # React components
  /ui                     # shadcn/ui components
  /inventory              # Inventory-specific components
    /inventory-lots-view.tsx      # Lots table view
    /lot-detail-view.tsx          # Individual lot detail with products
    /products-tab.tsx             # All products overview
    /add-lot-dialog.tsx           # Create new lot dialog
    /add-product-dialog.tsx       # Add product to lot dialog
  /app-sidebar.tsx        # Main application sidebar
  /site-header.tsx        # Page header component
/hooks                    # Custom React hooks
/public                   # Static assets
```

## Architecture Notes

### shadcn/ui Configuration

The project is configured to use shadcn/ui components with the following settings (components.json):
- **Style**: `new-york` - A more refined style variant
- **RSC**: Enabled - Components support React Server Components
- **Base Color**: `neutral`
- **CSS Variables**: Enabled for theming
- **Path Aliases**:
  - `@/components` → `/components`
  - `@/ui` → `/components/ui`
  - `@/lib` → `/lib`
  - `@/hooks` → `/hooks`
  - `@/utils` → `/lib/utils`

When adding shadcn/ui components, use:
```bash
bunx shadcn@latest add <component-name>
```

### TypeScript Configuration

- Module resolution: `bundler`
- Path alias: `@/*` maps to project root
- Target: ES2017
- Strict mode enabled

### Styling Approach

- Use Tailwind CSS v4 for styling
- Use the `cn()` utility from `lib/utils.ts` to merge Tailwind classes conditionally
- Global CSS custom properties are defined in `app/globals.css` for theming

### Font Configuration

The project uses Geist fonts (Geist Sans and Geist Mono) from next/font/google, configured in the root layout with CSS variables:
- `--font-geist-sans`
- `--font-geist-mono`

### Environment Variables (@t3-oss/env-nextjs)

- **Configuration**: Define and validate all env vars in `/lib/env.ts`
- **Validation**: Uses Zod schemas for runtime validation
- **Type Safety**: Provides full TypeScript autocomplete and type checking
- **Import**: Always import from `@/lib/env` instead of `process.env`

**Structure**:
```typescript
// /lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // Server-only variables (never sent to client)
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
  },
  client: {
    // Client variables (must start with NEXT_PUBLIC_)
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

**Usage**:
```typescript
// Server-side
import { env } from "@/lib/env"
const dbUrl = env.DATABASE_URL // ✅ Type-safe, validated

// Client-side
import { env } from "@/lib/env"
const appUrl = env.NEXT_PUBLIC_APP_URL // ✅ Only public vars accessible
```

**Benefits**:
- Fails fast at build time if required env vars are missing
- Prevents accidental exposure of server secrets to client
- Type-safe access with autocomplete
- Single source of truth for all environment variables

### Database & ORM (Drizzle + Supabase)

- **Connection**: Uses Supabase PostgreSQL with connection pooling
- **Schema Location**: `/db/schema.ts` - Define all database tables here
- **Database Client**: Export a configured Drizzle instance from `/lib/db.ts`
- **Migrations**: Store in `/db/migrations`, generate with `bun db:generate`
- **Environment Variables** (defined in `/lib/env.ts`):
  - `DATABASE_URL` - Supabase connection string (pooled)
  - `DIRECT_URL` - Direct connection for migrations (optional)

**Best Practices**:
- Use Drizzle's type-safe query builder for all database operations
- Define relations in schema for join queries
- Use `db.$with()` for CTEs when needed
- Prefer server components/actions for database queries
- Use prepared statements for repeated queries

### Authentication (Better Auth)

- **Setup**: Better Auth configuration in `/lib/auth.ts`
- **Client**: Use client instance from `/lib/auth-client.ts` in components
- **API Route**: Better Auth handler at `/app/api/auth/[...all]/route.ts`
- **Session Management**: Better Auth handles sessions with database storage
- **Environment Variables** (defined in `/lib/env.ts`):
  - `BETTER_AUTH_SECRET` - Secret key for signing tokens (min 32 chars)
  - `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` - Application URL

**Better Auth Features**:
- Built-in support for email/password, OAuth providers
- Session management with Drizzle adapter
- Type-safe session and user objects
- Middleware for protecting routes
- React hooks for client-side auth state

**Usage Pattern**:
```typescript
// Server-side (Server Components, Server Actions)
import { auth } from "@/lib/auth"
const session = await auth.api.getSession({ headers: await headers() })

// Client-side (Client Components)
import { authClient } from "@/lib/auth-client"
const { data: session } = authClient.useSession()
```

### Inventory Management System

This is a lot-based inventory system designed for a second-hand clothing shop. The business model involves purchasing batches (lots) of clothing from suppliers, washing them, and then selling individual items.

**Core Concepts**:
- **Lot**: A batch of clothing purchased from a supplier at a specific time
  - Tracks purchase cost, washing cost, and calculates total cost and cost per item
  - Items in a lot share the same averaged cost (total cost / total items)
  - Identified by supplier name + purchase date (no separate lot number)
- **Product**: Individual clothing items cataloged from a lot
  - Each product references its source lot for cost tracking
  - Has its own selling price, allowing margin calculation
- **Supplier**: Vendors who provide clothing batches
- **Category**: Clothing types (e.g., Shirts, Pants, Jackets)

**Database Schema** (`/db/schema.ts`):
```typescript
// Core inventory tables
category      - id, name, timestamps
supplier      - id, name, phone, email, timestamps
lot           - id, supplierId, purchaseCost, washingCost, totalCost,
                totalItems, costPerItem, purchaseDate, notes, timestamps
product       - id, name, barcode, categoryId, lotId, costPrice,
                sellingPrice, stockQuantity, isSold, timestamps

// Relations defined for type-safe joins
```

**Key Calculations**:
- `totalCost = purchaseCost + washingCost`
- `costPerItem = totalCost / totalItems`
- `margin = ((sellingPrice - costPrice) / sellingPrice) * 100`

**User Journey**:
1. Add a lot (supplier, costs, total items count)
2. Click on the lot row to view lot details
3. Add individual products to the lot (inherits cost from lot's costPerItem)
4. Products appear in both the lot detail view and the global products view

**Server Actions** (`/lib/actions/inventory.ts`):
- `createSupplier()`, `getSuppliers()`
- `createCategory()`, `getCategories()`
- `createLot()`, `getLots()`, `getLotById()`
- `createProduct()`, `getProducts()`

**UI Components**:
- `InventoryLotsView` - Table of all lots with summary statistics
- `LotDetailView` - Individual lot with cost breakdown and products list
- `ProductsTab` - Overview of all products across all lots
- `AddLotDialog` - Form to create new lots with inline supplier quick-add
- `AddProductDialog` - Form to add products with inline category quick-add

**UX Patterns**:
- **Quick-add in dropdowns**: Select dropdowns include an "Add new..." option that reveals an inline form
- **Cost inheritance**: Products default to the lot's costPerItem
- **Progress tracking**: Shows how many products have been cataloged vs total items in lot
- **Disable when complete**: "Add Product" button disables when all items in lot are cataloged

## Conventions

### Code Conventions

- Use React Server Components by default (Next.js App Router convention)
- Add `"use client"` directive only when client-side features are needed
- Follow Next.js 15 conventions for file-based routing in the `/app` directory
- Use TypeScript for all new files
- Import UI components from `@/components/ui` when using shadcn/ui
- Database queries should be in Server Components or Server Actions
- Use Better Auth's React hooks (`useSession`, `signIn`, `signOut`) in Client Components
- Keep database schema definitions in `/db/schema.ts` with proper relations
- Use transactions for operations that modify multiple tables
- Always import environment variables from `@/lib/env`, never directly from `process.env`
- Define all new env vars in `/lib/env.ts` with proper Zod validation
- Use `server` section for secrets, `client` for NEXT_PUBLIC_ vars

### UI/UX Conventions

**Localization**:
- Currency: Use Thai Baht symbol `฿` for all monetary values
- Example: `฿{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

**Number Formatting**:
- Always use `tabular-nums` class for numerical displays to ensure proper alignment
- Use `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` for currency amounts
- Use `toLocaleString('en-US')` for whole numbers (item counts, quantities)
- Example:
  ```tsx
  <div className="text-2xl font-bold tabular-nums">
    ฿{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </div>
  ```

**Form Patterns**:
- Use controlled components for complex forms with state management
- Reset state manually before closing dialogs (avoid using `e.currentTarget.reset()` after dialog close)
- Close dialogs last in the submit handler to avoid null reference errors
- Example pattern:
  ```tsx
  startTransition(async () => {
    await createResource(data);
    // Reset state first
    setState("");
    // Close dialog last
    onOpenChange(false);
  });
  ```

**Quick-Add Pattern**:
- Implement inline quick-add forms within select dropdowns
- Use a special value like `"__add_new__"` to trigger the inline form
- Show inline form in a bordered container with cancel button
- Example structure:
  ```tsx
  <Select onValueChange={(value) => {
    if (value === "__add_new__") {
      setShowQuickAdd(true);
    } else {
      setValue(value);
    }
  }}>
    <SelectContent>
      {items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
      <SelectItem value="__add_new__" className="text-primary">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add new...</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
  ```

**Data Display**:
- Use `Badge` components for status indicators and categories
- Apply variant based on context: `"default"` for positive, `"secondary"` for neutral, `"outline"` for low priority
- Show margin badges with color coding: >50% default, >30% secondary, else outline
