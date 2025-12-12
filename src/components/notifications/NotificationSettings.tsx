import { useState, useEffect } from 'react';
import { useNotificationPreferences, useUpdatePreferences } from '../../hooks/useNotifications';
import { useToast } from '../shared/Toast';

interface NotificationSettingsProps {
  userId: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const { data: preferences, isLoading } = useNotificationPreferences(userId);
  const updatePreferences = useUpdatePreferences(userId);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    email_interview_reminder: true,
    email_follow_up_reminder: true,
    email_milestone_reminder: true,
    email_weekly_summary: true,
    in_app_enabled: true,
    reminder_days_before: 1,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        email_interview_reminder: preferences.email_interview_reminder,
        email_follow_up_reminder: preferences.email_follow_up_reminder,
        email_milestone_reminder: preferences.email_milestone_reminder,
        email_weekly_summary: preferences.email_weekly_summary,
        in_app_enabled: preferences.in_app_enabled,
        reminder_days_before: preferences.reminder_days_before,
      });
    }
  }, [preferences]);

  const handleCheckboxChange = async (field: string, value: boolean) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    try {
      await updatePreferences.mutateAsync({ [field]: value });
      showToast('Preferences updated', 'success');
    } catch (error) {
      showToast('Failed to update preferences', 'error');
      // Revert on error
      setFormData(formData);
    }
  };

  const handleReminderDaysChange = async (value: number) => {
    if (value < 0 || value > 7) return;

    const newData = { ...formData, reminder_days_before: value };
    setFormData(newData);

    try {
      await updatePreferences.mutateAsync({ reminder_days_before: value });
      showToast('Preferences updated', 'success');
    } catch (error) {
      showToast('Failed to update preferences', 'error');
      // Revert on error
      setFormData(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage how you receive notifications and reminders
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* In-App Notifications */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">In-App Notifications</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.in_app_enabled}
              onChange={(e) => handleCheckboxChange('in_app_enabled', e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Enable in-app notifications</p>
              <p className="text-xs text-gray-500">Show notifications in the notification bell</p>
            </div>
          </label>
        </div>

        {/* Email Notifications */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email_interview_reminder}
                onChange={(e) => handleCheckboxChange('email_interview_reminder', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Interview reminders</p>
                <p className="text-xs text-gray-500">Get notified before scheduled interviews</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email_follow_up_reminder}
                onChange={(e) => handleCheckboxChange('email_follow_up_reminder', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Follow-up reminders</p>
                <p className="text-xs text-gray-500">Reminders to follow up after interviews</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email_milestone_reminder}
                onChange={(e) => handleCheckboxChange('email_milestone_reminder', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Milestone reminders</p>
                <p className="text-xs text-gray-500">Get notified about upcoming milestone deadlines</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email_weekly_summary}
                onChange={(e) => handleCheckboxChange('email_weekly_summary', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly summary</p>
                <p className="text-xs text-gray-500">Receive a weekly summary of your progress</p>
              </div>
            </label>
          </div>
        </div>

        {/* Reminder Timing */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reminder Timing</h3>
          <div>
            <label htmlFor="reminder-days" className="block text-sm font-medium text-gray-700 mb-2">
              Send reminders this many days before deadlines
            </label>
            <div className="flex items-center gap-4">
              <input
                id="reminder-days"
                type="number"
                min="0"
                max="7"
                value={formData.reminder_days_before}
                onChange={(e) => handleReminderDaysChange(parseInt(e.target.value, 10))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                {formData.reminder_days_before === 1 ? 'day' : 'days'} before
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Set to 0 for same-day reminders, maximum 7 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
