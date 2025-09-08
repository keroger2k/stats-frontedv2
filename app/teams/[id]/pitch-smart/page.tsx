"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { teamsApi, Team } from "@/lib/stats-api";
import NavBar from "@/components/NavBar";
import TeamHeader from "@/components/TeamHeader";
import TeamTabNavigation from "@/components/TeamTabNavigation";

export default function PitchSmartPage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handler functions for TeamHeader
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDelete = () => {
    console.log('Delete team functionality not implemented yet');
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        setError(null);
        
        const fetchedTeam = await teamsApi.getById(teamId);
        setTeam(fetchedTeam);
        
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
      <NavBar>
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
      </NavBar>
    );
  }

  if (error || !team) {
    return (
      <NavBar>
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
      </NavBar>
    );
  }

  return (
    <NavBar>
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
        activeTab="pitchsmart" 
      />

      {/* PitchSmart Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">PitchSmart</h2>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              PitchSmart Analytics
            </h3>
            <p className="text-gray-600">
              Advanced pitching analytics and player safety metrics will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </NavBar>
  );
}