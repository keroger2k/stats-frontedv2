"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { teamsApi, Team, TeamPlayer, SeasonStatsResponse, PlayerSeasonStats } from "@/lib/stats-api";
import NavBar from "@/components/NavBar";
import TeamHeader from "@/components/TeamHeader";
import TeamTabNavigation from "@/components/TeamTabNavigation";

// Import AG Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function SeasonStatsPage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStatsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatsTab, setActiveStatsTab] = useState<'batting' | 'pitching' | 'fielding' | 'standard' | 'advanced'>('batting');

  // Handler functions for TeamHeader
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDelete = () => {
    console.log('Delete team functionality not implemented yet');
  };

  // Helper function to combine player data with their stats
  const getPlayersWithStats = () => {
    if (!seasonStats.stats_data?.players) return [];
    
    return players.map(player => {
      const playerStats = seasonStats.stats_data?.players?.[player.id];
      if (playerStats?.stats?.offense) {
        return {
          ...player,
          offense: playerStats.stats.offense,
          defense: playerStats.stats.defense,
          general: playerStats.stats.general
        };
      }
      return null;
    }).filter(player => player !== null);
  };

  // Helper function to format decimal numbers
  const formatDecimal = (value: number | undefined, decimals: number = 3) => {
    if (value === undefined || value === null || isNaN(value)) return '0' + '.'.padEnd(decimals + 1, '0');
    return value.toFixed(decimals);
  };

  // Helper function to format integer stats
  const formatInt = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return value.toString();
  };

  // Player name cell renderer
  const PlayerNameCellRenderer = (props: any) => {
    const player = props.data;
    const fullName = `${player.first_name || ''} ${player.last_name || ''}`.trim();
    const playerName = fullName || 'Unknown Player';
    const jerseyNumber = player.number ? `#${player.number}` : '';
    
    return (
      <Link href="#" className="text-blue-600 hover:text-blue-800 font-medium">
        {`${playerName}${jerseyNumber ? ', ' + jerseyNumber : ''}`}
      </Link>
    );
  };

  // Number formatter for decimal values
  const decimalFormatter = (params: any) => {
    return formatDecimal(params.value);
  };

  // Number formatter for integer values
  const integerFormatter = (params: any) => {
    return formatInt(params.value);
  };

  // AG Grid column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Player',
      field: 'playerName',
      pinned: 'left',
      width: 200,
      cellRenderer: PlayerNameCellRenderer,
      valueGetter: (params) => `${params.data.first_name || ''} ${params.data.last_name || ''}`.trim(),
    },
    { headerName: 'GP', field: 'gp', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.general?.gp || params.data.offense?.gp, valueFormatter: integerFormatter },
    { headerName: 'PA', field: 'pa', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.pa, valueFormatter: integerFormatter },
    { headerName: 'AB', field: 'ab', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ab, valueFormatter: integerFormatter },
    { headerName: 'AVG', field: 'avg', width: 70, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.avg, valueFormatter: decimalFormatter, sort: 'desc' },
    { headerName: 'OBP', field: 'obp', width: 70, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.obp, valueFormatter: decimalFormatter },
    { headerName: 'OPS', field: 'ops', width: 70, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ops, valueFormatter: decimalFormatter },
    { headerName: 'SLG', field: 'slg', width: 70, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.slg, valueFormatter: decimalFormatter },
    { headerName: 'H', field: 'h', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.h, valueFormatter: integerFormatter },
    { headerName: '1B', field: '1B', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["1B"], valueFormatter: integerFormatter },
    { headerName: '2B', field: '2B', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["2B"], valueFormatter: integerFormatter },
    { headerName: '3B', field: '3B', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["3B"], valueFormatter: integerFormatter },
    { headerName: 'HR', field: 'hr', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.hr, valueFormatter: integerFormatter },
    { headerName: 'RBI', field: 'rbi', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.rbi, valueFormatter: integerFormatter },
    { headerName: 'R', field: 'r', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.r, valueFormatter: integerFormatter },
    { headerName: 'BB', field: 'bb', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.bb, valueFormatter: integerFormatter },
    { headerName: 'SO', field: 'so', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.so, valueFormatter: integerFormatter },
    { headerName: 'K-L', field: 'kl', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["K-L"], valueFormatter: integerFormatter },
    { headerName: 'HBP', field: 'hbp', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.hbp, valueFormatter: integerFormatter },
    { headerName: 'SAC', field: 'sac', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.shb, valueFormatter: integerFormatter },
    { headerName: 'SF', field: 'sf', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.shf, valueFormatter: integerFormatter },
    { headerName: 'ROE', field: 'roe', width: 60, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.roe, valueFormatter: integerFormatter },
    { headerName: 'FC', field: 'fc', width: 50, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.fc, valueFormatter: integerFormatter },
  ], []);

  // AG Grid default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: false,
    resizable: false,
    suppressMenu: true,
  }), []);

  // AG Grid options
  const gridOptions = useMemo(() => ({
    theme: 'legacy', // Use legacy theming to work with CSS files
    headerHeight: 40,
    rowHeight: 48,
    suppressRowClickSelection: true,
    suppressRowSelection: true,
    suppressCellFocus: true,
    suppressHorizontalScroll: false,
    alwaysShowHorizontalScroll: true,
    suppressColumnMoveAnimation: true,
    animateRows: false,
  }), []);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch team data, players, and season stats in parallel
        const [fetchedTeam, fetchedPlayers, fetchedSeasonStats] = await Promise.all([
          teamsApi.getById(teamId),
          teamsApi.getPlayers(teamId).catch(() => []), // Fallback to empty array if fails
          teamsApi.getSeasonStats(teamId).catch(() => ({})) // Fallback to empty object if fails
        ]);
        
        setTeam(fetchedTeam);
        setPlayers(fetchedPlayers);
        setSeasonStats(fetchedSeasonStats);
        
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
        activeTab="stats" 
      />

      {/* Season Stats Section */}
      <div className="bg-white shadow rounded-lg">
        {/* Header with title and buttons */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Stats</h2>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter Stats
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Export Stats
            </button>
          </div>
        </div>

        {/* Stats Tab Navigation */}
        <div className="px-6 py-3 border-b border-gray-200">
          <nav className="flex space-x-6">
            {[
              { id: 'batting', label: 'Batting' },
              { id: 'pitching', label: 'Pitching' },
              { id: 'fielding', label: 'Fielding' },
              { id: 'standard', label: 'Standard' },
              { id: 'advanced', label: 'Advanced' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatsTab(tab.id as any)}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeStatsTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Statistics Table */}
        {getPlayersWithStats().length === 0 ? (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-gray-500">No season statistics available for this team.</div>
            </div>
          </div>
        ) : (
          <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={getPlayersWithStats()}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              suppressRowTransform={true}
              getRowId={(params) => params.data.id}
            />
          </div>
        )}
      </div>
    </NavBar>
  );
}