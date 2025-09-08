"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { teamsApi, Team, Schedule, GameSummary, teamUtils } from "@/lib/stats-api";
import FullWidthNavBar from "@/components/FullWidthNavBar";
import TeamHeader from "@/components/TeamHeader";
import TeamTabNavigation from "@/components/TeamTabNavigation";

export default function TeamSchedulePage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [gameSummaries, setGameSummaries] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handler functions for TeamHeader
  const handleRefresh = () => {
    // Refresh team data
    window.location.reload();
  };

  const handleDelete = () => {
    // Delete team functionality (placeholder)
    console.log('Delete team functionality not implemented yet');
  };

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
        
        // Debug logging
        console.log('=== DEBUGGING API DATA ===');
        console.log('Team data:', fetchedTeam);
        console.log('Schedule data length:', fetchedSchedule.length);
        console.log('Schedule data:', fetchedSchedule);
        console.log('Game summaries data length:', fetchedGameSummaries.length);
        console.log('Game summaries data:', fetchedGameSummaries);
        
        // Check individual schedule items
        if (fetchedSchedule.length > 0) {
          console.log('First schedule item structure:', fetchedSchedule[0]);
          console.log('First schedule item ID:', fetchedSchedule[0].id);
          console.log('First schedule pregame_data:', fetchedSchedule[0].pregame_data);
        }
        
        // Check individual game summary items
        if (fetchedGameSummaries.length > 0) {
          console.log('First game summary structure:', fetchedGameSummaries[0]);
          console.log('First game summary ID:', fetchedGameSummaries[0].id);
        }
        
        console.log('=== END DEBUGGING API DATA ===');
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
      <FullWidthNavBar>
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
      </FullWidthNavBar>
    );
  }

  if (error || !team) {
    return (
      <FullWidthNavBar>
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
      </FullWidthNavBar>
    );
  }

  // Group schedule by month and then by date
  const groupScheduleByMonth = (scheduleItems: Schedule[]) => {
    const grouped: Record<string, Record<string, Schedule[]>> = {};
    
    scheduleItems.forEach((item) => {
      const date = new Date(item.event.start.datetime);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      const dateKey = date.toDateString(); // Full date string for grouping same-day games
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {};
      }
      if (!grouped[monthKey][dateKey]) {
        grouped[monthKey][dateKey] = [];
      }
      grouped[monthKey][dateKey].push(item);
    });
    
    // Sort months chronologically (oldest first)
    const sortedMonths = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a + ' 1');
      const dateB = new Date(b + ' 1');
      return dateA.getTime() - dateB.getTime();
    });
    
    // Sort dates within each month chronologically (oldest first)
    sortedMonths.forEach(month => {
      const dates = Object.keys(grouped[month]);
      dates.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Rebuild the month object with sorted dates
      const sortedMonth: Record<string, Schedule[]> = {};
      dates.forEach(date => {
        sortedMonth[date] = grouped[month][date];
      });
      grouped[month] = sortedMonth;
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
    
    let summary = gameSummaries.find(gs => gs.event_id === scheduleItem.id );
    
    // Check opponent name for debugging
    const opponentName = scheduleItem.pregame_data?.opponent_name || 'unknown';
    
    // Check for the correct API field structure with both team and opponent scores
    if (summary && 
        typeof summary.opponent_team_score === 'number' && 
        !isNaN(summary.opponent_team_score)) {
      
      const opponentScore = summary.opponent_team_score;
      let teamScore: number | null = null;
      
      // Try to get team's score - check various possible field names
      if (typeof summary.owning_team_score === 'number' && !isNaN(summary.owning_team_score)) {
        teamScore = summary.owning_team_score;
      } else if (summary.home_away && summary.opponent_team_score !== undefined && summary.opponent_team_score !== undefined) {
        // Use home/away structure with home_away indicator
        teamScore = summary.home_away === 'home' ? summary.owning_team_score : summary.opponent_team_score;
      } else {
        teamScore = null;
      }
      
      if (teamScore !== null && !isNaN(teamScore)) {
        
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
        
        console.log('Calculated result:', result, 'with class:', resultClass);
        console.log('=== END getGameResult DEBUGGING ===');
        return { text: result, className: resultClass };
      }
    }
    
    // Fallback to old structure for backwards compatibility
    if (summary && 
        typeof summary.home_team_score === 'number' && 
        typeof summary.away_team_score === 'number' &&
        !isNaN(summary.home_team_score) && 
        !isNaN(summary.away_team_score)) {
      
      console.log('Summary has home/away scores - using old structure');
      
      const teamScore = isHome ? summary.home_team_score : summary.away_team_score;
      const opponentScore = isHome ? summary.away_team_score : summary.home_team_score;
      
      console.log('Team score:', teamScore, 'Opponent score:', opponentScore);
      
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
    
    console.log('No valid summary found, returning time');
    
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
    <FullWidthNavBar>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/teams"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Teams
        </Link>
      </div>

      {/* Team Header Component */}
      <TeamHeader 
        team={team} 
        onRefresh={handleRefresh}
        onDelete={handleDelete}
      />

      {/* Team Tab Navigation Component */}
      <TeamTabNavigation 
        teamId={team.id} 
        activeTab="schedule" 
      />

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
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{month}</h3>
                <div className="space-y-6">
                  {Object.keys(groupedSchedule[month]).map((dateKey) => {
                    const gamesOnDate = groupedSchedule[month][dateKey];
                    const firstGameDate = new Date(gamesOnDate[0].event.start.datetime);
                    
                    return (
                      <div key={dateKey} className="space-y-3">
                        {gamesOnDate.map((game, gameIndex) => {
                          const gameDate = new Date(game.event.start.datetime);
                          const isHome = isHomeGame(game);
                          const result = getGameResult(game, isHome);
                          const isFirstGameOfDay = gameIndex === 0;
                          
                          return (
                            <Link
                              key={`${game.id}-${gameIndex}-${dateKey}`}
                              href="#"
                              className="flex items-start hover:bg-gray-50 py-2 px-2 -mx-2 rounded transition-colors"
                            >
                              {/* Day Info - Only show for first game of the day */}
                              <div className="w-12 flex-shrink-0 mr-6">
                                {isFirstGameOfDay && (
                                  <div className="text-left">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      {gameDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 leading-tight">
                                      {gameDate.getDate()}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Game Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-base font-medium text-gray-900">
                                    {isHome ? 'vs.' : '@'} {game.pregame_data?.opponent_name || 'TBD'}
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    Team Page
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  at {game.event.location?.name || 
                                      game.event.location?.address?.join(', ') || 
                                      'Location TBD'}
                                </div>
                              </div>
                              
                              {/* Result/Time */}
                              <div className="flex-shrink-0 text-right">
                                <div className={`text-base font-medium ${result.className}`}>
                                  {result.text}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FullWidthNavBar>
  );
}