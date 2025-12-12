import { useState } from 'react';
import { Search, ChevronDown, FileText, Building2, Target, File } from 'lucide-react';
import type { UserWithStats, UserRole } from '../../services/admin.service';
import RoleSelector from './RoleSelector';

interface UserTableProps {
  users: UserWithStats[];
  onRoleChange: (userId: string, role: UserRole) => Promise<void>;
  isSuperAdmin: boolean;
}

export default function UserTable({ users, onRoleChange, isSuperAdmin }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'email' | 'full_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === 'full_name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '');
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

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-amber-100 text-amber-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'mentor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Roles</option>
          <option value="job_seeker">Job Seekers</option>
          <option value="mentor">Mentors</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('full_name')}
              >
                <div className="flex items-center gap-1">
                  User
                  {sortBy === 'full_name' && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        sortOrder === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Joined
                  {sortBy === 'created_at' && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        sortOrder === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.full_name || 'No name'}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1" title="Plans">
                      <FileText className="h-4 w-4" />
                      {user.plan_count}
                    </span>
                    <span className="flex items-center gap-1" title="Resumes">
                      <File className="h-4 w-4" />
                      {user.resume_count}
                    </span>
                    <span className="flex items-center gap-1" title="Companies">
                      <Building2 className="h-4 w-4" />
                      {user.company_count}
                    </span>
                    <span className="flex items-center gap-1" title="Canvas">
                      <Target className="h-4 w-4" />
                      {user.canvas_count}
                    </span>
                  </div>
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-4">
                    <RoleSelector
                      currentRole={user.role}
                      userId={user.id}
                      onRoleChange={onRoleChange}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No users found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
