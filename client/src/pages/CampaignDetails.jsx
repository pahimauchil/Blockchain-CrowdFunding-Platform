import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStateContext } from "../context";
import { CustomButton, CountBox, Loader, EditCampaignModal, ConfirmDialog, UpdateCard } from "../components";
import { calculateBarPercentage, daysLeft, getTrustColor } from "../utils";
import { thirdweb } from "../assets";
import { useNotification } from "../context/NotificationContext";
import { API_URL } from "../constants/api";

const statusStyles = {
  approved: {
    label: "Live",
    classes: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  },
  pending: {
    label: "Pending Review",
    classes:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  },
};


const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { donate, getDonations, contract, address, editCampaign, deleteCampaign, userRole, userType, authToken, publishToBlockchain } = useStateContext();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [donators, setDonators] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showError, showSuccess } = useNotification();


  if (!state) {
    return (
      <div className="text-center text-red-500 font-semibold">
        Campaign not found.
      </div>
    );
  }

  const statusValue = state.status || "approved";
  const remainingDays = daysLeft(state.deadline);
  const statusMeta = statusStyles[statusValue] || statusStyles.approved;
  const aiAnalysis = state.aiAnalysis || null;
  const trustScore =
    typeof aiAnalysis?.trustScore === "number" ? aiAnalysis.trustScore : null;
  const riskFactors = aiAnalysis?.riskFactors || [];
  const recommendations = aiAnalysis?.recommendations || [];
  const analyzedAt = aiAnalysis?.analyzedAt
    ? new Date(aiAnalysis.analyzedAt).toLocaleString()
    : "N/A";
  const canDonate =
    statusValue === "approved" && typeof state.pId === "number";

  const isOwner = address && state.owner && address.toLowerCase() === state.owner.toLowerCase();
  const isAdmin = userRole === "admin";
  const canEdit = userType === "creator" && (isOwner || isAdmin) && authToken;
  const canDelete = userType === "creator" && (isOwner || isAdmin) && authToken && (statusValue !== "approved" || isAdmin);
  const canPublish = isOwner && statusValue === "approved" && !state.isDeployed && !state.onChainId && authToken;

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (campaignId, form) => {
    try {
      setActionLoading(true);
      const response = await editCampaign(campaignId, form);
      // Backend returns message indicating if edit was applied or submitted for review
      const message = response?.message || "Campaign updated successfully!";
      showSuccess(message);
      setIsEditModalOpen(false);
      // Refresh the page data by navigating back and then to the campaign again
      window.location.reload();
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      setActionLoading(true);
      await deleteCampaign(state._id);
      showSuccess("Campaign deleted successfully!");
      navigate("/campaigns");
    } catch (error) {
      showError(error.message || "Failed to delete campaign");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchDonators = async () => {
      if (!canDonate) return;
      const data = await getDonations(state.pId);
      setDonators(data);
    };

    if (contract && canDonate) {
      fetchDonators();
    }
  }, [contract, address, canDonate, getDonations, state.pId]);

  // Fetch campaign updates
  useEffect(() => {
    const fetchUpdates = async () => {
      if (!state?._id) return;

      try {
        const headers = {};
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}/campaigns/${state._id}/updates`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          // Filter to show only approved updates to public, all to owner/admin
          const filteredUpdates = isOwner || isAdmin
            ? data
            : data.filter((update) => update.status === "approved");
          setUpdates(filteredUpdates);
        }
      } catch (error) {
        console.error("Failed to fetch updates:", error);
      }
    };

    fetchUpdates();
  }, [state?._id, isOwner, isAdmin, API_URL, authToken]);

  const handlePublish = async () => {
    if (!authToken || !address) {
      showError("Please connect your wallet to publish campaigns.");
      return;
    }

    if (!publishToBlockchain) {
      showError("Smart contract is not ready yet.");
      return;
    }

    setActionLoading(true);
    try {
      // Publish to blockchain using creator's wallet
      const result = await publishToBlockchain({
        ...state,
        deadlineInput: state.deadline,
      });

      if (!result.success) {
        throw new Error(
          result.error?.message || "Failed to publish campaign."
        );
      }

      // Update backend with onChainId
      const response = await fetch(
        `${API_URL}/campaigns/${state._id}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ onChainId: result.data }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update campaign after publishing.");
      }

      showSuccess("Campaign published successfully! Refreshing page...");
      // Reload the page to show updated campaign state
      window.location.reload();
    } catch (error) {
      showError(error.message || "Publishing failed.");
      console.error("Publish error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!canDonate) {
      showError("This campaign is not live on-chain yet.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showError("Enter a valid donation amount.");
      return;
    }

    setIsLoading(true);
    try {
      await donate(state.pId, amount);
      setAmount("");
      showSuccess("Donation successful! Thank you for your contribution.");
      navigate("/");
    } catch (error) {
      showError(error.message || "Donation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {(isLoading || actionLoading) && <Loader />}
      <div className="w=full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={state.image}
            alt="campaign"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          <div className="relative w-full h-[5px] bg-secondary-light dark:bg-secondary-dark mt-2">
            <div
              className="absolute h-full bg-accent-primary dark:bg-accent-secondary"
              style={{
                width: `${calculateBarPercentage(
                  state.target,
                  state.amountCollected
                )}%`,
                maxWidth: "100%",
              }}
            ></div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.classes}`}
              >
                {statusMeta.label}
              </span>
              {(canPublish || canEdit) && (
                <div className="flex gap-2">
                  {canPublish && (
                    <CustomButton
                      btnType="button"
                      title="Publish"
                      styles="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 min-h-[32px]"
                      handleClick={handlePublish}
                    />
                  )}
                  {canEdit && (
                    <>
                      <CustomButton
                        btnType="button"
                        title="Edit"
                        styles="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 min-h-[32px]"
                        handleClick={handleEdit}
                      />
                      {canDelete && (
                        <CustomButton
                          btnType="button"
                          title="Delete"
                          styles="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 min-h-[32px]"
                          handleClick={handleDelete}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {statusValue === "rejected" && state.rejectionReason && (
                <p className="text-sm text-red-500 dark:text-red-300">
                  Reason: {state.rejectionReason}
                </p>
              )}
              {!canDonate && statusValue !== "rejected" && (
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  Awaiting admin approval before donations go live.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox
            title={`Raised of ${state.target}`}
            value={state.amountCollected}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>
      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-[#1a8b9d] dark:text-[#fff5f5] uppercase">
              Creator
            </h4>
            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-secondary-light dark:bg-secondary-dark cursor-pointer transition-colors duration-200">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-text-light dark:text-text-dark break-all transition-colors duration-200">
                  {state.owner}
                </h4>
                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#000000]/60 dark:text-gray-400 transition-colors duration-200">
                  10 Campaigns
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-text-light dark:text-text-dark uppercase transition-colors duration-200">
              Story
            </h4>
            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#000000]/80 dark:text-gray-400 leading-[26px] text-justify transition-colors duration-200">
                {state.description}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-[12px] p-5 shadow-sm transition-colors duration-200">
            <button
              type="button"
              className="w-full flex items-center justify-between text-left"
              onClick={() => setIsAnalysisOpen((prev) => !prev)}
            >
              <span className="font-epilogue font-semibold text-[18px] text-text-light dark:text-text-dark uppercase">
                AI Analysis
              </span>
              <span className="text-accent-primary dark:text-accent-secondary font-semibold">
                {isAnalysisOpen ? "−" : "+"}
              </span>
            </button>
            {isAnalysisOpen && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl font-bold ${trustScore !== null
                        ? getTrustColor(trustScore)
                        : "text-gray-500 dark:text-gray-400"
                      }`}
                  >
                    {trustScore !== null ? trustScore : "--"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {aiAnalysis
                      ? `Analyzed at ${analyzedAt}`
                      : "Analysis pending..."}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-red-500 dark:text-red-300 mb-2 flex items-center gap-2">
                    <span role="img" aria-hidden="true">
                      ⚠️
                    </span>
                    Risk Factors
                  </p>
                  {riskFactors.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {riskFactors.map((factor, index) => (
                        <li key={`${factor}-${index}`}>{factor}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No major risk factors detected.
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-500 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <span role="img" aria-hidden="true">
                      💡
                    </span>
                    Recommendations
                  </p>
                  {recommendations.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {recommendations.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No additional recommendations at this time.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-[#1a8b9d] dark:text-[#fff5f5] uppercase">
              Donators
            </h4>
            <div className="mt-[20px] flex flex-col gap-4">
              {donators.length > 0 ? (
                donators.map((item, index) => (
                  <div
                    key={`${item.donator} - ${index}`}
                    className="flex justify-between items-center gap-4"
                  >
                    <p className="font-epilogue font-normal text-[16px] text-[#000000] dark:text-text-dark leading-[26px] break-ll transition-colors duration-200">
                      {index + 1}. {item.donator}
                    </p>
                    <p className="font-epilogue font-normal text-[16px] text-[#1a8b9d] dark:text-gray-400 leading-[26px] break-ll transition-colors duration-200">
                      {item.donation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-epilogue font-normal text-[16px] text-[#1a8b9d] dark:text-gray-400 leading-[26px] text-justify">
                  No donators yet. Be the first one!
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-[#1a8b9d] dark:text-[#fff5f5] uppercase">
            Fund
          </h4>
          <div className="mt-[20px] flex flex-col p-4 bg-secondary-light dark:bg-secondary-dark rounded-[10px] transition-colors duration-200">
            <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-text-light dark:text-text-dark transition-colors duration-200">
              Fund the Campaign
            </p>
            <div className="mt-[30px]">
              <input
                type="number"
                placeholder="ETH 0.1"
                step="0.01"
                disabled={!canDonate}
                className={`w-full py-[10px] sm:px-[20px] px-[15px] outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-darkBg font-epilogue text-text-light dark:text-text-dark text-[18px] leading-[30px] placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-[10px] transition-colors duration-200 ${!canDonate ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="my-[20px] p-4 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-[10px] transition-colors duration-200">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-text-light dark:text-text-dark transition-colors duration-200">
                  Be part of something meaningful.
                </h4>
                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  Back campaigns that resonate with you, just because they
                  matter.
                </p>
              </div>
              <CustomButton
                btnType="button"
                title={canDonate ? "Fund Campaign" : "Not Live Yet"}
                styles={`w-full transition-colors duration-200 ${canDonate
                    ? "bg-accent-primary hover:bg-accent-hover-primary dark:bg-accent-secondary dark:hover:bg-accent-hover-secondary"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  }`}
                handleClick={canDonate ? handleDonate : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Updates Section */}
      <div className="mt-[60px]">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-epilogue font-semibold text-[18px] text-[#1a8b9d] dark:text-[#fff5f5] uppercase">
            Updates ({updates.length})
          </h4>
          {userType === "creator" && isOwner && (
            <CustomButton
              btnType="button"
              title="Post Update"
              styles="bg-accent-primary hover:bg-accent-hover-primary dark:bg-accent-secondary dark:hover:bg-accent-hover-secondary text-white text-sm px-4 py-2"
              handleClick={handleEdit}
            />
          )}
        </div>
        {updates.length === 0 ? (
          <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {isOwner
                ? "No updates yet. Click 'Post Update' to share progress with your backers."
                : "No updates available yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((update) => (
                <UpdateCard
                  key={update._id}
                  update={update}
                  isOwner={isOwner}
                />
              ))}
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditCampaignModal
          campaign={state}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${state.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default CampaignDetails;
