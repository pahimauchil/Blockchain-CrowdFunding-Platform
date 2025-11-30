import { createCampaign, dashboard, logout, profile, payment } from "../assets";

export const navlinks = [
  {
    name: "dashboard",
    imgUrl: dashboard,
    link: "/campaigns",
  },
  {
    name: "campaign",
    imgUrl: createCampaign,
    link: "/create-campaign",
  },
  {
    name: "profile",
    imgUrl: profile,
    link: "/profile",
  },
  // Admin link removed - admin access only via direct URL with wallet check
  {
    name: "logout",
    imgUrl: logout,
    link: "/",
    disabled: false,
  },
];
