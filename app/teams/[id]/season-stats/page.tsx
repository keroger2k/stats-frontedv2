"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { teamsApi, Team, TeamPlayer, SeasonStatsResponse, PlayerSeasonStats } from "@/lib/stats-api";
import FullWidthNavBar from "@/components/FullWidthNavBar";
import TeamHeader from "@/components/TeamHeader";
import TeamTabNavigation from "@/components/TeamTabNavigation";

// Import AG Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Statistics Legend Data - Dynamic based on active category and type
const getStatsLegend = (category: string, type: string) => {
  if (category === 'batting' && type === 'standard') {
    return [
      { abbrev: 'G', meaning: 'Games played' },
      { abbrev: 'PA', meaning: 'Plate appearances' },
      { abbrev: 'AB', meaning: 'At bats' },
      { abbrev: 'AVG', meaning: 'Batting average' },
      { abbrev: 'OBP', meaning: 'On-base percentage' },
      { abbrev: 'SLG', meaning: 'Slugging percentage' },
      { abbrev: 'OPS', meaning: 'On-base percentage plus slugging percentage' },
      { abbrev: 'H', meaning: 'Hits' },
      { abbrev: '1B', meaning: 'Singles' },
      { abbrev: '2B', meaning: 'Doubles' },
      { abbrev: '3B', meaning: 'Triples' },
      { abbrev: 'HR', meaning: 'Home runs' },
      { abbrev: 'RBI', meaning: 'Runs batted in' },
      { abbrev: 'R', meaning: 'Runs scored' },
      { abbrev: 'BB', meaning: 'Base on balls (walks)' },
      { abbrev: 'SO', meaning: 'Strikeouts' },
      { abbrev: 'K-L', meaning: 'Strikeouts looking' },
      { abbrev: 'HBP', meaning: 'Hit by pitch' },
      { abbrev: 'SAC', meaning: 'Sacrifice hits & bunts' },
      { abbrev: 'SF', meaning: 'Sacrifice flies' },
      { abbrev: 'ROE', meaning: 'Reached on error' },
      { abbrev: 'FC', meaning: 'Hit into fielder\'s choice' },
      { abbrev: 'SB', meaning: 'Stolen bases' },
      { abbrev: 'SB%', meaning: 'Stolen base percentage' },
      { abbrev: 'CS', meaning: 'Caught stealing' },
      { abbrev: 'PIK', meaning: 'Picked off' },
    ];
  }
  
  if (category === 'batting' && type === 'advanced') {
    return [
      { abbrev: 'QAB', meaning: 'Quality at bats (Any one of: 3 pitches after 2 strikes, 6+ pitch ABs, extra-base hit, hard-hit ball, walk, sac bunt, or sac fly)' },
      { abbrev: 'QAB%', meaning: 'Quality at bats per plate appearance' },
      { abbrev: 'PA/BB', meaning: 'Plate appearances per walk' },
      { abbrev: 'BB/K', meaning: 'Walks per strikeout' },
      { abbrev: 'C%', meaning: 'Contact percentage/Contact rate: (AB - K) / AB' },
      { abbrev: 'HHB', meaning: 'Hard hit balls (Total line drives and hard ground balls)' },
      { abbrev: 'LD%', meaning: 'Line drive percentage' },
      { abbrev: 'FB%', meaning: 'Fly ball percentage' },
      { abbrev: 'GB%', meaning: 'Ground ball percentage' },
      { abbrev: 'BABIP', meaning: 'Batting average on balls in play' },
      { abbrev: 'BA/RISP', meaning: 'Batting average with runners in scoring position' },
      { abbrev: 'LOB', meaning: 'Runners left on base' },
      { abbrev: '2OUTRBI', meaning: '2-out RBI' },
      { abbrev: 'XBH', meaning: 'Extra-base hits' },
      { abbrev: 'TB', meaning: 'Total bases' },
      { abbrev: 'PS', meaning: 'Pitches seen' },
      { abbrev: 'PS/PA', meaning: 'Pitches seen per plate appearance' },
    ];
  }
  
  if (category === 'pitching' && type === 'standard') {
    return [
      { abbrev: 'IP', meaning: 'Innings pitched' },
      { abbrev: 'GP', meaning: 'Games pitched' },
      { abbrev: 'GS', meaning: 'Games started' },
      { abbrev: 'BF', meaning: 'Total batters faced' },
      { abbrev: '#P', meaning: 'Total pitches' },
      { abbrev: 'W', meaning: 'Wins' },
      { abbrev: 'L', meaning: 'Losses' },
      { abbrev: 'SV', meaning: 'Saves' },
      { abbrev: 'ERA', meaning: 'Earned run average' },
      { abbrev: 'WHIP', meaning: 'Walks plus hits per innings pitched' },
      { abbrev: 'H', meaning: 'Hits allowed' },
      { abbrev: 'R', meaning: 'Runs allowed' },
      { abbrev: 'ER', meaning: 'Earned runs allowed' },
      { abbrev: 'BB', meaning: 'Base on balls (walks)' },
      { abbrev: 'SO', meaning: 'Strikeouts' },
      { abbrev: 'BAA', meaning: 'Opponent batting average' },
    ];
  }
  
  if (category === 'pitching' && type === 'advanced') {
    return [
      { abbrev: 'P/IP', meaning: 'Pitches per inning' },
      { abbrev: 'P/BF', meaning: 'Pitches per batter faced' },
      { abbrev: 'FIP', meaning: 'Fielding Independent Pitching' },
      { abbrev: 'S%', meaning: 'Strike percentage' },
      { abbrev: 'K/BB', meaning: 'Strikeouts per walk' },
      { abbrev: 'BABIP', meaning: 'Opponent batting average on balls in play' },
    ];
  }
  
  if (category === 'fielding' && type === 'standard') {
    return [
      { abbrev: 'TC', meaning: 'Total Chances' },
      { abbrev: 'A', meaning: 'Assists' },
      { abbrev: 'PO', meaning: 'Putouts' },
      { abbrev: 'FPCT', meaning: 'Fielding Percentage' },
      { abbrev: 'E', meaning: 'Errors' },
      { abbrev: 'DP', meaning: 'Double Plays' },
      { abbrev: 'TP', meaning: 'Triple Plays' },
    ];
  }
  
  if (category === 'fielding' && type === 'catching') {
    return [
      { abbrev: 'INN', meaning: 'Innings played as catcher' },
      { abbrev: 'PB', meaning: 'Passed balls allowed' },
      { abbrev: 'SB', meaning: 'Stolen bases allowed' },
      { abbrev: 'SB-ATT', meaning: 'Stolen bases - Stealing attempts' },
      { abbrev: 'CS', meaning: 'Runners caught stealing' },
      { abbrev: 'CS%', meaning: 'Runners caught stealing percentage' },
      { abbrev: 'PIK', meaning: 'Runners picked off' },
      { abbrev: 'CI', meaning: 'Batter advances on catcher\'s interference' },
    ];
  }
  
  // Default to batting standard
  return [
    { abbrev: 'G', meaning: 'Games played' },
    { abbrev: 'PA', meaning: 'Plate appearances' },
    { abbrev: 'AB', meaning: 'At bats' },
  ];
};

// Statistics Legend Component
const StatsLegend = ({ category, type }: { category: string; type: string }) => {
  const statsLegend = getStatsLegend(category, type);
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {category.charAt(0).toUpperCase() + category.slice(1)} - {type.charAt(0).toUpperCase() + type.slice(1)} Statistics Abbreviations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-2">
        {statsLegend.map((stat) => (
          <div key={stat.abbrev} className="flex items-start">
            <span className="font-medium text-gray-900 min-w-fit whitespace-nowrap">{stat.abbrev}:</span>
            <span className="text-gray-600 text-sm ml-2">{stat.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SeasonStatsPage() {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStatsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'batting' | 'pitching' | 'fielding'>('batting');
  const [activeType, setActiveType] = useState<'standard' | 'advanced' | 'catching'>('standard');

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

  // Percentage formatter for SB%
  const percentageFormatter = (params: any) => {
    if (params.value === undefined || params.value === null || isNaN(params.value)) return '0.000';
    return (params.value * 100).toFixed(1) + '%';
  };

  // Helper function to get column definitions based on active category and type
  const getColumnDefs = useMemo(() => {
    const basePlayerColumn: ColDef = {
      headerName: 'Player',
      field: 'playerName',
      pinned: 'left',
      minWidth: 180,
      flex: 2,
      cellRenderer: PlayerNameCellRenderer,
      valueGetter: (params) => `${params.data.first_name || ''} ${params.data.last_name || ''}`.trim(),
    };

    if (activeCategory === 'batting' && activeType === 'standard') {
      return [
        basePlayerColumn,
        { headerName: 'G', field: 'gp', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.general?.gp || params.data.offense?.gp, valueFormatter: integerFormatter },
        { headerName: 'PA', field: 'pa', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.pa, valueFormatter: integerFormatter },
        { headerName: 'AB', field: 'ab', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ab, valueFormatter: integerFormatter },
        { headerName: 'AVG', field: 'avg', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.avg, valueFormatter: decimalFormatter, sort: 'desc' },
        { headerName: 'OBP', field: 'obp', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.obp, valueFormatter: decimalFormatter },
        { headerName: 'SLG', field: 'slg', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.slg, valueFormatter: decimalFormatter },
        { headerName: 'OPS', field: 'ops', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ops, valueFormatter: decimalFormatter },
        { headerName: 'H', field: 'h', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.h, valueFormatter: integerFormatter },
        { headerName: '1B', field: '1B', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["1B"], valueFormatter: integerFormatter },
        { headerName: '2B', field: '2B', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["2B"], valueFormatter: integerFormatter },
        { headerName: '3B', field: '3B', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["3B"], valueFormatter: integerFormatter },
        { headerName: 'HR', field: 'hr', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.hr, valueFormatter: integerFormatter },
        { headerName: 'RBI', field: 'rbi', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.rbi, valueFormatter: integerFormatter },
        { headerName: 'R', field: 'r', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.r, valueFormatter: integerFormatter },
        { headerName: 'BB', field: 'bb', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.bb, valueFormatter: integerFormatter },
        { headerName: 'SO', field: 'so', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.so, valueFormatter: integerFormatter },
        { headerName: 'K-L', field: 'kl', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.["K-L"], valueFormatter: integerFormatter },
        { headerName: 'HBP', field: 'hbp', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.hbp, valueFormatter: integerFormatter },
        { headerName: 'SAC', field: 'sac', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.shb, valueFormatter: integerFormatter },
        { headerName: 'SF', field: 'sf', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.shf, valueFormatter: integerFormatter },
        { headerName: 'ROE', field: 'roe', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.roe, valueFormatter: integerFormatter },
        { headerName: 'FC', field: 'fc', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.fc, valueFormatter: integerFormatter },
        { headerName: 'SB', field: 'sb', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.sb, valueFormatter: integerFormatter },
        { headerName: 'SB%', field: 'sb_pct', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const sb = params.data.offense?.sb || 0;
          const cs = params.data.offense?.cs || 0;
          const attempts = sb + cs;
          return attempts > 0 ? sb / attempts : 0;
        }, valueFormatter: percentageFormatter },
        { headerName: 'CS', field: 'cs', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.cs, valueFormatter: integerFormatter },
        { headerName: 'PIK', field: 'pik', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.pik || params.data.offense?.picked_off || 0, valueFormatter: integerFormatter },
      ];
    }

    if (activeCategory === 'batting' && activeType === 'advanced') {
      return [
        basePlayerColumn,
        { headerName: 'QAB', field: 'qab', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.qab, valueFormatter: integerFormatter },
        { headerName: 'QAB%', field: 'qab_pct', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const qab = params.data.offense?.qab || 0;
          const pa = params.data.offense?.pa || 0;
          return pa > 0 ? qab / pa : 0;
        }, valueFormatter: decimalFormatter },
        { headerName: 'PA/BB', field: 'pa_bb', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const pa = params.data.offense?.pa || 0;
          const bb = params.data.offense?.bb || 0;
          return bb > 0 ? pa / bb : 0;
        }, valueFormatter: decimalFormatter },
        { headerName: 'BB/K', field: 'bb_k', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const bb = params.data.offense?.bb || 0;
          const so = params.data.offense?.so || 0;
          return so > 0 ? bb / so : 0;
        }, valueFormatter: decimalFormatter },
        { headerName: 'C%', field: 'contact_pct', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const ab = params.data.offense?.ab || 0;
          const so = params.data.offense?.so || 0;
          return ab > 0 ? (ab - so) / ab : 0;
        }, valueFormatter: percentageFormatter },
        { headerName: 'HHB', field: 'hhb', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.hhb, valueFormatter: integerFormatter },
        { headerName: 'LD%', field: 'ld_pct', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ld_pct, valueFormatter: percentageFormatter },
        { headerName: 'FB%', field: 'fb_pct', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.fb_pct, valueFormatter: percentageFormatter },
        { headerName: 'GB%', field: 'gb_pct', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.gb_pct, valueFormatter: percentageFormatter },
        { headerName: 'BABIP', field: 'babip', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.babip, valueFormatter: decimalFormatter },
        { headerName: 'BA/RISP', field: 'ba_risp', minWidth: 70, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ba_risp, valueFormatter: decimalFormatter },
        { headerName: 'LOB', field: 'lob', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.lob, valueFormatter: integerFormatter },
        { headerName: '2OUTRBI', field: 'two_out_rbi', minWidth: 80, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.two_out_rbi, valueFormatter: integerFormatter },
        { headerName: 'XBH', field: 'xbh', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const doubles = params.data.offense?.["2B"] || 0;
          const triples = params.data.offense?.["3B"] || 0;
          const hr = params.data.offense?.hr || 0;
          return doubles + triples + hr;
        }, valueFormatter: integerFormatter },
        { headerName: 'TB', field: 'tb', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.tb, valueFormatter: integerFormatter },
        { headerName: 'PS', field: 'ps', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.offense?.ps, valueFormatter: integerFormatter },
        { headerName: 'PS/PA', field: 'ps_pa', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const ps = params.data.offense?.ps || 0;
          const pa = params.data.offense?.pa || 0;
          return pa > 0 ? ps / pa : 0;
        }, valueFormatter: decimalFormatter },
      ];
    }

    if (activeCategory === 'pitching' && activeType === 'standard') {
      return [
        basePlayerColumn,
        { headerName: 'IP', field: 'ip', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.ip, valueFormatter: decimalFormatter },
        { headerName: 'GP', field: 'gp', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.gp || params.data.general?.gp, valueFormatter: integerFormatter },
        { headerName: 'GS', field: 'gs', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.gs, valueFormatter: integerFormatter },
        { headerName: 'BF', field: 'bf', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.bf, valueFormatter: integerFormatter },
        { headerName: '#P', field: 'pitches', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.pitches, valueFormatter: integerFormatter },
        { headerName: 'W', field: 'w', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.w, valueFormatter: integerFormatter },
        { headerName: 'L', field: 'l', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.l, valueFormatter: integerFormatter },
        { headerName: 'SV', field: 'sv', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.sv, valueFormatter: integerFormatter },
        { headerName: 'ERA', field: 'era', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.era, valueFormatter: decimalFormatter, sort: 'asc' },
        { headerName: 'WHIP', field: 'whip', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.whip, valueFormatter: decimalFormatter },
        { headerName: 'H', field: 'h_allowed', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.h, valueFormatter: integerFormatter },
        { headerName: 'R', field: 'r_allowed', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.r, valueFormatter: integerFormatter },
        { headerName: 'ER', field: 'er', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.er, valueFormatter: integerFormatter },
        { headerName: 'BB', field: 'bb_allowed', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.bb, valueFormatter: integerFormatter },
        { headerName: 'SO', field: 'so_pitched', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.so, valueFormatter: integerFormatter },
        { headerName: 'BAA', field: 'baa', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.baa, valueFormatter: decimalFormatter },
      ];
    }

    if (activeCategory === 'pitching' && activeType === 'advanced') {
      return [
        basePlayerColumn,
        { headerName: 'P/IP', field: 'p_ip', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const pitches = params.data.pitching?.pitches || 0;
          const ip = params.data.pitching?.ip || 0;
          return ip > 0 ? pitches / ip : 0;
        }, valueFormatter: decimalFormatter },
        { headerName: 'P/BF', field: 'p_bf', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const pitches = params.data.pitching?.pitches || 0;
          const bf = params.data.pitching?.bf || 0;
          return bf > 0 ? pitches / bf : 0;
        }, valueFormatter: decimalFormatter },
        { headerName: 'FIP', field: 'fip', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.fip, valueFormatter: decimalFormatter },
        { headerName: 'S%', field: 'strike_pct', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.strike_pct, valueFormatter: percentageFormatter },
        { headerName: 'K/BB', field: 'k_bb', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const so = params.data.pitching?.so || 0;
          const bb = params.data.pitching?.bb || 0;
          return bb > 0 ? so / bb : 0;
        }, valueFormatter: decimalFormatter },
        { headerName: 'BABIP', field: 'babip_against', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.pitching?.babip, valueFormatter: decimalFormatter },
      ];
    }

    if (activeCategory === 'fielding' && activeType === 'standard') {
      return [
        basePlayerColumn,
        { headerName: 'TC', field: 'tc', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const assists = params.data.defense?.a || 0;
          const putouts = params.data.defense?.po || 0;
          const errors = params.data.defense?.e || 0;
          return assists + putouts + errors;
        }, valueFormatter: integerFormatter },
        { headerName: 'A', field: 'a', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.a, valueFormatter: integerFormatter },
        { headerName: 'PO', field: 'po', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.po, valueFormatter: integerFormatter },
        { headerName: 'FPCT', field: 'fpct', minWidth: 60, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const assists = params.data.defense?.a || 0;
          const putouts = params.data.defense?.po || 0;
          const errors = params.data.defense?.e || 0;
          const chances = assists + putouts + errors;
          return chances > 0 ? (assists + putouts) / chances : 1.000;
        }, valueFormatter: decimalFormatter },
        { headerName: 'E', field: 'e', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.e, valueFormatter: integerFormatter },
        { headerName: 'DP', field: 'dp', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.dp, valueFormatter: integerFormatter },
        { headerName: 'TP', field: 'tp', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.tp, valueFormatter: integerFormatter },
      ];
    }

    if (activeCategory === 'fielding' && activeType === 'catching') {
      return [
        basePlayerColumn,
        { headerName: 'INN', field: 'inn_caught', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.inn_caught, valueFormatter: decimalFormatter },
        { headerName: 'PB', field: 'pb', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.pb, valueFormatter: integerFormatter },
        { headerName: 'SB', field: 'sb_allowed_catcher', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.sb_allowed, valueFormatter: integerFormatter },
        { headerName: 'SB-ATT', field: 'sb_att_catcher', minWidth: 70, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const sb = params.data.defense?.sb_allowed || 0;
          const cs = params.data.defense?.cs_by_catcher || 0;
          return sb + cs;
        }, valueFormatter: integerFormatter },
        { headerName: 'CS', field: 'cs_by_catcher', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.cs_by_catcher, valueFormatter: integerFormatter },
        { headerName: 'CS%', field: 'cs_pct_catcher', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => {
          const cs = params.data.defense?.cs_by_catcher || 0;
          const sb = params.data.defense?.sb_allowed || 0;
          const attempts = sb + cs;
          return attempts > 0 ? cs / attempts : 0;
        }, valueFormatter: percentageFormatter },
        { headerName: 'PIK', field: 'pik_catcher', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.pik_catcher, valueFormatter: integerFormatter },
        { headerName: 'CI', field: 'ci', minWidth: 45, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.defense?.ci, valueFormatter: integerFormatter },
      ];
    }

    // Default to batting standard if no match
    return [
      basePlayerColumn,
      { headerName: 'G', field: 'gp', minWidth: 50, flex: 1, cellStyle: {textAlign: 'center'}, valueGetter: (params) => params.data.general?.gp || params.data.offense?.gp, valueFormatter: integerFormatter },
    ];
  }, [activeCategory, activeType]);

  // AG Grid column definitions based on active category and type
  const columnDefs: ColDef[] = getColumnDefs;

  // AG Grid default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: false,
    resizable: true,
    suppressMenu: true,
    flex: 1,
    minWidth: 45,
  }), []);

  // AG Grid options
  const gridOptions = useMemo(() => ({
    theme: 'legacy', // Use legacy theming to work with CSS files
    headerHeight: 40,
    rowHeight: 44,
    suppressRowClickSelection: true,
    suppressRowSelection: true,
    suppressCellFocus: true,
    suppressHorizontalScroll: false,
    alwaysShowHorizontalScroll: true,
    suppressColumnMoveAnimation: true,
    animateRows: false,
    enableRangeSelection: false,
    maintainColumnOrder: true,
    domLayout: 'normal',
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
        activeTab="stats" 
      />

      {/* Season Stats Header Section */}
      <div className="bg-white shadow rounded-lg mb-2">
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

        {/* Stats Navigation - Two Tier System */}
        <div className="px-6 py-2">
          {/* Tier 1: Category Selection */}
          <nav className="flex space-x-1 mb-4">
            {[
              { id: 'batting', label: 'Batting' },
              { id: 'pitching', label: 'Pitching' },
              { id: 'fielding', label: 'Fielding' },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id as 'batting' | 'pitching' | 'fielding');
                  // Reset to standard when switching categories, except for fielding which defaults to standard
                  if (category.id !== 'fielding') {
                    setActiveType('standard');
                  }
                }}
                className={`py-2 px-4 text-sm font-medium rounded-full transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>

          {/* Tier 2: Type Selection */}
          <nav className="flex space-x-6">
            {[
              { id: 'standard', label: 'Standard' },
              { id: 'advanced', label: 'Advanced' },
              ...(activeCategory === 'fielding' ? [{ id: 'catching', label: 'Catching' }] : []),
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id as 'standard' | 'advanced' | 'catching')}
                className={`py-2 px-1 text-sm font-medium transition-colors border-b-2 ${
                  activeType === type.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Full-Screen Statistics Table */}
      {getPlayersWithStats().length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-8">
            <div className="text-gray-500">No season statistics available for this team.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 400px)', width: '100%' }}>
              <AgGridReact
                columnDefs={columnDefs}
                rowData={getPlayersWithStats()}
                defaultColDef={defaultColDef}
                gridOptions={gridOptions}
                suppressRowTransform={true}
                getRowId={(params) => params.data.id}
              />
            </div>
          </div>
          
          {/* Statistics Legend */}
          <StatsLegend category={activeCategory} type={activeType} />
        </>
      )}
    </FullWidthNavBar>
  );
}