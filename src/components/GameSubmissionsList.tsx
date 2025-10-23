'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Submission {
  id: string;
  status: string;
  gameTitle: string;
  gameSlug: string;
  creatorName: string;
  creatorEmail: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  reviewNotes: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', badge: '⏳' },
  BUILDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: '🏗️' },
  REVIEW: { bg: 'bg-blue-100', text: 'text-blue-800', badge: '👀' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', badge: '✅' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', badge: '❌' },
  LIVE: { bg: 'bg-purple-100', text: 'text-purple-800', badge: '🚀' },
};

export default function GameSubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== 'all') params.append('status', filter);
        if (debouncedSearch) params.append('search', debouncedSearch);

        const response = await fetch(`/api/admin/games/list?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setSubmissions(data.submissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(interval);
  }, [filter, debouncedSearch]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const statuses = ['all', 'PENDING', 'BUILDING', 'REVIEW', 'APPROVED', 'REJECTED', 'LIVE'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game Submissions</h1>
              <p className="text-sm text-gray-600 mt-1">Manage user-generated game submissions</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filter by Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, email, or creator name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => {
                    const colors = STATUS_COLORS[submission.status] || STATUS_COLORS.PENDING;
                    const createdDate = new Date(submission.createdAt).toLocaleDateString();

                    return (
                      <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors.bg} ${colors.text}`}>
                            {colors.badge} {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{submission.gameTitle}</div>
                          <div className="text-xs text-gray-500">{submission.gameSlug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{submission.creatorName}</div>
                          <div className="text-xs text-gray-500">{submission.creatorEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {createdDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/game-submissions/${submission.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
