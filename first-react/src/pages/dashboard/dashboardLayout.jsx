import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/notificationContext";
import { MyStoreProvider, useMyStore } from "../../context/myStoreContext";
import StoreSetupBanner from "../../components/dashboard/StoreSetupBanner";
import SuspendedBanner from "../../components/dashboard/SuspendedBanner";
import Icon from "../../components/icons";
import { BellIcon } from "../../components/dashboard/navIcons";
import "../../css/tokens.css";
import "../../css/dashboardLayout.css"; // kept only for rules your other pages may share
import "../../css/dashboardShell.css"; // the sidebar/strip itself (own class names)

const ALL = ["buyer", "seller", "admin"];

// sellerLabel: a different label when the user is a seller
const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: "overview", end: true, roles: ALL },
  { to: "/dashboard/sales", label: "Incoming orders", icon: "orders", roles: ["seller"] },
  { to: "/dashboard/inventory", label: "Inventory", icon: "inventory", roles: ["seller"] },
  { to: "/dashboard/store", label: "My store", icon: "inventory", roles: ["seller"] },
  { to: "/dashboard/products", label: "Product approvals", icon: "inventory", roles: ["admin"] },
  { to: "/dashboard/categories", label: "Categories", icon: "inventory", roles: ["admin"] },
  { to: "/dashboard/sellers", label: "Sellers", icon: "inventory", roles: ["admin"] },
  { to: "/dashboard/disputes", label: "Disputes", icon: "orders", roles: ["admin"] },
  { to: "/dashboard/orders", label: "My orders", sellerLabel: "My purchases", icon: "orders", roles: ["buyer", "seller"] },
  { to: "/dashboard/notifications", label: "Notifications", bell: true, roles: ALL, badge: true },
  { to: "/dashboard/profile", label: "My Profile", icon: "orders", roles: ALL },
  { to: "/dashboard/settings", label: "Settings", icon: "settings", roles: ALL },
];

function SidebarStoreNote() {
  const { percent, loading } = useMyStore();
  if (loading) return null;
  if (percent < 100) {
    return (
      <Link to="/dashboard/store" className="lm-shell__note">
        <span className="lm-shell__mark" />
        <div>
          <strong>Finish your store · {percent}%</strong>
          <p>Add your logo and details so buyers trust you.</p>
        </div>
      </Link>
    );
  }
  return (
    <div className="lm-shell__note">
      <span className="lm-shell__mark" />
      <div>
        <strong>Your store, in one place</strong>
        <p>Keep your catalog accurate and up to date.</p>
      </div>
    </div>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const role = user?.role?.toUpperCase() || "";

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="lm-shell">
      <aside className="lm-shell__side">
        <div className="lm-shell__label">{role} WORKSPACE</div>

        <nav className="lm-shell__nav" aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `lm-shell__link ${isActive ? "is-active" : ""}`}
            >
              {item.bell ? <BellIcon /> : <Icon name={item.icon} />}
              <span>{user?.role === "seller" && item.sellerLabel ? item.sellerLabel : item.label}</span>
              {item.badge && unread > 0 && <span className="lm-shell__badge">{unread > 99 ? "99+" : unread}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="lm-shell__bottom">
          {role === "SELLER" && <SidebarStoreNote />}
          <button type="button" className="lm-shell__logout" onClick={handleLogout} aria-label="Sign out" title="Sign out">
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="lm-shell__main">
        <main className="lm-shell__content">
          {role === "SELLER" && (
            <div style={{ marginBottom: 20 }}>
              <SuspendedBanner />
              <StoreSetupBanner />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <MyStoreProvider>
      <Shell />
    </MyStoreProvider>
  );
}