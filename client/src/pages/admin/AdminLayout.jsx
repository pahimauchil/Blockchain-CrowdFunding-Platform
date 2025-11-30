import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../constants/api";
import { CustomButton } from "../../components";

/**
 * AdminLayout - Main layout wrapper for all admin pages
 * Provides sidebar navigation and top bar with breadcrumbs
 */
const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, authToken, address, connect } = useStateContext();
  const { showError } = useNotification();
  const [pendingCount, setPendingCount] = useState(0);
  const [editApprovalsCount, setEditApprovalsCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isAdmin = userRole === "admin";

  // Fetch badge counts for navigation
  useEffect(() => {
    if (isAdmin && authToken) {
      const fetchCounts = async () => {
        try {
          const [pendingRes, editsRes] = await Promise.all([
            fetch(`${API_URL}/admin/campaigns/pending`, {
              headers: { Authorization: `Bearer ${authToken}` },
            }),
            fetch(`${API_URL}/admin/campaigns/pending-edits`, {
              headers: { Authorization: `Bearer ${authToken}` },
            }),
          ]);

          if (pendingRes.ok) {
            const pendingData = await pendingRes.json();
            setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0);
          }

          if (editsRes.ok) {
            const editsData = await editsRes.json();
            setEditApprovalsCount(Array.isArray(editsData) ? editsData.length : 0);
          } else {
            setEditApprovalsCount(0);
          }
        } catch (error) {
          console.error("Failed to fetch badge counts:", error);
        }
      };

      fetchCounts();
      // Refresh counts every 30 seconds
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, authToken, API_URL]);

  // Navigation items
  const navItems = [
    { path: "/admin", label: "Dashboard", icon: "🏠", exact: true },
    {
      path: "/admin/pending",
      label: "Pending Campaigns",
      icon: "⏳",
      badge: pendingCount,
    },
    {
      path: "/admin/edit-approvals",
      label: "Edit Approvals",
      icon: "✏️",
      badge: editApprovalsCount,
    },
    { path: "/admin/campaigns", label: "All Campaigns", icon: "📋" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/analytics", label: "Analytics", icon: "📊" },
    { path: "/admin/activity", label: "Activity Log", icon: "📜" },
  ];

  // Get breadcrumb path
  const getBreadcrumb = () => {
    const path = location.pathname;
    const item = navItems.find((item) => item.path === path || (item.exact && path === item.path));
    if (item) return item.label;
    
    // Handle nested paths
    if (path.includes("/admin/campaigns")) return "All Campaigns";
    if (path.includes("/admin/pending")) return "Pending Campaigns";
    if (path.includes("/admin/edit-approvals")) return "Edit Approvals";
    if (path.includes("/admin/users")) return "Users";
    if (path.includes("/admin/analytics")) return "Analytics";
    if (path.includes("/admin/activity")) return "Activity Log";
    
    return "Admin Dashboard";
  };

  // Check if nav item is active
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-epilogue font-semibold text-red-500 dark:text-red-300">
          Access Denied
        </h2>
        <p className="mt-3 text-text-light dark:text-text-dark">
          You need admin privileges to view this page.
        </p>
        {!authToken && (
          <div className="mt-6 flex justify-center">
            <CustomButton
              btnType="button"
              title="Connect Wallet"
              styles="bg-accent-primary text-white hover:bg-accent-hover-primary"
              handleClick={connect}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-primary-light dark:bg-primary-dark">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-0 lg:w-16"
        } bg-white dark:bg-secondary-dark border-r border-accent-primary/10 transition-all duration-300 overflow-hidden flex-shrink-0`}
      >
        <div className="p-4 flex items-center justify-between">
          <h2 className={`font-epilogue font-bold text-xl text-text-light dark:text-text-dark ${!isSidebarOpen && "hidden"}`}>
            Admin Panel
          </h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {isSidebarOpen ? "✕" : "☰"}
          </button>
        </div>

        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive(item)
                  ? "bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-secondary"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className={`font-medium ${!isSidebarOpen && "hidden lg:inline"}`}>
                {item.label}
              </span>
              {item.badge > 0 && (
                <span
                  className={`ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ${!isSidebarOpen && "hidden lg:inline"}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white dark:bg-secondary-dark border-b border-accent-primary/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <nav className="text-sm text-gray-500 dark:text-gray-400">
                <Link to="/admin" className="hover:text-accent-primary dark:hover:text-accent-secondary">
                  Admin
                </Link>
                <span className="mx-2">/</span>
                <span className="text-text-light dark:text-text-dark">{getBreadcrumb()}</span>
              </nav>
              <h1 className="text-2xl font-epilogue font-bold text-text-light dark:text-text-dark mt-1">
                {getBreadcrumb()}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {address && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

