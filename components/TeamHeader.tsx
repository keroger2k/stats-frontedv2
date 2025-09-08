"use client";

import Image from "next/image";
import { Team, teamUtils } from "@/lib/stats-api";

interface TeamHeaderProps {
  team: Team;
  onRefresh?: () => void;
  onDelete?: () => void;
}

export default function TeamHeader({ team, onRefresh, onDelete }: TeamHeaderProps) {
  return (
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
                <button 
                  onClick={onRefresh}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Refresh
                </button>
                <button 
                  onClick={onDelete}
                  className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
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
  );
}