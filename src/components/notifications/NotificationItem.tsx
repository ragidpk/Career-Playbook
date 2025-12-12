import { X, CheckCircle, Calendar, FileText, Users, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarkAsRead, useDeleteNotification } from '../../hooks/useNotifications';
import type { Database } from '../../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationItemProps {
  notification: Notification;
}

const typeIcons = {
  interview_reminder: Calendar,
  follow_up: Users,
  milestone_due: CheckCircle,
  plan_reminder: FileText,
  system: Bell,
};

const typeColors = {
  interview_reminder: 'text-blue-500 bg-blue-50',
  follow_up: 'text-green-500 bg-green-50',
  milestone_due: 'text-orange-500 bg-orange-50',
  plan_reminder: 'text-purple-500 bg-purple-50',
  system: 'text-gray-500 bg-gray-50',
};

export default function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const Icon = typeIcons[notification.type];
  const colorClass = typeColors[notification.type];

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(notification.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className={`flex-shrink-0 p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>
            {notification.title}
          </p>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Delete notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(notification.created_at)}</p>
      </div>

      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
      )}
    </div>
  );
}
