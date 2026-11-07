import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CalendarCheck,
  CreditCard,
  ClipboardList,
  Layers,
  Settings,
  LogOut,
  Activity
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Members", icon: Users },
  { name: "Trainers", icon: Dumbbell },
  { name: "Plans", icon: Layers },
  { name: "Membership", icon: ClipboardList },
  { name: "Attendance", icon: CalendarCheck },
  { name: "Payments", icon: CreditCard },
];

function Sidebar({ onNavigate, activePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Activity size={28} color="#22d3ee" />
        <h2>Gym<span>Streak</span></h2>
      </div>

      <p className="menu-label">MAIN MENU</p>

      <nav className="menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`menu-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => onNavigate("Settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <button
          className="menu-item logout"
          onClick={() => onNavigate("Logout")}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;