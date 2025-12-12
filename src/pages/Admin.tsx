import { useState } from 'react';
import { Shield, Users, FileText, RefreshCw } from 'lucide-react';
import { useIsAdmin, useAdminUsers, useAdminStats, useAdminPlans } from '../hooks/useAdmin';
import AdminStats from '../components/admin/AdminStats';
import UserTable from '../components/admin/UserTable';
import PlanTable from '../components/admin/PlanTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';

type TabType = 'overview' | 'users' | 'plans';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { isSuperAdmin } = useIsAdmin();
  const { stats, isLoading: statsLoading, error: statsError, refresh: refreshStats } = useAdminStats();
  const { users, isLoading: usersLoading, error: usersError, refresh: refreshUsers, changeRole } = useAdminUsers();
  const { plans, isLoading: plansLoading, error: plansError, refresh: refreshPlans } = useAdminPlans();

  const handleRefresh = () => {
    refreshStats();
    refreshUsers();
    refreshPlans();
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Shield },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'plans' as TabType, label: 'Plans', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage users, view plans, and monitor platform activity.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <>
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : statsError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error loading stats: {statsError}
              </div>
            ) : stats ? (
              <AdminStats stats={stats} />
            ) : null}
          </>
        )}

        {activeTab === 'users' && (
          <>
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : usersError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error loading users: {usersError}
              </div>
            ) : (
              <UserTable
                users={users}
                onRoleChange={changeRole}
                isSuperAdmin={isSuperAdmin}
              />
            )}
          </>
        )}

        {activeTab === 'plans' && (
          <>
            {plansLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : plansError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error loading plans: {plansError}
              </div>
            ) : (
              <PlanTable plans={plans} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
