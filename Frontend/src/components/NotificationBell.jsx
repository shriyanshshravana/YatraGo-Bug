import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Gracefully handle network or offline errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll once a minute
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleMarkAsRead = async (id, link, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const item = prev.find((n) => n._id === id);
        if (item && item.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  if (!user) return null;

  return (
    <div className="notif-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <div>
              <span className="notif-title">Notifications</span>
              {unreadCount > 0 && <span className="notif-unread-tag">{unreadCount} unread</span>}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-all"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} style={{ marginRight: 4 }} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">Checking notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-dark)' }}>All caught up!</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-secondary)' }}>
                  No new updates or alerts right now.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notif-item ${item.read ? 'read' : 'unread'}`}
                  onClick={() => handleMarkAsRead(item._id, item.link)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="notif-item-body">
                    <div className="notif-item-title-row">
                      <span className="notif-item-title">{item.title}</span>
                      <span className="notif-item-time">{formatTimeAgo(item.createdAt)}</span>
                    </div>
                    <p className="notif-item-message">{item.message}</p>
                  </div>
                  <div className="notif-item-actions">
                    <button
                      type="button"
                      className="notif-action-btn"
                      onClick={(e) => handleDelete(item._id, e)}
                      title="Remove notification"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
