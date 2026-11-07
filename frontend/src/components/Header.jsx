
import { useState } from "react";

import {
  Search,
  Bell,
  User,
  CreditCard,
  UserPlus,
  CalendarClock,
  Check,
  X
} from "lucide-react";

function Header({ onNavigate }) {

  const [showNotifications, setShowNotifications] = useState(false);

  const savedProfiles = JSON.parse(
    localStorage.getItem("gymstreak_profiles") || "{}"
  );

  const adminPhoto = savedProfiles.Admin?.photo;
  const adminName = savedProfiles.Admin?.name || "Admin";

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Member Registered",
      message: "A new member has joined GymStreak.",
      time: "5 minutes ago",
      icon: UserPlus,
      color: "#22d3ee",
      unread: true
    },
    {
      id: 2,
      title: "Payment Received",
      message: "Membership payment received successfully.",
      time: "20 minutes ago",
      icon: CreditCard,
      color: "#4ade80",
      unread: true
    },
    {
      id: 3,
      title: "Membership Expiring",
      message: "A member's membership is expiring soon.",
      time: "1 hour ago",
      icon: CalendarClock,
      color: "#fb923c",
      unread: true
    },
    {
      id: 4,
      title: "New Attendance",
      message: "Today's attendance has been updated.",
      time: "2 hours ago",
      icon: User,
      color: "#c084fc",
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(
    item => item.unread
  ).length;

  function markAllRead() {
    setNotifications(prev =>
      prev.map(item => ({
        ...item,
        unread: false
      }))
    );
  }

  function clearAll() {
    setNotifications([]);
  }

  function markRead(id) {
    setNotifications(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, unread: false }
          : item
      )
    );
  }

  return (
    <header className="header">

      {/* Search */}
      <div className="header-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search anything..."
        />
      </div>

      <div className="header-right">

        {/* Notifications */}
        <div className="notification-container">

          <button
            className="notification-btn"
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
            title="Notifications"
          >
            <Bell size={21} />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">

              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>
                  <p>{unreadCount} unread messages</p>
                </div>

                <button
                  className="notification-close"
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="notification-actions">
                <button onClick={markAllRead}>
                  <Check size={14} />
                  Mark all as read
                </button>

                <button onClick={clearAll}>
                  Clear all
                </button>
              </div>

              <div className="notification-list">

                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <Bell size={30} />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(item => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        className={`notification-item ${item.unread ? "unread" : ""
                          }`}
                        onClick={() => markRead(item.id)}
                      >
                        <div
                          className="notification-icon"
                          style={{ color: item.color }}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="notification-content">
                          <h4>{item.title}</h4>
                          <p>{item.message}</p>
                          <span>{item.time}</span>
                        </div>

                        {item.unread && (
                          <span className="unread-dot"></span>
                        )}
                      </div>
                    );
                  })
                )}

              </div>

              <div className="notification-footer">
                GymStreak Notifications
              </div>

            </div>
          )}

        </div>

        {/* Clickable Admin Profile */}
        <button
          type="button"
          className="header-profile"
          onClick={() => {
            setShowNotifications(false);
            onNavigate("Profile");
          }}
        >
          <div className="profile-avatar">
            {adminPhoto ? (
              <img src={adminPhoto} alt="Admin" />
            ) : (
              <User size={20} />
            )}
          </div>

          <div className="profile-info">
            <h4>{adminName}</h4>
            <span>Administrator</span>
          </div>
        </button>

      </div>
    </header>
  );
}

export default Header;
