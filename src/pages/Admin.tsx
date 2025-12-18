import { useState } from 'react';
import { Shield, Users, FileText, RefreshCw, UserCheck, Handshake, Target, Settings, Bot, Mail } from 'lucide-react';
import { useIsAdmin, useAdminUsers, useAdminStats, useAdminPlans, useAdminMentors, useAdminPartners, useAdminTemplates } from '../hooks/useAdmin';
import AdminStats from '../components/admin/AdminStats';
import UserTable from '../components/admin/UserTable';
import PlanTable from '../components/admin/PlanTable';
import MentorTable from '../components/admin/MentorTable';
import PartnerTable from '../components/admin/PartnerTable';
import TemplateTable from '../components/admin/TemplateTable';
import SettingsPanel from '../components/admin/SettingsPanel';
import AIPromptsPanel from '../components/admin/AIPromptsPanel';
import EmailTemplatesPanel from '../components/admin/EmailTemplatesPanel';
import LoadingSpinner from '../components/shared/LoadingSpinner';

type TabType = 'overview' | 'users' | 'plans' | 'mentors' | 'partners' | 'templates' | 'ai-prompts' | 'email-templates' | 'settings';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { isSuperAdmin } = useIsAdmin();
  const { stats, isLoading: statsLoading, error: statsError, refresh: refreshStats } = useAdminStats();
  const { users, isLoading: usersLoading, error: usersError, refresh: refreshUsers, changeRole, changeResumeLimit, editUser, removeUser } = useAdminUsers();
  const { plans, isLoading: plansLoading, error: plansError, refresh: refreshPlans } = useAdminPlans();
  const { mentors, invitations, isLoading: mentorsLoading, error: mentorsError, refresh: refreshMentors } = useAdminMentors();
  const { partners, isLoading: partnersLoading, error: partnersError, refresh: refreshPartners } = useAdminPartners();
  const { templates, isLoading: templatesLoading, error: templatesError, refresh: refreshTemplates, create: createTemplate, update: updateTemplate, remove: removeTemplate, duplicate: duplicateTemplate } = useAdminTemplates();

  const handleRefresh = () => {
    refreshStats();
    refreshUsers();
    refreshPlans();
    refreshMentors();
    refreshPartners();
    refreshTemplates();
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Shield },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'plans' as TabType, label: 'Plans', icon: FileText },
    { id: 'templates' as TabType, label: 'Templates', icon: Target },
    { id: 'mentors' as TabType, label: 'Mentors', icon: UserCheck },
    { id: 'partners' as TabType, label: 'Accountability Partners', icon: Handshake },
    { id: 'ai-prompts' as TabType, label: 'AI Prompts', icon: Bot },
    { id: 'email-templates' as TabType, label: 'Email Templates', icon: Mail },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
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
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
                onLimitChange={changeResumeLimit}
                onEditUser={editUser}
                onDeleteUser={removeUser}
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

        {activeTab === 'mentors' && (
          <>
            {mentorsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : mentorsError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error loading mentors: {mentorsError}
              </div>
            ) : (
              <MentorTable mentors={mentors} invitations={invitations} />
            )}
          </>
        )}

        {activeTab === 'partners' && (
          <>
            {partnersLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : partnersError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error loading partners: {partnersError}
              </div>
            ) : (
              <PartnerTable partners={partners} />
            )}
          </>
        )}

        {activeTab === 'templates' && (
          <>
            {templatesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : templatesError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                Error loading templates: {templatesError}
              </div>
            ) : (
              <TemplateTable
                templates={templates}
                onCreate={createTemplate}
                onUpdate={updateTemplate}
                onDelete={removeTemplate}
                onDuplicate={duplicateTemplate}
              />
            )}
          </>
        )}

        {activeTab === 'ai-prompts' && <AIPromptsPanel />}

        {activeTab === 'email-templates' && <EmailTemplatesPanel />}

        {activeTab === 'settings' && (
          <SettingsPanel isSuperAdmin={isSuperAdmin} />
        )}
      </div>
    </div>
  );
}
