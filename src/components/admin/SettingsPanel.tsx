import { useState } from 'react';
import {
  Settings,
  Shield,
  Zap,
  Bell,
  ExternalLink,
  AlertTriangle,
  Check,
  Loader2,
  Database,
  Users,
  FileText,
  Briefcase,
  Building2,
  Brain,
  Mail,
} from 'lucide-react';
import { useAdminSettings, type AppSetting } from '../../hooks/useAdminSettings';
import { useToast } from '../shared/Toast';

interface ToggleSettingProps {
  setting: AppSetting;
  valueKey: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  onUpdate: (key: string, value: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  isSuperAdmin: boolean;
}

function ToggleSetting({ setting, valueKey, label, description, icon: Icon, onUpdate, isSuperAdmin }: ToggleSettingProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const value = setting.value as Record<string, boolean>;
  const isEnabled = value[valueKey] ?? false;

  const handleToggle = async () => {
    if (!isSuperAdmin) {
      showToast('Only super admins can change settings', 'error');
      return;
    }
    setLoading(true);
    const newValue = { ...value, [valueKey]: !isEnabled };
    const result = await onUpdate(setting.key, newValue);
    if (!result.success) {
      showToast(result.error || 'Failed to update', 'error');
    } else {
      showToast('Setting updated', 'success');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading || !isSuperAdmin}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled ? 'bg-primary-500' : 'bg-gray-200'
        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <Loader2 className="absolute left-1/2 -translate-x-1/2 w-4 h-4 text-white animate-spin" />
        ) : (
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        )}
      </button>
    </div>
  );
}

interface NumberSettingProps {
  setting: AppSetting;
  valueKey: string;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  onUpdate: (key: string, value: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  isSuperAdmin: boolean;
}

function NumberSetting({ setting, valueKey, label, description, min = 0, max = 1000, onUpdate, isSuperAdmin }: NumberSettingProps) {
  const [loading, setLoading] = useState(false);
  const [localValue, setLocalValue] = useState<number>((setting.value as Record<string, number>)[valueKey] ?? 0);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!isSuperAdmin) {
      showToast('Only super admins can change settings', 'error');
      return;
    }
    setLoading(true);
    const newValue = { ...setting.value, [valueKey]: localValue };
    const result = await onUpdate(setting.key, newValue as Record<string, unknown>);
    if (!result.success) {
      showToast(result.error || 'Failed to update', 'error');
    } else {
      showToast('Setting updated', 'success');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(parseInt(e.target.value) || 0)}
          min={min}
          max={max}
          disabled={!isSuperAdmin}
          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center disabled:opacity-50"
        />
        <button
          onClick={handleSave}
          disabled={loading || !isSuperAdmin}
          className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  isSuperAdmin: boolean;
}

export default function SettingsPanel({ isSuperAdmin }: SettingsPanelProps) {
  const { settings, isLoading, error, updateSetting, getSettingsByCategory, getSetting } = useAdminSettings();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p className="font-medium">Error loading settings</p>
        <p className="text-sm">{error}</p>
        <p className="text-sm mt-2">
          Make sure the app_settings table exists. Run the migration script first.
        </p>
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Settings table not configured</p>
            <p className="text-sm mt-1">
              Run the migration script to create the app_settings table:
            </p>
            <code className="block mt-2 p-2 bg-amber-100 rounded text-xs">
              node scripts/migration-app-settings.cjs
            </code>
          </div>
        </div>
      </div>
    );
  }

  const categorizedSettings = getSettingsByCategory();
  const maintenanceSetting = getSetting('maintenance_mode');
  const supabaseConfig = getSetting('supabase_config');

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Alert */}
      {maintenanceSetting && (maintenanceSetting.value as { enabled: boolean }).enabled && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Maintenance Mode is ACTIVE</p>
            <p className="text-sm text-amber-600">Users cannot access the application.</p>
          </div>
        </div>
      )}

      {/* Super Admin Notice */}
      {!isSuperAdmin && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            You can view settings but only Super Admins can modify them.
          </p>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </h3>
        </div>
        <div className="px-6">
          {maintenanceSetting && (
            <ToggleSetting
              setting={maintenanceSetting}
              valueKey="enabled"
              label="Maintenance Mode"
              description="Block all user access and show maintenance message"
              icon={AlertTriangle}
              onUpdate={updateSetting}
              isSuperAdmin={isSuperAdmin}
            />
          )}
        </div>
      </div>

      {/* Default Limits */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Default Limits
          </h3>
          <p className="text-sm text-gray-500 mt-1">Default limits for new users</p>
        </div>
        <div className="px-6">
          {categorizedSettings.limits.map((setting) => (
            <NumberSetting
              key={setting.key}
              setting={setting}
              valueKey="value"
              label={setting.key === 'default_resume_limit' ? 'Resume Analysis Limit' : 'Career Plan Limit'}
              description={setting.description || undefined}
              onUpdate={updateSetting}
              isSuperAdmin={isSuperAdmin}
            />
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Feature Toggles
          </h3>
          <p className="text-sm text-gray-500 mt-1">Enable or disable platform features</p>
        </div>
        <div className="px-6">
          {categorizedSettings.features.map((setting) => {
            const iconMap: Record<string, React.ElementType> = {
              feature_ai_milestones: Brain,
              feature_resume_analysis: FileText,
              feature_mentor_matching: Users,
              feature_job_board: Briefcase,
              feature_crm: Building2,
            };
            const labelMap: Record<string, string> = {
              feature_ai_milestones: 'AI Milestone Generation',
              feature_resume_analysis: 'Resume Analysis',
              feature_mentor_matching: 'Mentor Matching',
              feature_job_board: 'Job Board',
              feature_crm: 'Company CRM',
            };
            return (
              <ToggleSetting
                key={setting.key}
                setting={setting}
                valueKey="enabled"
                label={labelMap[setting.key] || setting.key}
                description={setting.description || undefined}
                icon={iconMap[setting.key]}
                onUpdate={updateSetting}
                isSuperAdmin={isSuperAdmin}
              />
            );
          })}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Email Notifications
          </h3>
          <p className="text-sm text-gray-500 mt-1">Configure platform-wide notification settings</p>
        </div>
        <div className="px-6">
          {categorizedSettings.notifications.map((setting) => (
            <div key={setting.key}>
              <ToggleSetting
                setting={setting}
                valueKey="session_reminders"
                label="Session Reminders"
                description="Send email reminders for upcoming mentoring sessions"
                icon={Mail}
                onUpdate={updateSetting}
                isSuperAdmin={isSuperAdmin}
              />
              <ToggleSetting
                setting={setting}
                valueKey="milestone_updates"
                label="Milestone Updates"
                description="Notify users about milestone progress"
                onUpdate={updateSetting}
                isSuperAdmin={isSuperAdmin}
              />
              <ToggleSetting
                setting={setting}
                valueKey="weekly_digest"
                label="Weekly Digest"
                description="Send weekly progress summary emails"
                onUpdate={updateSetting}
                isSuperAdmin={isSuperAdmin}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Supabase Configuration (Read-only Reference) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Authentication Configuration
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            These settings must be changed in the Supabase Dashboard
          </p>
        </div>
        <div className="px-6 py-4">
          {supabaseConfig && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Site URL</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={(supabaseConfig.value as { site_url: string }).site_url || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Redirect URLs</label>
                <div className="mt-1 space-y-2">
                  {((supabaseConfig.value as { redirect_urls: string[] }).redirect_urls || []).map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm"
                      />
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
              <a
                href="https://supabase.com/dashboard/project/rdufwjhptmlpmjmcibpn/auth/url-configuration"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Supabase URL Configuration
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Quick Links
          </h3>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://supabase.com/dashboard/project/rdufwjhptmlpmjmcibpn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Database className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Supabase Dashboard</p>
              <p className="text-xs text-gray-500">Database & Auth</p>
            </div>
          </a>
          <a
            href="https://vercel.com/ragid-kaders-projects/career-playbook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5 text-black" />
            <div>
              <p className="font-medium text-gray-900">Vercel Dashboard</p>
              <p className="text-xs text-gray-500">Deployments & Logs</p>
            </div>
          </a>
          <a
            href="https://supabase.com/dashboard/project/rdufwjhptmlpmjmcibpn/auth/templates"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Email Templates</p>
              <p className="text-xs text-gray-500">Auth emails</p>
            </div>
          </a>
          <a
            href="https://supabase.com/dashboard/project/rdufwjhptmlpmjmcibpn/auth/url-configuration"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Shield className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Auth URL Config</p>
              <p className="text-xs text-gray-500">Redirects & Site URL</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
