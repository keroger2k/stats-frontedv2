# Stats API Documentation

This document provides detailed specifications for the Sports Statistics API integration.

## API Overview

**Base URL**: `https://stats-api.36technology.com`  
**Version**: 1.0  
**Authentication**: None required (public API)  
**Documentation**: [Swagger UI](https://stats-api.36technology.com/swagger/index.html)  
**OpenAPI Spec**: [JSON](https://stats-api.36technology.com/swagger/v1/swagger.json)

## Core Data Models

### Team Model

```typescript
interface Team {
  id: string;                    // Unique UUID identifier
  name: string;                  // Team display name
  public_id?: string;            // Optional public identifier
  sport: string;                 // Sport type (baseball, softball, etc.)
  city?: string;                 // Team city
  state?: string;                // Team state/province
  country?: string;              // Team country
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  season_name?: SeasonName;      // Current season
  season_year?: number;          // Season year
  age_group?: string;            // Age classification (e.g., '16U', 'high_freshman')
  stat_access_level?: string;    // Statistics access permission level
  scorekeeping_access_level?: string; // Scorekeeping access level
  streaming_access_level?: string;    // Streaming access level
  record?: TeamRecord;           // Win/loss record
  avatar_url?: string;           // Team logo/avatar URL
}

type SeasonName = 'spring' | 'summer' | 'fall' | 'winter';

interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}
```

### Other Core Models

```typescript
interface TeamPlayer {
  id: string;
  name: string;
  position?: string;
  jersey_number?: number;
  // Additional player fields based on API response
}

interface Schedule {
  id: string;
  home_team_id: string;
  away_team_id: string;
  game_date: string;
  game_time?: string;
  location?: string;
  // Additional scheduling fields
}

interface GameSummary {
  id: string;
  home_team_score: number;
  away_team_score: number;
  inning?: number;
  status: string;
  // Additional game summary fields
}
```

## API Endpoints

### Search Endpoints

#### Search Teams
```http
GET /api/Search
```
**Query Parameters:**
- `sport` (optional): Filter by sport type
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `season` (optional): Filter by season name
- `year` (optional): Filter by season year

**Response:** `Team[]`

#### Advanced Team Search
```http
POST /api/Search
Content-Type: application/json

{
  "sport": "string",
  "city": "string", 
  "state": "string",
  "season": "string",
  "year": number
}
```
**Response:** `Team[]`

#### Follow/Unfollow Teams
```http
POST /api/Search/{id}/public/follow
POST /api/Search/{id}/private/follow
DELETE /api/Search/{id}/unfollow
```

### Teams Endpoints

#### Get All Teams
```http
GET /api/Teams
```
**Response:** `Team[]`

#### Get Team by ID
```http
GET /api/Teams/{id}
```
**Response:** `Team`

#### Get Team Schedule
```http
GET /api/Teams/{id}/schedule
```
**Response:** `Schedule[]`

#### Get Team Game Summaries
```http
GET /api/Teams/{id}/game-summaries
```
**Response:** `GameSummary[]`

#### Get Team Players
```http
GET /api/Teams/{id}/players
```
**Response:** `TeamPlayer[]`

#### Get Team Season Statistics
```http
GET /api/Teams/{id}/season-stats
```
**Response:** Statistical data object

#### Get Team Spray Charts
```http
GET /api/Teams/{id}/spray-charts
```
**Response:** Performance chart data

#### Get Team Avatar
```http
GET /api/teams/{id}/avatar
```
**Response:** Team avatar/logo image (PNG/JPG/etc.)
**Note:** This endpoint returns an image file, not JSON data

## Usage Examples

### Fetch All Teams
```typescript
const response = await fetch('https://stats-api.36technology.com/api/Teams');
const teams: Team[] = await response.json();
```

### Search Teams by Sport
```typescript
const response = await fetch('https://stats-api.36technology.com/api/Search?sport=baseball');
const baseballTeams: Team[] = await response.json();
```

### Get Team Details
```typescript
const response = await fetch(`https://stats-api.36technology.com/api/Teams/${teamId}`);
const team: Team = await response.json();
```

## Data Grouping Patterns

### Standard Team Grouping

Teams should typically be grouped and sorted in this hierarchy:
1. **Year**: Most recent first (descending order)
2. **Season**: Most recent to oldest (`fall` → `summer` → `spring` → `winter`)
3. **Team Name**: Alphabetical order (ascending)

### Season Priority Order
```typescript
const seasonOrder: Record<SeasonName, number> = {
  fall: 0,
  summer: 1, 
  spring: 2,
  winter: 3
};
```

## Error Handling

### Common HTTP Status Codes
- `200` - Success
- `404` - Resource not found
- `500` - Internal server error

### Error Response Format
```typescript
interface ApiError {
  error: string;
  message?: string;
  details?: any;
}
```

## Rate Limiting

No known rate limiting currently implemented. Monitor usage and implement client-side throttling if needed.

## Best Practices

1. **Caching**: Implement client-side caching for team data that doesn't change frequently
2. **Error Handling**: Always handle network failures and API errors gracefully
3. **Loading States**: Provide loading indicators for better UX
4. **Fallbacks**: Implement fallback avatars and default values for missing data
5. **TypeScript**: Use strict typing for all API responses and requests
6. **Environment**: Use environment variables for API base URLs to support different environments

## Integration Notes

- All timestamps are in ISO 8601 format
- Team avatars may be missing - implement fallback handling
- Season names are lowercase strings
- Team records may be null for new teams
- Some teams may not have location information (city/state/country)