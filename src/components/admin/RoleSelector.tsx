import { useState } from 'react';
import type { UserRole } from '../../services/admin.service';

interface RoleSelectorProps {
  currentRole: UserRole;
  userId: string;
  onRoleChange: (userId: string, role: UserRole) => Promise<void>;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'job_seeker', label: 'Job Seeker' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function RoleSelector({ currentRole, userId, onRoleChange }: RoleSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    if (newRole === currentRole) return;

    setIsLoading(true);
    setError(null);

    try {
      await onRoleChange(userId, newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={isLoading}
        className={`px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
        } ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        {ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
