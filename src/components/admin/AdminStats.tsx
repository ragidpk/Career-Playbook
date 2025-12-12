import { Users, FileText, Briefcase, UserPlus, Shield } from 'lucide-react';
import type { AdminStats as AdminStatsType } from '../../services/admin.service';

interface AdminStatsProps {
  stats: AdminStatsType;
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Recent Signups (7d)',
      value: stats.recentSignups,
      icon: UserPlus,
      color: 'bg-green-500',
    },
    {
      label: 'Total Plans',
      value: stats.totalPlans,
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      label: 'Resume Analyses',
      value: stats.totalResumes,
      icon: Briefcase,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow p-6 flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users by Role */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-500" />
          Users by Role
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {stats.usersByRole.job_seeker}
            </p>
            <p className="text-sm text-gray-500">Job Seekers</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">
              {stats.usersByRole.mentor}
            </p>
            <p className="text-sm text-blue-600">Mentors</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">
              {stats.usersByRole.admin}
            </p>
            <p className="text-sm text-purple-600">Admins</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">
              {stats.usersByRole.super_admin}
            </p>
            <p className="text-sm text-amber-600">Super Admins</p>
          </div>
        </div>
      </div>
    </div>
  );
}
