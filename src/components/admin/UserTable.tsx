import { useState } from 'react';
import { Search, ChevronDown, FileText, Building2, Target, File, Sparkles, Pencil, Trash2, X, AlertTriangle, KeyRound, Check } from 'lucide-react';
import type { UserWithStats, UserRole, UserEditData } from '../../services/admin.service';
import MultiRoleSelector from './MultiRoleSelector';
import LimitEditor from './LimitEditor';

interface UserTableProps {
  users: UserWithStats[];
  onRoleChange: (userId: string, role: UserRole) => Promise<void>;
  onRolesChange: (userId: string, roles: UserRole[]) => Promise<void>;
  onLimitChange: (userId: string, limit: number) => Promise<void>;
  onEditUser: (userId: string, data: UserEditData) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSendPasswordReset: (email: string) => Promise<void>;
  isSuperAdmin: boolean;
}

interface EditModalState {
  isOpen: boolean;
  user: UserWithStats | null;
}

interface DeleteModalState {
  isOpen: boolean;
  user: UserWithStats | null;
}

interface PasswordResetState {
  userId: string | null;
  status: 'idle' | 'sending' | 'sent' | 'error';
  error?: string;
}

export default function UserTable({ users, onRoleChange: _onRoleChange, onRolesChange, onLimitChange, onEditUser, onDeleteUser, onSendPasswordReset, isSuperAdmin }: UserTableProps) {
  // Note: onRoleChange kept for backward compatibility but replaced by onRolesChange
  void _onRoleChange;
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'email' | 'full_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false, user: null });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, user: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<UserEditData>({});
  const [passwordResetState, setPasswordResetState] = useState<PasswordResetState>({ userId: null, status: 'idle' });

  const handleSendPasswordReset = async (user: UserWithStats) => {
    setPasswordResetState({ userId: user.id, status: 'sending' });
    try {
      await onSendPasswordReset(user.email);
      setPasswordResetState({ userId: user.id, status: 'sent' });
      // Reset after 3 seconds
      setTimeout(() => {
        setPasswordResetState({ userId: null, status: 'idle' });
      }, 3000);
    } catch (error) {
      setPasswordResetState({
        userId: user.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to send reset email',
      });
      // Reset after 3 seconds
      setTimeout(() => {
        setPasswordResetState({ userId: null, status: 'idle' });
      }, 3000);
    }
  };

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

  const openEditModal = (user: UserWithStats) => {
    setEditFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      resume_analysis_limit: user.resume_analysis_limit,
    });
    setEditModal({ isOpen: true, user });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, user: null });
    setEditFormData({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.user) return;

    setIsSubmitting(true);
    try {
      await onEditUser(editModal.user.id, editFormData);
      closeEditModal();
    } catch (error) {
      console.error('Failed to edit user:', error);
      alert(error instanceof Error ? error.message : 'Failed to edit user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (user: UserWithStats) => {
    setDeleteModal({ isOpen: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;

    setIsSubmitting(true);
    try {
      await onDeleteUser(deleteModal.user.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
                  Roles
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    AI Limit
                  </div>
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
                    {isSuperAdmin ? (
                      <MultiRoleSelector
                        currentRoles={user.roles || [user.role]}
                        userId={user.id}
                        onRolesChange={onRolesChange}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || [user.role]).map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(role)}`}
                          >
                            {role.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
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
                  <td className="px-4 py-4">
                    <LimitEditor
                      userId={user.id}
                      currentLimit={user.resume_analysis_limit}
                      onLimitChange={onLimitChange}
                    />
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendPasswordReset(user)}
                          disabled={passwordResetState.userId === user.id && passwordResetState.status === 'sending'}
                          className={`p-2 rounded-lg transition-colors ${
                            passwordResetState.userId === user.id && passwordResetState.status === 'sent'
                              ? 'text-green-600 bg-green-50'
                              : passwordResetState.userId === user.id && passwordResetState.status === 'error'
                              ? 'text-red-600 bg-red-50'
                              : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={
                            passwordResetState.userId === user.id && passwordResetState.status === 'sent'
                              ? 'Reset email sent!'
                              : passwordResetState.userId === user.id && passwordResetState.status === 'error'
                              ? passwordResetState.error
                              : 'Send password reset email'
                          }
                        >
                          {passwordResetState.userId === user.id && passwordResetState.status === 'sending' ? (
                            <div className="h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          ) : passwordResetState.userId === user.id && passwordResetState.status === 'sent' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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

      {/* Edit User Modal */}
      {editModal.isOpen && editModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeEditModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-gray-900">Edit User</h2>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editFormData.role || 'job_seeker'}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="job_seeker">Job Seeker</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume Analysis Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.resume_analysis_limit || 2}
                  onChange={(e) => setEditFormData({ ...editFormData, resume_analysis_limit: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-gray-900">Delete User</h2>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-medium text-gray-900">{deleteModal.user.full_name || 'No name'}</p>
              <p className="text-sm text-gray-500">{deleteModal.user.email}</p>
              <div className="mt-2 text-sm text-gray-600">
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside mt-1 text-gray-500">
                  <li>{deleteModal.user.plan_count} plans</li>
                  <li>{deleteModal.user.resume_count} resume analyses</li>
                  <li>{deleteModal.user.company_count} companies</li>
                  <li>{deleteModal.user.canvas_count} career canvas entries</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
