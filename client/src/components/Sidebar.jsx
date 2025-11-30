import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logo } from "../assets";
import { navlinks } from "../constants";
import { useStateContext } from "../context";
import { ConfirmDialog } from "./";

const Icon = ({ styles, name, imgUrl, isActive, disabled, handleClick, children }) => (
  <div
    role="button"
    aria-label={name}
    className={`w-[48px] h-[48px] rounded-[10px] ${
      isActive === name ? "bg-accent-primary/10 dark:bg-accent-primary/20" : ""
    } flex justify-center items-center ${
      !disabled ? "cursor-pointer hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10" : "cursor-not-allowed opacity-50"
    } transition-colors duration-200 ${styles}`}
    onClick={handleClick}
  >
    {children || (
    <img
      src={imgUrl}
      alt={name}
      className={`w-1/2 h-1/2 ${
        isActive !== name ? "grayscale" : "grayscale-0"
      }`}
    />
    )}
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { disconnect, address, userRole, userType } = useStateContext();

  const visibleLinks = navlinks.filter((link) => {
    if (link.name === "logout") return false;
    
    // When browsing without wallet, only show dashboard link
    if (!address) {
      return link.name === "dashboard";
    }
    
    // When wallet is connected, apply normal filtering
    if (link.requiresAdmin && userRole !== "admin") {
      return false;
    }
    // For donors, hide "campaign" (create campaign) link
    if (link.name === "campaign" && userType === "donor" && userRole !== "admin") {
      return false;
    }
    return true;
  });
  const logoutLink = navlinks.find((l) => l.name === "logout");

  const handleNavigation = (link) => {
    if (link.disabled) return;

    // Special handling for logout
    if (link.name === "logout") {
      handleLogoutClick();
      return;
    }

    // Regular navigation
    setIsActive(link.name);
    navigate(link.link);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
      setIsActive("logout");

      // Call the disconnect function
      const success = await disconnect();

      if (success) {
        // Reset active state
        setIsActive("dashboard");
        // Navigate to campaigns
        navigate("/campaigns");
        console.log("Wallet disconnected successfully");
      } else {
        console.error("Failed to disconnect wallet");
    }
  };

  return (
    <div className="flex justify-between items-center flex-col sticky top-5 h-[93vh]">
      <Link to="/campaigns">
        <Icon
          styles="w-[52px] h-[52px] bg-white dark:bg-accent-primary/20 border border-accent-primary/10 shadow-sm"
          imgUrl={logo}
          name="home"
          isActive={isActive}
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between items-center bg-white dark:bg-secondary-dark rounded-[20px] w-[76px] py-4 mt-2 border border-accent-primary/10 shadow-sm">
        {/* top/middle icons (all links except logout) */}
        <div className="flex flex-col justify-start items-center gap-3 mt-2">
          {visibleLinks.map((link) => (
            <Icon
              key={link.name}
              {...link}
              isActive={isActive}
              handleClick={() => handleNavigation(link)}
            />
          ))}
          {/* Show "Go Back" button when browsing without wallet (replaces profile) */}
          {!address && (
            <Icon
              styles=""
              name="goBack"
              imgUrl={null}
              isActive={isActive === "goBack"}
              disabled={false}
              handleClick={() => {
                setIsActive("goBack");
                navigate("/");
              }}
            >
              <span className="text-xl font-bold text-text-light dark:text-text-dark">←</span>
            </Icon>
          )}
        </div>

        {/* bottom icon: logout (only show if wallet is connected) */}
        {address && logoutLink && (
          <div className="mb-2">
            <Icon
              {...logoutLink}
              isActive={isActive}
              handleClick={() => handleNavigation(logoutLink)}
            />
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Disconnect Wallet"
        message="Are you sure you want to disconnect your wallet?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Disconnect"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Sidebar;
