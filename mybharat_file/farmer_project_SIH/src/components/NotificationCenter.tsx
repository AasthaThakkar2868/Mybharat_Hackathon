import React, { useState, useEffect, useRef } from 'react';
import type { AppNotification } from '../types';
import { dbService } from '../services/dbService';
import { useAuth } from '../auth/AuthContext';
import { Bell, CheckCheck, Clock } from 'lucide-react';

interface NotificationCenterProps {
  onNavigateSection?: (section: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateSection }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const notifs = await dbService.getNotifications(user.id);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await dbService.markAllNotificationsAsRead(user.id);
    loadNotifications();
  };

  const handleClickNotification = async (notif: AppNotification) => {
    await dbService.markNotificationAsRead(notif.id);
    loadNotifications();
    setIsOpen(false);
    if (notif.linkTarget && onNavigateSection) {
      onNavigateSection(notif.linkTarget);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#D9FF55] transition-all cursor-pointer border border-[#D9FF55]/20 active:scale-95"
        aria-label="Notifications"
        title="સૂચનાઓ (Notifications)"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[#F6F1E4] text-[#132B23] shadow-2xl border border-[#17362C]/20 z-50 overflow-hidden animate-scale-up">
          
          {/* Header */}
          <div className="px-4 py-3 bg-[#17362C] text-[#F6F1E4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D9FF55]" />
              <span className="text-xs font-black tracking-wide">સૂચનાઓ (Notifications)</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#D9FF55] text-[#17362C] font-black px-2 py-0.2 rounded-full">
                  {unreadCount} નવી
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-[#D9FF55] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>બધી વંચાઈ ગઈ</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#17362C]/10">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#132B23]/60">
                કોઈ નવી સૂચના નથી (No Notifications)
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    !n.read ? 'bg-[#D9FF55]/15 hover:bg-[#D9FF55]/25' : 'bg-transparent hover:bg-black/5'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-[#FF7043]' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-[#132B23] line-clamp-1">
                      {n.titleGu}
                    </div>
                    <div className="text-[11px] text-[#132B23]/75 line-clamp-2 mt-0.5">
                      {n.messageGu}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[#132B23]/50 mt-1 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.createdAt).toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};
