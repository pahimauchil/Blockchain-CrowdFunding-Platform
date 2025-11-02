import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logo } from "../assets";
import { navlinks } from "../constants";
import { useStateContext } from "../context"; // Import the context

const Icon = ({ styles, name, imgUrl, isActive, disabled, handleClick }) => (
  <div
    role="button"
    aria-label={name}
    className={`w-[48px] h-[48px] rounded-[10px] ${
      isActive === name ? "bg-secondary-dark dark:bg-accent-primary/20" : ""
    } flex justify-center items-center ${
      !disabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"
    } ${styles}`}
    onClick={handleClick}
  >
    <img
      src={imgUrl}
      alt={name}
      className={`w-1/2 h-1/2 ${
        isActive !== name ? "grayscale" : "grayscale-0"
      }`}
    />
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState("dashboard");
  const { disconnect, address } = useStateContext(); // Get disconnect from context

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

  const handleLogoutClick = async () => {
    // Confirm logout
    const confirmed = window.confirm(
      "Are you sure you want to disconnect your wallet?"
    );

    if (confirmed) {
      setIsActive("logout");

      // Call the disconnect function
      const success = await disconnect();

      if (success) {
        // Reset active state
        setIsActive("dashboard");
        // Navigate to home
        navigate("/");

        // Optional: Show success message
        console.log("Wallet disconnected successfully");
      } else {
        console.error("Failed to disconnect wallet");
      }
    }
  };

  return (
    <div className="flex justify-between items-center flex-col sticky top-5 h-[93vh]">
      <Link to="/">
        <Icon
          styles="w-[52px] h-[52px] bg-secondary-dark dark:bg-accent-primary/20"
          imgUrl={logo}
          name="home"
          isActive={isActive}
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between items-center bg-darkBg dark:bg-darkBg rounded-[20px] w-[76px] py-4 mt-2">
        {/* top/middle icons (all links except logout) */}
        <div className="flex flex-col justify-start items-center gap-3 mt-2">
          {navlinks
            .filter((link) => link.name !== "logout")
            .map((link) => (
              <Icon
                key={link.name}
                {...link}
                isActive={isActive}
                handleClick={() => handleNavigation(link)}
              />
            ))}
        </div>

        {/* bottom icon: logout (only show if wallet is connected) */}
        {address && (
          <div className="mb-2">
            {navlinks.find((l) => l.name === "logout") && (
              <Icon
                {...navlinks.find((l) => l.name === "logout")}
                isActive={isActive}
                handleClick={() =>
                  handleNavigation(navlinks.find((l) => l.name === "logout"))
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
