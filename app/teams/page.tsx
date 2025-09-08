"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { teamsApi, teamUtils, Team, SeasonName } from "@/lib/stats-api";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTeams = await teamsApi.getAll();
        setTeams(fetchedTeams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
        console.error('Error fetching teams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                <Link href="/teams" className="text-xl font-semibold text-gray-900">Teams</Link>
              </div>
              {session && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {session.user.email}!
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">Browse all teams by year and season</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading teams...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                <Link href="/teams" className="text-xl font-semibold text-gray-900">Teams</Link>
              </div>
              {session && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {session.user.email}!
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">Browse all teams by year and season</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex items-center">
              <div className="text-red-700">
                <h3 className="text-lg font-medium">Error Loading Teams</h3>
                <p className="mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                <Link href="/teams" className="text-xl font-semibold text-gray-900">Teams</Link>
              </div>
              {session && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {session.user.email}!
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">Browse all teams by year and season</p>
          </div>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No teams found</div>
          </div>
        </div>
      </div>
    );
  }

  // Group teams by Season Year format (e.g., "Fall 2025", "Summer 2025", etc.)
  const groupedTeams = teamUtils.groupTeamsBySeasonYear(teams);
  const sortedSeasonYears = teamUtils.getSortedSeasonYearGroups(groupedTeams);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
              <Link href="/teams" className="text-xl font-semibold text-gray-900">Teams</Link>
            </div>
            {session && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {session.user.email}!
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-gray-600">
            Browse all teams organized by season and year ({teams.length} teams total)
          </p>
        </div>

        {/* Teams Grouped by Season Year */}
        <div className="space-y-6">
          {sortedSeasonYears.map((seasonYear) => {
            const seasonTeams = groupedTeams[seasonYear];

            return (
              <div key={seasonYear} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Season Year Header */}
                <div className="bg-gray-800 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    {seasonYear}
                    <span className="ml-3 text-sm font-normal text-gray-300">
                      ({seasonTeams.length} teams)
                    </span>
                  </h2>
                </div>

                {/* Teams in this season year */}
                <div className="p-6">
                  <div className="grid gap-3">
                    {seasonTeams.map((team) => (
                      <Link
                        key={team.id}
                        href={`/teams/${team.id}/schedule`}
                        className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors group"
                      >
                        {/* Team Avatar */}
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
                            <Image
                              src={`https://stats-api.36technology.com/api/teams/${team.id}/avatar`}
                              alt={`${team.name} logo`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="text-white font-medium text-sm">${team.name
                                    .split(' ')
                                    .map(word => word.charAt(0))
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}</div>`;
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Team Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {team.name}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {team.sport && (
                                  <span className="capitalize">{team.sport}</span>
                                )}
                                {team.age_group && (
                                  <>
                                    <span>•</span>
                                    <span>{team.age_group}</span>
                                  </>
                                )}
                                {(team.city || team.state) && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {[team.city, team.state].filter(Boolean).join(', ')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Team Record */}
                            {team.record && (
                              <div className="text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  {teamUtils.formatRecord(team.record)}
                                </span>
                                <div className="text-xs text-gray-500">record</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="ml-4 flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {teams.length} teams across {sortedSeasonYears.length} season periods
        </div>
      </div>
    </div>
  );
}