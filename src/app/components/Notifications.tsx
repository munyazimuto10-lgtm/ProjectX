// Import icon components
import { Bell, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

// Single notification object
interface Notification {
  // Unique identifier
  id: number;
  // Title/heading of notification
  title: string;
  // Message body
  message: string;
  // Relative time (e.g., "5 minutes ago")
  time: string;
  // Whether notification is unread
  unread: boolean;
}

// Props for Notifications component
interface NotificationsProps {
  // Array of notifications to display
  notifications: Notification[];
  // Callback when user marks a notification as read
  onMarkAsRead: (id: number) => void;
  // Callback when user clears all notifications
  onClearAll: () => void;
}

// Notifications view component
export function Notifications({
  notifications,
  onMarkAsRead,
  onClearAll,
}: NotificationsProps) {
  // Count unread notifications
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Determine the icon to display based on notification title
  const getIcon = (title: string) => {
    // Show check circle for success-related titles
    if (
      title.toLowerCase().includes("complete") ||
      title.toLowerCase().includes("success")
    ) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    // Show alert triangle for audit/urgent-related titles
    else if (
      title.toLowerCase().includes("audit") ||
      title.toLowerCase().includes("required")
    ) {
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }
    // Default to info icon for general notifications
    else {
      return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Notifications
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All notifications are read"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${
                notification.unread ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.title)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {notification.unread && (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Unread
                      </span>
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Total Notifications
                </p>
                <p className="text-3xl font-semibold text-gray-900">
                  {notifications.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Unread</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {unreadCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Read</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {notifications.length - unreadCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
