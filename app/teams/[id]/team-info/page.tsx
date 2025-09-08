"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { teamsApi, Team, TeamPlayer } from "@/lib/stats-api";
import FullWidthNavBar from "@/components/FullWidthNavBar";
import TeamHeader from "@/components/TeamHeader";
import TeamTabNavigation from "@/components/TeamTabNavigation";

export default function TeamInfoPage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handler functions for TeamHeader
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDelete = () => {
    console.log('Delete team functionality not implemented yet');
  };

  // Utility function to extract player initials
  const getPlayerInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName && typeof firstName === 'string' ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName && typeof lastName === 'string' ? lastName.charAt(0).toUpperCase() : '';
    
    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    }
    return '?';
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch team data and players in parallel
        const [fetchedTeam, fetchedPlayers] = await Promise.all([
          teamsApi.getById(teamId),
          teamsApi.getPlayers(teamId).catch(() => []) // Fallback to empty array if fails
        ]);
        
        setTeam(fetchedTeam);
        setPlayers(fetchedPlayers);
        
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
        activeTab="team" 
      />

      {/* Team Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Team</h2>
          
          {/* Roster Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Roster ({players.length})
            </h3>
            
            {players.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No players found for this team.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {players.map((player) => (
                  <div 
                    key={player.id} 
                    className="flex items-center space-x-4 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Player Initial Circle */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {getPlayerInitials(player.first_name, player.last_name)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Player Name and Number */}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900">
                        {`${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player'}
                        {player.number && (
                          <span className="text-gray-600">, #{player.number}</span>
                        )}
                      </div>
                      {player.bats?.batting_side && (
                        <div className="text-sm text-gray-500">
                          Bats: {player.bats.batting_side}, Throws: {player.bats.throwing_hand}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </FullWidthNavBar>
  );
}