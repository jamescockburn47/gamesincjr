'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Game } from '@/lib/games';
import MagicFriendsTab from './MagicFriendsTab';
import GameSubmissionsList from './GameSubmissionsList';

interface AdminDashboardProps {
  games: Game[];
}

export default function AdminDashboard({ games }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const stats = {
    totalGames: games.length,
    activeGames: games.filter(g => g.status !== 'coming-soon').length,
    totalRevenue: games.reduce((sum, g) => sum + (g.price || 0), 0),
    aiGames: games.filter(g => g.gameType === 'ai-powered').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'games', label: 'Games' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'payments', label: 'Payments' },
              { id: 'magic-friends', label: 'Magic Friends' },
              { id: 'submissions', label: 'Submissions' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                <div className="text-sm text-gray-600">Total Games</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{stats.activeGames}</div>
                <div className="text-sm text-gray-600">Active Games</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-purple-600">£{stats.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-orange-600">{stats.aiGames}</div>
                <div className="text-sm text-gray-600">AI Games</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Space Runner demo played</span>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">New game added to catalog</span>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Payment processed</span>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Game Management</h2>
              <Button>Add New Game</Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {games.map((game) => (
                    <tr key={game.slug}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gray-200 rounded"></div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{game.title}</div>
                            <div className="text-sm text-gray-500">{game.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {game.gameType || 'html5'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {game.price ? `£${game.price}` : 'Free'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${game.status === 'coming-soon'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                          }`}>
                          {game.status || 'released'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Game Performance</h3>
                <div className="space-y-3">
                  {games.map((game) => (
                    <div key={game.slug} className="flex items-center justify-between">
                      <span className="text-sm">{game.title}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.random() * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{Math.floor(Math.random() * 1000)} plays</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Today</span>
                    <span className="text-sm font-medium">£{Math.floor(Math.random() * 50)}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="text-sm font-medium">£{Math.floor(Math.random() * 200)}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="text-sm font-medium">£{Math.floor(Math.random() * 1000)}.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Payment Management</h2>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium">Space Runner Purchase</div>
                    <div className="text-xs text-gray-500">User: player123</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">£2.99</div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium">AI Game Credits</div>
                    <div className="text-xs text-gray-500">User: gamer456</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">£5.00</div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'magic-friends' && <MagicFriendsTab />}

        {activeTab === 'submissions' && <GameSubmissionsList embedded={true} />}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">System Settings</h2>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stripe Secret Key
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_..."
                  />
                </div>
                <Button>Save Settings</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
