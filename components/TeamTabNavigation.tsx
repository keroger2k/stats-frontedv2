"use client";

import Link from "next/link";

interface TeamTabNavigationProps {
  teamId: string;
  activeTab: 'schedule' | 'team' | 'stats' | 'pitchsmart' | 'users';
}

export default function TeamTabNavigation({ teamId, activeTab }: TeamTabNavigationProps) {
  const tabs = [
    { id: 'schedule', label: 'SCHEDULE', href: `/teams/${teamId}/schedule` },
    { id: 'team', label: 'TEAM', href: `/teams/${teamId}/team-info` },
    { id: 'stats', label: 'STATS', href: `/teams/${teamId}/season-stats` },
    { id: 'pitchsmart', label: 'PITCHSMART', href: `/teams/${teamId}/pitch-smart` },
    { id: 'users', label: 'USERS', href: `/teams/${teamId}/users` },
  ];

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}