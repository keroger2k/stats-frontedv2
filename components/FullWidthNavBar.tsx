"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

interface FullWidthNavBarProps {
  children?: React.ReactNode;
}

export default function FullWidthNavBar({ children }: FullWidthNavBarProps) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
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

      {/* Page Content - Full Width */}
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}