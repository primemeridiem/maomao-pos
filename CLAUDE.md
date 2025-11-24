# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Point of Sale (POS) system built with Next.js 15, using the App Router architecture. The project is in early development stages with mostly boilerplate code from `create-next-app`.

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
/app                 # Next.js App Router pages and layouts
  /globals.css       # Global styles including Tailwind directives
  /layout.tsx        # Root layout with font configuration
  /page.tsx          # Home page component
  /api               # API routes for Better Auth and other endpoints
/lib                 # Utility functions and shared logic
  /utils.ts          # cn() helper for merging Tailwind classes
  /db.ts             # Drizzle database client instance
  /auth.ts           # Better Auth configuration
  /auth-client.ts    # Better Auth client for use in components
  /env.ts            # Environment variable validation and type-safe access
/db                  # Database related files
  /schema.ts         # Drizzle schema definitions
  /migrations        # Generated migration files
/components          # React components (not created yet)
  /ui                # shadcn/ui components will go here
/public              # Static assets
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

## Conventions

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
