"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { teamsApi, Team, Schedule, GameSummary, teamUtils } from "@/lib/stats-api";

export default function TeamSchedulePage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [gameSummaries, setGameSummaries] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all team data in parallel
        const [fetchedTeam, fetchedSchedule, fetchedGameSummaries] = await Promise.all([
          teamsApi.getById(teamId),
          teamsApi.getSchedule(teamId).catch(() => []), // Fallback to empty array if fails
          teamsApi.getGameSummaries(teamId).catch(() => []) // Fallback to empty array if fails
        ]);
        
        setTeam(fetchedTeam);
        setSchedule(fetchedSchedule);
        setGameSummaries(fetchedGameSummaries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team details');
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/teams"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to Teams
            </Link>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading team details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/teams"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to Teams
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="text-red-700">
              <h3 className="text-lg font-medium">Error Loading Team</h3>
              <p className="mt-1">{error || 'Team not found'}</p>
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </button>
                <Link
                  href="/teams"
                  className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  Back to Teams
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group schedule by month
  const groupScheduleByMonth = (scheduleItems: Schedule[]) => {
    const grouped: Record<string, Schedule[]> = {};
    
    scheduleItems.forEach((item) => {
      const date = new Date(item.event.start.datetime);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(item);
    });
    
    // Sort months by date (most recent first)
    const sortedMonths = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a + ' 1');
      const dateB = new Date(b + ' 1');
      return dateB.getTime() - dateA.getTime();
    });
    
    return { grouped, sortedMonths };
  };

  const { grouped: groupedSchedule, sortedMonths } = groupScheduleByMonth(schedule);

  // Helper function to determine if team is playing at home
  const isHomeGame = (scheduleItem: Schedule) => {
    // For now, we'll use a simple heuristic - if location name exists, it might indicate away game
    // This logic may need adjustment based on actual data patterns
    if (!team || !scheduleItem.event.location || !scheduleItem.event.location.name) {
      return true; // Default to home game if we can't determine
    }
    return scheduleItem.event.location.name.includes(team.city || '');
  };

  // Helper function to get game result with win/loss status
  const getGameResult = (scheduleItem: Schedule, isHome: boolean) => {
    // Find matching game summary by schedule ID
    const summary = gameSummaries.find(gs => gs.id === scheduleItem.id);
    
    if (summary && typeof summary.home_team_score === 'number' && typeof summary.away_team_score === 'number') {
      const teamScore = isHome ? summary.home_team_score : summary.away_team_score;
      const opponentScore = isHome ? summary.away_team_score : summary.home_team_score;
      
      let result;
      let resultClass = '';
      
      if (teamScore > opponentScore) {
        result = `W ${teamScore}-${opponentScore}`;
        resultClass = 'text-green-600 font-semibold';
      } else if (teamScore < opponentScore) {
        result = `L ${teamScore}-${opponentScore}`;
        resultClass = 'text-gray-900 font-semibold';
      } else {
        result = `T ${teamScore}-${opponentScore}`;
        resultClass = 'text-gray-900 font-semibold';
      }
      
      return { text: result, className: resultClass };
    }
    
    // Return game time if no result found (future game)
    try {
      const gameTime = new Date(scheduleItem.event.start.datetime);
      if (isNaN(gameTime.getTime())) {
        return { text: 'TBD', className: 'text-gray-500' };
      }
      const timeString = gameTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return { text: timeString, className: 'text-gray-500' };
    } catch (error) {
      console.error('Error parsing game time:', error);
      return { text: 'TBD', className: 'text-gray-500' };
    }
  };

  // Early return if no team data
  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/teams"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to Teams
            </Link>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading team data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/teams"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Teams
          </Link>
        </div>

        {/* Main Team Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex items-start space-x-6">
              {/* Team Avatar */}
              <div className="h-20 w-20 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Image
                  src={`https://stats-api.36technology.com/api/teams/${team.id}/avatar`}
                  alt={`${team.name} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="text-white font-bold text-xl">${team.name
                        .split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}</div>`;
                    }
                  }}
                />
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                      {team.record && (
                        <span className="font-semibold text-lg text-gray-900">
                          {teamUtils.formatRecord(team.record)}
                        </span>
                      )}
                      {team.season_name && team.season_year && (
                        <span className="font-medium">
                          {teamUtils.formatSeasonName(team.season_name)} {team.season_year}
                        </span>
                      )}
                      {(team.city || team.state) && (
                        <span>
                          {[team.city, team.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      Refresh
                    </button>
                    <button className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Staff List */}
                {team.staff && team.staff.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Staff</h3>
                    <div className="flex flex-wrap gap-2">
                      {team.staff.map((staffMember, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {staffMember}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6">
            <nav className="flex space-x-8">
              <Link
                href={`/teams/${team.id}/schedule`}
                className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
              >
                SCHEDULE
              </Link>
              <Link
                href="#"
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                TEAM
              </Link>
              <Link
                href="#"
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                STATS
              </Link>
              <Link
                href="#"
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                PITCHSMART
              </Link>
              <Link
                href="#"
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                USERS
              </Link>
            </nav>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>
          </div>
          
          {schedule.length === 0 ? (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <svg
                    className="h-6 w-6 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Schedule Available
                </h3>
                <p className="text-gray-600">
                  This team doesn't have any scheduled games yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedMonths.map((month) => (
                <div key={month} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{month}</h3>
                  <div className="space-y-3">
                    {groupedSchedule[month].map((game, index) => {
                      const gameDate = new Date(game.event.start.datetime);
                      const isHome = isHomeGame(game);
                      const result = getGameResult(game, isHome);
                      
                      return (
                        <Link
                          key={`${game.id}-${index}-${month}`}
                          href="#"
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-6">
                            {/* Day Info */}
                            <div className="text-center min-w-0">
                              <div className="text-xs font-medium text-gray-500 uppercase">
                                {gameDate.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {gameDate.getDate()}
                              </div>
                            </div>
                            
                            {/* Game Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {isHome ? 'vs.' : '@'} {game.pregame_data?.opponent_name || 'TBD'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {game.event.location?.name || 
                                 game.event.location?.address?.join(', ') || 
                                 'Location TBD'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Result/Time */}
                          <div className="text-right">
                            <div className={`text-sm ${result.className}`}>
                              {result.text}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}