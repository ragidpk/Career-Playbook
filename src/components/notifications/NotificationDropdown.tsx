import { Settings, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAllAsRead } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  userId: string;
  onClose: () => void;
}

export default function NotificationDropdown({ userId, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { notifications, isLoading } = useNotifications(userId);
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync(userId);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            disabled={markAllAsRead.isPending}
            title="Mark all as read"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSettingsClick}
            className="text-gray-600 hover:text-gray-900"
            title="Notification settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-2 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">You'll be notified about important updates here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button
            type="button"
            onClick={handleSettingsClick}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Manage notification preferences
          </button>
        </div>
      )}
    </div>
  );
}
