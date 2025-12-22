import { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import type { UserRole } from '../../services/admin.service';

interface MultiRoleSelectorProps {
  currentRoles: UserRole[];
  userId: string;
  onRolesChange: (userId: string, roles: UserRole[]) => Promise<void>;
}

const ALL_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'job_seeker', label: 'Job Seeker', color: 'bg-gray-100 text-gray-800' },
  { value: 'mentor', label: 'Mentor', color: 'bg-blue-100 text-blue-800' },
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-amber-100 text-amber-800' },
];

export default function MultiRoleSelector({ currentRoles, userId, onRolesChange }: MultiRoleSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(currentRoles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleRole = (role: UserRole) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Don't allow removing last role
        if (prev.length <= 1) return prev;
        return prev.filter(r => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      setError('User must have at least one role');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onRolesChange(userId, selectedRoles);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRoles(currentRoles);
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {currentRoles.map((role) => {
          const roleConfig = ALL_ROLES.find(r => r.value === role);
          return (
            <span
              key={role}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig?.color || 'bg-gray-100 text-gray-800'}`}
            >
              {roleConfig?.label || role.replace('_', ' ')}
            </span>
          );
        })}
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Edit roles"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map((role) => {
          const isSelected = selectedRoles.includes(role.value);
          return (
            <button
              key={role.value}
              onClick={() => handleToggleRole(role.value)}
              disabled={isLoading}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all ${
                isSelected
                  ? `${role.color} border-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {role.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isLoading || selectedRoles.length === 0}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-3 w-3" />
          Save
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}
