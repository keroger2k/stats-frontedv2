# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start dev server**: `npm run dev` (runs on port 3001 by default, uses Turbopack)
- **Build for production**: `npm run build` (with Turbopack)
- **Start production server**: `npm start`

## Architecture Overview

This is a Next.js 15.5.2 application with App Router using React 19 and TypeScript. The application implements a complete authentication system using BetterAuth with MongoDB.

### Authentication Architecture

The authentication system is built around BetterAuth and follows a client-server separation pattern:

**Server-side Authentication (`/lib/auth.ts`)**:
- Uses `betterAuth` with MongoDB adapter via `mongodbAdapter(db)`
- Configured for email/password authentication without email verification
- Sessions expire after 7 days, update every 24 hours
- **Critical**: Only initializes on server-side (`typeof window === 'undefined'`) to avoid edge runtime issues
- Uses lazy initialization pattern to prevent runtime errors

**Client-side Authentication (`/lib/auth-client.ts`)**:
- Exports `authClient` from `better-auth/react`
- Provides `signIn`, `signUp`, `signOut`, `useSession`, `getSession` hooks
- Uses environment variable `NEXT_PUBLIC_BETTER_AUTH_URL` with fallback to `http://localhost:3001`

**API Routes (`/app/api/auth/[...all]/route.ts`)**:
- Catch-all route handler for all BetterAuth endpoints
- **Critical**: Explicitly sets `runtime = 'nodejs'` to avoid edge runtime issues with MongoDB
- Uses dynamic imports to avoid server/client module conflicts
- Handles both GET and POST requests with error boundaries

### Key Environment Variables

Required in `.env.local`:
- `BETTER_AUTH_SECRET`: Secure random string for session encryption
- `BETTER_AUTH_URL`: Base URL for authentication (e.g., `http://localhost:3001`)
- `NEXT_PUBLIC_BETTER_AUTH_URL`: Client-side base URL for authentication
- `MONGODB_URI`: MongoDB connection string (format: `mongodb://host:port/database`)

### App Structure

- `/app/page.tsx`: Home page with authentication-aware navigation
- `/app/login/page.tsx`: Custom login form using `signIn.email`
- `/app/signup/page.tsx`: Custom registration form using `signUp.email`
- `/app/dashboard/page.tsx`: Protected route demonstrating session usage
- `/app/layout.tsx`: Root layout with `SessionProvider` wrapper

### Session Management

The application uses a `SessionProvider` in the root layout that wraps all pages. Pages can access authentication state using:
- `useSession()` hook for current user session
- `signIn.email({ email, password, callbackURL })` for login
- `signUp.email({ email, password, name, callbackURL })` for registration
- `signOut()` for logout

### Middleware

Current middleware (`/middleware.ts`) is simplified to pass through all requests to avoid edge runtime compatibility issues. Future route protection should be implemented at the component level using session state.

### Runtime Considerations

**Critical for Auth Integration**:
- API routes must use `runtime = 'nodejs'` when accessing MongoDB/BetterAuth
- Server-side auth initialization must check `typeof window === 'undefined'`
- Use dynamic imports for auth modules in API routes to prevent client/server conflicts
- MongoDB/crypto modules cannot run in edge runtime - always use Node.js runtime

### Styling

- Uses Tailwind CSS v4 with PostCSS
- Geist font family (Sans and Mono variants)
- Custom authentication forms with error handling and loading states

## Stats API Integration

This application integrates with a comprehensive sports statistics API for team and player data management.

### API Configuration

**Base URL**: `https://stats-api.36technology.com`
**Swagger Documentation**: `https://stats-api.36technology.com/swagger/index.html`
**OpenAPI Spec**: `https://stats-api.36technology.com/swagger/v1/swagger.json`
**Authentication**: None required (public API)

### Key Endpoints

**Search Operations (`/api/Search`)**:
- `GET /api/Search` - Search teams with optional filters (sport, city, state, season, year)
- `POST /api/Search` - Advanced team search with complex filtering
- `POST /api/Search/{id}/public/follow` - Follow a public team
- `POST /api/Search/{id}/private/follow` - Follow a private team
- `DELETE /api/Search/{id}/unfollow` - Unfollow a team

**Teams Operations (`/api/Teams`)**:
- `GET /api/Teams` - Retrieve teams list
- `GET /api/Teams/{id}` - Get specific team details
- `POST/PATCH/DELETE /api/Teams/{id}` - Manage team data (admin operations)
- `GET /api/Teams/{id}/schedule` - Team's game schedule
- `GET /api/Teams/{id}/game-summaries` - Team's game summaries
- `GET /api/Teams/{id}/players` - Team's player roster
- `GET /api/Teams/{id}/season-stats` - Team's seasonal statistics
- `GET /api/Teams/{id}/spray-charts` - Team's performance charts

### Core Data Models

**Team Interface**:
```typescript
interface Team {
  id: string; // UUID
  name: string;
  public_id?: string;
  sport: 'baseball' | 'softball' | string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  season_name?: 'spring' | 'summer' | 'fall' | 'winter';
  season_year?: number;
  age_group?: string; // e.g., 'high_freshman', '16U'
  stat_access_level?: string;
  scorekeeping_access_level?: string;
  streaming_access_level?: string;
  record?: {
    wins: number;
    losses: number;
    ties: number;
  };
  avatar_url?: string; // Team logo/avatar
}
```

**Other Key Models**:
- `TeamPlayer`: Player roster data with statistics
- `Schedule`: Game scheduling information
- `GameSummary`: Game results and summaries
- `PlayerStats`: Individual player performance metrics
- `VideoAsset`: Video content and playback data

### API Client Implementation

**Location**: `/lib/stats-api.ts`
**Pattern**: Use native fetch with TypeScript interfaces
**Error Handling**: Implement retry logic and user-friendly error messages
**Caching**: Consider React Query or SWR for data caching and synchronization

### Common Data Patterns

**Team Grouping**: Teams are typically grouped by:
1. Year (most recent first)
2. Season (fall → summer → spring → winter)
3. Team name (alphabetical)

**Season Ordering**: `fall` → `summer` → `spring` → `winter` (most recent to oldest)

**Sports Supported**: Baseball, Softball, and potentially others

### Integration Notes

- API responses are consistent JSON with well-defined schemas
- No authentication required for read operations
- Team following functionality available but may require user context
- Video assets and statistical data provide rich content opportunities
- Spray charts and advanced statistics available for detailed analysis

### Image Configuration

**Next.js Image Optimization**: The `next.config.ts` is configured to allow images from the Stats API domain:
- **Allowed Domain**: `stats-api.36technology.com`
- **Avatar Endpoint**: `/api/teams/*/avatar` 
- **Image Handling**: Automatic fallback to team initials if avatar loading fails