import React from "react";
import { useNavigate } from "react-router-dom";
import { loader } from "../assets";
import FundCard from "./FundCard";

const DisplayCampaigns = ({ title, isLoading, campaigns }) => {
  const navigate = useNavigate();
  const handleNavigate = (campaign) => {
    navigate(`/campaign-details/${campaign.title}`, { state: campaign });
  };
  // Helper: normalize a campaign deadline to seconds
  const normalizeDeadlineSeconds = (dl) => {
    const n = Number(dl);
    // if looks like ms (>= 1e12) convert to seconds
    if (!Number.isFinite(n)) return 0;
    return n >= 1e12 ? Math.floor(n / 1000) : Math.floor(n);
  };

  const now = Math.floor(Date.now() / 1000); // current UTC timestamp in seconds

  // Partition campaigns into active and ended using normalized seconds
  const activeCampaigns = campaigns
    .filter((c) => normalizeDeadlineSeconds(c.deadline) > now)
    .sort(
      (a, b) =>
        normalizeDeadlineSeconds(a.deadline) -
        normalizeDeadlineSeconds(b.deadline)
    );

  const endedCampaigns = campaigns
    .filter((c) => normalizeDeadlineSeconds(c.deadline) <= now)
    .sort(
      (a, b) =>
        normalizeDeadlineSeconds(b.deadline) -
        normalizeDeadlineSeconds(a.deadline)
    );

  return (
    <div>
      <h1 className="font-epilogue font-semibold text-[18px] text-text-light dark:text-text-dark text-left">
        {title} ({activeCampaigns.length})
      </h1>
      <div className="flex flex-wrap mt-[20px] gap-[26px]">
        {isLoading && (
          <img
            src={loader}
            alt="loader"
            className="w-[100px] h-[100px] object-contain"
          />
        )}
        {!isLoading && activeCampaigns.length === 0 && (
          <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-gray-500 dark:text-gray-400">
            You have not created any active campaigns yet
          </p>
        )}
        {!isLoading &&
          activeCampaigns.length > 0 &&
          activeCampaigns.map((campaign) => (
            <FundCard
              key={campaign.pId}
              {...campaign}
              handleClick={() => handleNavigate(campaign)}
            />
          ))}
      </div>

      {/* Ended Campaigns Section */}
      {endedCampaigns.length > 0 && (
        <div className="mt-10">
          <h2 className="font-epilogue font-semibold text-[16px] text-red-600 dark:text-red-400 mb-2">
            Deadline Ended ({endedCampaigns.length})
          </h2>
          <div className="flex flex-wrap gap-[26px]">
            {endedCampaigns.map((campaign) => (
              <FundCard
                key={campaign.pId}
                {...campaign}
                handleClick={() => handleNavigate(campaign)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayCampaigns;
