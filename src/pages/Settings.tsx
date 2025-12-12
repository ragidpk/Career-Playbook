import { useAuth } from '../hooks/useAuth';
import NotificationSettings from '../components/notifications/NotificationSettings';

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and notifications</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <NotificationSettings userId={user.id} />

          {/* Account Settings Placeholder */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account information and preferences
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-sm text-gray-900">
                    {user.user_metadata?.full_name || 'Not set'}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Additional account settings coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
