import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  CampaignDetails,
  CreateCampaign,
  Home,
  Profile,
  Landing,
  About,
  CreatorSignup,
  PostUpdate,
} from "./pages";
import {
  AdminLayout,
  Dashboard,
  PendingCampaigns,
  EditApprovals,
  AllCampaigns,
  UsersManagement,
  Analytics,
  ActivityLog,
} from "./pages/admin";
import { Sidebar, Navbar, AdminRouteGuard } from "./components";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { StateContextProvider, useStateContext } from "./context";

// Inner component that has access to context
const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address } = useStateContext();

  useEffect(() => {
    if (location?.hash?.startsWith("#/")) {
      const redirectedPath = location.hash.replace("#", "");
      navigate(redirectedPath, { replace: true });
    }
  }, [location.hash, navigate]);

  // Routes that should never show sidebar/navbar
  const noLayoutRoutes = ["/", "/about", "/creator-signup", "/admin"];
  const showLayout = !noLayoutRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + "/"));

  // Routes that require wallet connection (except campaigns which can be browsed)
  const walletRequiredRoutes = ["/profile", "/create-campaign", "/post-update"];
  const requiresWallet = walletRequiredRoutes.some(route => location.pathname.startsWith(route));

  // If route requires wallet but no wallet connected, redirect to campaigns
  useEffect(() => {
    if (requiresWallet && !address && showLayout) {
      navigate("/campaigns", { replace: true });
    }
  }, [requiresWallet, address, showLayout, navigate]);

  return (
    <>
      {showLayout ? (
        <div className="relative sm:-8 p-4 bg-primary-light dark:bg-primary-dark min-h-screen flex flex-row transition-colors duration-200">
          {/* Only show sidebar if wallet is connected OR on campaigns page (browsing allowed) */}
          {(address || location.pathname === "/campaigns") && (
            <div className="sm:flex hidden mr-10 relative">
              <Sidebar />
            </div>
          )}

          <div className="flex-1 max-sm:w-full max-w-[1280] mx-auto sm:pr-5">
            {/* Only show navbar if wallet is connected OR on campaigns page */}
            {(address || location.pathname === "/campaigns") && <Navbar />}
            <Routes>
              <Route path="/campaigns" element={<Home />} />
              {address && (
                <>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/create-campaign" element={<CreateCampaign />} />
                  <Route path="/post-update/:id" element={<PostUpdate />} />
                </>
              )}
              {/* Redirect wallet-required routes to campaigns if no wallet */}
              {!address && (
                <>
                  <Route path="/profile" element={<Navigate to="/campaigns" replace />} />
                  <Route path="/create-campaign" element={<Navigate to="/campaigns" replace />} />
                  <Route path="/post-update/:id" element={<Navigate to="/campaigns" replace />} />
                </>
              )}
              <Route path="/campaign-details/:id" element={<CampaignDetails />} />
              <Route path="/creator-signup" element={<CreatorSignup />} />
              <Route
                path="/admin"
                element={
                  <AdminRouteGuard>
                    <AdminLayout />
                  </AdminRouteGuard>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="pending" element={<PendingCampaigns />} />
                <Route path="edit-approvals" element={<EditApprovals />} />
                <Route path="campaigns" element={<AllCampaigns />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="activity" element={<ActivityLog />} />
              </Route>
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/creator-signup" element={<CreatorSignup />} />
          <Route
            path="/admin"
            element={
              <AdminRouteGuard>
                <AdminLayout />
              </AdminRouteGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pending" element={<PendingCampaigns />} />
            <Route path="edit-approvals" element={<EditApprovals />} />
            <Route path="campaigns" element={<AllCampaigns />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="activity" element={<ActivityLog />} />
          </Route>
        </Routes>
      )}
    </>
  );
};

const App = () => {
  return (
    <StateContextProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </ThemeProvider>
    </StateContextProvider>
  );
};

export default App;
