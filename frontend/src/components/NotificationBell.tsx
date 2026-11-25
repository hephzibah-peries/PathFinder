import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi, Notification } from '../services/api';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getMyNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore background polling errors silently
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    try {
      if (!notif.isRead) {
        await notificationApi.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    } finally {
      setIsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const diffSec = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5D5CE] bg-white text-[#7A6A65] hover:bg-[#FAF6F4] hover:text-[#2B1B17] transition-all shadow-xs focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#E5D5CE] bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5D5CE] bg-[#FAF6F4] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-[#2B1B17]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs font-semibold text-[#7A4B43] hover:text-[#5E342D] hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#E5D5CE]/50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A6A65]">
                <Bell className="h-8 w-8 mx-auto mb-2 text-[#E5D5CE]" />
                <p className="font-semibold text-[#2B1B17]">No notifications yet</p>
                <p className="text-[11px] mt-0.5">We'll alert you here when companies update your status.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer hover:bg-[#FAF6F4] ${
                    !notif.isRead ? 'bg-[#FAF6F4]/60' : 'bg-white'
                  }`}
                >
                  {/* Indicator Dot & Icon */}
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5D5CE] shadow-2xs">
                    {notif.type === 'APPLICATION_UPDATE' ? (
                      <span className="text-sm">📋</span>
                    ) : (
                      <span className="text-sm">🚀</span>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${!notif.isRead ? 'text-[#2B1B17]' : 'text-[#7A6A65]'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] shrink-0 text-[#7A6A65]">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#554440] mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread marker */}
                  {!notif.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E5D5CE] bg-[#FAF6F4]/50 px-4 py-2 text-center">
            <span className="text-[11px] text-[#7A6A65]">
              System updates & auto alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
