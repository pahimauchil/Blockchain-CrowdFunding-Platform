import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "../context";
import { Loader, CustomButton } from "./";
import { API_URL } from "../constants/api";

/**
 * AdminRouteGuard - Protects admin routes by checking wallet address against admin role in DB
 * 
 * Flow:
 * 1. If no wallet connected -> Show only "Connect Wallet" (no sidebar/navbar)
 * 2. After wallet connects -> Check if wallet is admin in DB
 * 3. If admin -> Show admin dashboard
 * 4. If NOT admin -> Redirect to landing page immediately
 */
const AdminRouteGuard = ({ children }) => {
  const navigate = useNavigate();
  const { address, connect, authToken, userRole, ensureBackendSession } = useStateContext();
  const [isChecking, setIsChecking] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);


  // Check admin access after wallet connection
  useEffect(() => {
    const checkAdminAccess = async () => {
      // If no wallet connected, don't check yet
      if (!address) {
        setIsAuthorized(false);
        return;
      }

      setIsChecking(true);

      // Ensure backend session exists
      try {
        await ensureBackendSession();
      } catch (error) {
        console.error("Failed to ensure backend session:", error);
        navigate("/");
        return;
      }

      // Check if user is admin via backend
      if (!authToken) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          navigate("/");
          return;
        }

        const data = await response.json();
        const user = data?.user;

        // Check if user has admin role
        if (user?.role === "admin") {
          setIsAuthorized(true);
        } else {
          // Not an admin, redirect to landing immediately
          navigate("/");
        }
      } catch (error) {
        console.error("Admin check error:", error);
        navigate("/");
      } finally {
        setIsChecking(false);
      }
    };

    if (address) {
      checkAdminAccess();
    }
  }, [address, authToken, navigate, ensureBackendSession, API_URL]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Step 1: No wallet connected - show only connect wallet
  if (!address) {
    return (
      <div className="min-h-screen bg-primary-light dark:bg-primary-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark mb-4">
            Admin Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your admin wallet to access the admin panel.
          </p>
          <CustomButton
            btnType="button"
            title={isConnecting ? "Connecting..." : "Connect Wallet"}
            styles="bg-accent-primary text-white hover:bg-accent-hover-primary w-full"
            handleClick={handleConnect}
            disabled={isConnecting}
          />
        </div>
      </div>
    );
  }

  // Step 2: Checking admin status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Step 3: Not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  // Step 4: Authorized - show admin layout
  return <>{children}</>;
};

export default AdminRouteGuard;
