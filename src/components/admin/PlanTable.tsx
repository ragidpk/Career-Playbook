import { useState } from 'react';
import { Search, ChevronDown, Calendar, CheckCircle } from 'lucide-react';
import type { PlanWithUser } from '../../services/admin.service';

interface PlanTableProps {
  plans: PlanWithUser[];
}

export default function PlanTable({ plans }: PlanTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'user_email' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort plans
  const filteredPlans = plans
    .filter((plan) => {
      const matchesSearch =
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'user_email') {
        comparison = a.user_email.localeCompare(b.user_email);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressPercent = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search plans or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
        Showing {filteredPlans.length} of {plans.length} plans
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Plan Title
                  {sortBy === 'title' && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        sortOrder === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('user_email')}
              >
                <div className="flex items-center gap-1">
                  User
                  {sortBy === 'user_email' && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        sortOrder === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Created
                  {sortBy === 'created_at' && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        sortOrder === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPlans.map((plan) => {
              const progress = getProgressPercent(plan.completed_milestones, plan.milestone_count);
              return (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{plan.title}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {plan.user_name || 'No name'}
                      </p>
                      <p className="text-sm text-gray-500">{plan.user_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px]">
                        <div
                          className="h-2 bg-primary-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {plan.completed_milestones}/{plan.milestone_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatDate(plan.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredPlans.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No plans found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
