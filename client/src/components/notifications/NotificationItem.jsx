import React from 'react';
import { CheckCircle, XCircle, Car, FileText, Info } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    const icons = {
      approval: CheckCircle,
      rejection: XCircle,
      vehicle_assigned: Car,
      new_request: FileText,
      info: Info,
    };
    const Icon = icons[type] || Info;
    return <Icon className="w-5 h-5" />;
  };

  const getIconColor = (type) => {
    const colors = {
      approval: 'text-green-500',
      rejection: 'text-red-500',
      vehicle_assigned: 'text-blue-500',
      new_request: 'text-purple-500',
      info: 'text-gray-500',
    };
    return colors[type] || 'text-gray-500';
  };

  const { profile } = useAuth();

  const handleClick = () => {
    onMarkAsRead(notification.id);
    if (!notification.related_request_id) return;

    if (profile?.role === 'driver') {
      // For drivers, take them to their assignments page where they have robust viewing logic
      navigate('/driver/assignments');
    } else {
      // For others (requesters, admins, heads, registrars), take them to the details page where they can take action
      navigate(`/request/${notification.related_request_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDateTime(notification.created_at)}
          </p>
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;