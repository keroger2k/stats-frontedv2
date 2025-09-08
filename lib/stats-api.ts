// Stats API Client
// Provides TypeScript-safe access to the Sports Statistics API

const API_BASE_URL = process.env.NEXT_PUBLIC_STATS_API_URL || 'https://stats-api.36technology.com';

// Core Data Types
export type SeasonName = 'spring' | 'summer' | 'fall' | 'winter';

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface Team {
  id: string;
  name: string;
  public_id?: string;
  sport: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  season_name?: SeasonName;
  season_year?: number;
  age_group?: string;
  stat_access_level?: string;
  scorekeeping_access_level?: string;
  streaming_access_level?: string;
  record?: TeamRecord;
  avatar_url?: string;
  staff?: string[];
}

export interface TeamPlayer {
  id: string;
  name: string;
  position?: string;
  jersey_number?: number;
}

export interface Schedule {
  id: string;
  event: {
    start: {
      datetime: string;
    };
    end: {
      datetime: string;
    };
    location?: {
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      address?: string[];
      name?: string;
    };
  };
  pregame_data?: {
    opponent_id?: string;
    opponent_name?: string;
  };
}

export interface GameSummary {
  id: string;
  home_team_score: number;
  away_team_score: number;
  inning?: number;
  status: string;
}

// API Error Types
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

// Search Parameters
export interface TeamSearchParams {
  sport?: string;
  city?: string;
  state?: string;
  season?: string;
  year?: number;
}

// API Response wrapper for error handling
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Season ordering for sorting (fall is most recent)
export const SEASON_ORDER: Record<SeasonName, number> = {
  fall: 0,
  summer: 1,
  spring: 2,
  winter: 3,
};

// Generic API request function with error handling
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Teams API Functions
export const teamsApi = {
  // Get all teams
  getAll: async (): Promise<Team[]> => {
    return apiRequest<Team[]>('/api/Teams');
  },

  // Get team by ID
  getById: async (id: string): Promise<Team> => {
    return apiRequest<Team>(`/api/Teams/${id}`);
  },

  // Get team schedule
  getSchedule: async (id: string): Promise<Schedule[]> => {
    return apiRequest<Schedule[]>(`/api/Teams/${id}/schedule`);
  },

  // Get team game summaries
  getGameSummaries: async (id: string): Promise<GameSummary[]> => {
    return apiRequest<GameSummary[]>(`/api/Teams/${id}/game-summaries`);
  },

  // Get team players
  getPlayers: async (id: string): Promise<TeamPlayer[]> => {
    return apiRequest<TeamPlayer[]>(`/api/Teams/${id}/players`);
  },

  // Get team users
  getUsers: async (id: string): Promise<any[]> => {
    return apiRequest<any[]>(`/api/Teams/${id}/users`);
  },

  // Get team season stats
  getSeasonStats: async (id: string): Promise<any> => {
    return apiRequest<any>(`/api/Teams/${id}/season-stats`);
  },

  // Get team spray charts
  getSprayCharts: async (id: string): Promise<any> => {
    return apiRequest<any>(`/api/Teams/${id}/spray-charts`);
  },

  // Get team avatar URL (note: this returns an image, not JSON)
  getAvatarUrl: (id: string): string => {
    return `${API_BASE_URL}/api/teams/${id}/avatar`;
  },
};

// Search API Functions
export const searchApi = {
  // Search teams with query parameters
  searchTeams: async (params: TeamSearchParams = {}): Promise<Team[]> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/Search?${queryString}` : '/api/Search';
    
    return apiRequest<Team[]>(endpoint);
  },

  // Advanced search with POST request
  advancedSearch: async (params: TeamSearchParams): Promise<Team[]> => {
    return apiRequest<Team[]>('/api/Search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Follow team (public)
  followPublicTeam: async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/Search/${id}/public/follow`, {
      method: 'POST',
    });
  },

  // Follow team (private)
  followPrivateTeam: async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/Search/${id}/private/follow`, {
      method: 'POST',
    });
  },

  // Unfollow team
  unfollowTeam: async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/Search/${id}/unfollow`, {
      method: 'DELETE',
    });
  },
};

// Utility Functions for Data Processing
export const teamUtils = {
  // Group teams by "Season Year" format (e.g., "Fall 2025", "Summer 2024")
  groupTeamsBySeasonYear: (teams: Team[]) => {
    const grouped: Record<string, Team[]> = {};

    teams.forEach((team) => {
      // Default to current year if no season_year
      const year = team.season_year || new Date().getFullYear();
      // Default to 'fall' if no season specified
      const season = team.season_name || 'fall';
      
      // Create "Season Year" key (e.g., "Fall 2025")
      const seasonYearKey = `${teamUtils.formatSeasonName(season)} ${year}`;

      if (!grouped[seasonYearKey]) {
        grouped[seasonYearKey] = [];
      }

      grouped[seasonYearKey].push(team);
    });

    // Sort teams within each group alphabetically by name
    Object.keys(grouped).forEach((seasonYear) => {
      grouped[seasonYear].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  },

  // Generate all possible season-year combinations for a range of years
  generateSeasonYearCombinations: (startYear: number, endYear: number) => {
    const combinations: string[] = [];
    const seasons: SeasonName[] = ['fall', 'summer', 'spring', 'winter'];

    for (let year = startYear; year >= endYear; year--) {
      seasons.forEach((season) => {
        combinations.push(`${teamUtils.formatSeasonName(season)} ${year}`);
      });
    }

    return combinations;
  },

  // Get sorted season-year groups (most recent first)
  getSortedSeasonYearGroups: (groupedTeams: Record<string, Team[]>) => {
    const keys = Object.keys(groupedTeams);
    
    if (keys.length === 0) return [];

    // Extract years from the keys to determine range
    const years = keys.map(key => {
      const parts = key.split(' ');
      return parseInt(parts[parts.length - 1]); // Get the year part
    });

    const maxYear = Math.max(...years);
    const minYear = Math.min(...years);

    // Generate all possible combinations in chronological order
    const allCombinations = teamUtils.generateSeasonYearCombinations(maxYear, minYear);

    // Filter to only include combinations that have teams
    return allCombinations.filter(combination => groupedTeams[combination]);
  },

  // Generate fallback avatar for teams
  generateFallbackAvatar: (teamName: string) => {
    const initials = teamName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // You could generate a data URL with canvas or use a placeholder service
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=ffffff&size=40`;
  },

  // Format season name for display
  formatSeasonName: (season: SeasonName) => {
    return season.charAt(0).toUpperCase() + season.slice(1);
  },

  // Format team record for display
  formatRecord: (record?: TeamRecord) => {
    if (!record) return 'No record';
    return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ''}`;
  },
};