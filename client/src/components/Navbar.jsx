import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CustomButton } from "./";
import { logo, menu, search, thirdweb } from "../assets";
import { navlinks } from "../constants";
import { useStateContext } from "../context";
import { useNotification } from "../context/NotificationContext";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState("dashboard");
  const [toggleDrawer, setToggleDrawer] = useState(false);

  const {
    address,
    connect,
    searchQuery,
    setSearchQuery,
    userRole,
    userType,
    authToken,
    ensureBackendSession,
  } = useStateContext();
  const { showError } = useNotification();
  const allowedLinks = navlinks.filter((link) => {
    // Filter out admin-only links
    if (link.requiresAdmin && userRole !== "admin") {
      return false;
    }
    // Filter out campaign link for donors (unless admin)
    if (link.name === "campaign" && userType === "donor" && userRole !== "admin") {
      return false;
    }
    return true;
  });
  const handlePrimaryAction = async () => {
    if (!address) {
      try {
        await connect();
      } catch (error) {
        showError(error.message || "Failed to connect wallet. Please try again.");
      }
      return;
    }

    // Check if user is a creator
    if (userType !== "creator" && userRole !== "admin") {
      navigate("/creator-signup");
      return;
    }

    if (!authToken) {
      try {
        await ensureBackendSession();
      } catch (error) {
        showError(error.message || "Please reconnect your wallet to continue.");
        return;
      }
    }

    navigate("/create-campaign");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // If we're not on the campaigns page, navigate to it
    if (location.pathname !== "/campaigns") {
      navigate("/campaigns");
    }
  };

  return (
    <div className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6">
      <form
        onSubmit={handleSearchSubmit}
        className="lg:flex-1 flex flex-row max-w-[458px] py-2 pl-4 pr-2 h-[52px] bg-white dark:bg-secondary-dark rounded-[100px] transition-colors duration-200 border border-[#1a8b9d]/20 focus-within:border-[#1a8b9d] shadow-sm"
      >
        <input
          type="text"
          placeholder="Search for campaigns"
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex w-full font-epilogue font-normal text-[14px] placeholder:text-[#000000]/40 dark:placeholder:text-gray-500 text-[#000000] dark:text-text-dark bg-transparent outline-none transition-colors duration-200"
        />
        <button
          type="submit"
          className="w-[72px] h-full rounded-[20px] bg-[#1a8b9d] dark:bg-accent-dark flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-[#1a8b9d]/90"
        >
          <img
            src={search}
            alt="search"
            className="w-[15px] h-[15px] object-contain"
          />
        </button>
      </form>

      <div className="sm:flex hidden flex-row justify-end gap-4 items-center">
        <ThemeToggle />
        {/* Only show create button for creators/admins, hide connect button after connection */}
        {address && (userType === "creator" || userRole === "admin") && (
        <CustomButton
          btnType="button"
            title="Create a campaign"
            styles="bg-[#1a8b9d] dark:bg-[#1a8b9d] text-[#fff5f5] hover:bg-[#1a8b9d]/90"
          handleClick={handlePrimaryAction}
        />
        )}
        {/* Only show profile link if wallet is connected */}
        {address && (
        <Link to="/profile">
          <div className="w-[52px] h-[52px] rounded-full bg-secondary-light dark:bg-secondary-dark flex justify-center items-center cursor-pointer transition-colors duration-200">
            <img
              src={thirdweb}
              alt="user"
              className="w-[60%] h-[60%] object-contain"
            />
          </div>
        </Link>
        )}
      </div>
      {/* Small screen navigation */}
      <div className="sm:hidden flex justify-between items-center relative">
        <div className="w-[40px] h-[40px] rounded-[10px] bg-secondary-light dark:bg-secondary-dark flex justify-center items-center cursor-pointer transition-colors duration-200">
          <img
            src={logo}
            alt="user"
            className="w-[60%] h-[60%] object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <img
            src={menu}
            alt="menu"
            className="w-[34px] h-[34px] object-contain cursor-pointer"
            onClick={() => setToggleDrawer((prev) => !prev)}
          />
        </div>
        <div
          className={`absolute top-[60px] right-0 left-0 bg-secondary-light dark:bg-secondary-dark z-10 shadow-secondary dark:shadow-secondary-dark py-4 ${!toggleDrawer ? "-translate-y-[100vh]" : "translate-y-0]"
            } transition-all duration-700`}
        >
          <ul className="mb-4">
            {allowedLinks.map((Link) => (
              <li
                key={Link.name}
                className={`flex p-4 ${isActive === Link.name && "bg-[#3a3a43]"
                  }`}
                onClick={() => {
                  setIsActive(Link.name);
                  setToggleDrawer(false);
                  navigate(Link.link);
                }}
              >
                <img
                  src={Link.imgUrl}
                  alt={Link.name}
                  className={`w-[24px] h-[24px] object-contain ${isActive === Link.name ? "grayscale-0" : "grayscale"
                    }`}
                />
                <p
                  className={`ml-[20px] font-epilogue font-semibold text-[14px] ${isActive === Link.name
                      ? "text-[#1dc071]"
                      : "text-[#8080191]"
                    }`}
                >
                  {Link.name}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex mx-4">
            {/* Only show create button for creators/admins, hide after connection */}
            {address && (userType === "creator" || userRole === "admin") && (
            <CustomButton
              btnType="button"
                title="Create a campaign"
                styles="bg-[#1a8b9d] dark:bg-[#1a8b9d] text-[#fff5f5] hover:bg-[#1a8b9d]/90"
              handleClick={handlePrimaryAction}
            />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
