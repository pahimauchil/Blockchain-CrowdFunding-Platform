import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "../context";
import { EditCampaignModal, CustomButton, Loader, FundCard, ConfirmDialog, UpdateCard } from "../components";
import { loader } from "../assets";
import { useNotification } from "../context/NotificationContext";
import { normalizeDeadlineSeconds } from "../utils";
import { API_URL } from "../constants/api";

/**
 * Enhanced Profile page with tabs for Campaigns, Updates, and Settings
 * For creators: Shows created campaigns and updates
 * For donors: Shows donated campaigns and donation history
 */
const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]); // For donors: campaigns they donated to
  const [totalDonated, setTotalDonated] = useState("0"); // Total amount donated
  const [updates, setUpdates] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const { showError, showSuccess } = useNotification();

  const { address, contract, getUserCampaigns, authToken, editCampaign, deleteCampaign, userRole, userType, getCampaigns, getDonations, publishToBlockchain } =
    useStateContext();


  // Fetch campaigns created by user (for creators)
  const fetchCampaigns = async () => {
    if (!authToken) {
      setCampaigns([]);
      setErrorMessage("Connect your wallet to view your campaigns.");
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserCampaigns();
      setCampaigns(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to load your campaigns.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch donations made by user (for donors)
  const fetchDonations = async () => {
    if (!authToken || !address) {
      setDonations([]);
      setTotalDonated("0");
      return;
    }

    try {
      setIsLoading(true);
      // Get all campaigns
      const allCampaigns = await getCampaigns();
      
      // Check each campaign for donations from this user
      const userDonations = [];
      let total = 0;

      for (const campaign of allCampaigns) {
        if (campaign.pId !== undefined && campaign.pId !== null) {
          try {
            const campaignDonations = await getDonations(campaign.pId);
            const userDonation = campaignDonations.find(
              (d) => d.donator.toLowerCase() === address.toLowerCase()
            );
            
            if (userDonation) {
              userDonations.push({
                ...campaign,
                donationAmount: userDonation.donation,
              });
              total += parseFloat(userDonation.donation) || 0;
            }
          } catch (error) {
            console.error(`Failed to fetch donations for campaign ${campaign.pId}:`, error);
          }
        }
      }

      setDonations(userDonations);
      setTotalDonated(total.toFixed(4));
    } catch (error) {
      console.error("Failed to fetch donations:", error);
      setDonations([]);
      setTotalDonated("0");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpdates = async () => {
    if (!authToken || !address || userType !== "creator") {
      setUpdates([]);
      return;
    }

    try {
      setIsLoading(true);
      // Fetch all campaigns to get their updates
      const campaignsData = await getUserCampaigns();
      
      // Collect all updates from all campaigns
      const allUpdates = [];
      for (const campaign of campaignsData) {
        try {
          const response = await fetch(`${API_URL}/campaigns/${campaign._id}/updates`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          
          if (response.ok) {
            const campaignUpdates = await response.json();
            campaignUpdates.forEach((update) => {
              allUpdates.push({
                ...update,
                campaignId: campaign._id,
                campaignTitle: campaign.title,
                campaignImage: campaign.image,
              });
            });
          }
        } catch (error) {
          console.error(`Failed to fetch updates for campaign ${campaign._id}:`, error);
        }
      }

      // Sort by date (newest first)
      allUpdates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUpdates(allUpdates);
    } catch (error) {
      console.error("Failed to fetch updates:", error);
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "campaigns") {
      if (userType === "creator") {
    fetchCampaigns();
      } else {
        fetchDonations();
      }
    } else if (activeTab === "updates" && userType === "creator") {
      fetchUpdates();
    }
  }, [activeTab, address, contract, authToken, getUserCampaigns, userType, getCampaigns, getDonations]);

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (campaignId, form) => {
    try {
      setActionLoading(true);
      const response = await editCampaign(campaignId, form);
      const message = response?.message || "Campaign updated successfully!";
      showSuccess(message);
      await fetchCampaigns();
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;

    const campaign = campaignToDelete;
    setShowDeleteConfirm(false);
    setCampaignToDelete(null);

    try {
      setActionLoading(true);
      await deleteCampaign(campaign._id);
      showSuccess("Campaign deleted successfully!");
      await fetchCampaigns();
    } catch (error) {
      showError(error.message || "Failed to delete campaign");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (campaign) => {
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
        ...campaign,
        deadlineInput: campaign.deadline,
      });

      if (!result.success) {
        throw new Error(
          result.error?.message || "Failed to publish campaign."
        );
      }

      // Update backend with onChainId
      const response = await fetch(
        `${API_URL}/campaigns/${campaign._id}/publish`,
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

      showSuccess("Campaign published successfully!");
      await fetchCampaigns();
    } catch (error) {
      showError(error.message || "Publishing failed.");
      console.error("Publish error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNavigate = (campaign) => {
    navigate(`/campaign-details/${campaign.title}`, { state: campaign });
  };

  const handleNavigateToUpdate = (update) => {
    // Find the campaign for this update
    const campaign = campaigns.find((c) => c._id === update.campaignId);
    if (campaign) {
      navigate(`/campaign-details/${campaign.title}`, { state: campaign });
    }
  };


  const now = Math.floor(Date.now() / 1000);
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

  // For donors: tabs are different
  const creatorTabs = [
    { id: "campaigns", label: "My Campaigns", icon: "📋" },
    { id: "updates", label: "My Updates", icon: "📝" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const donorTabs = [
    { id: "campaigns", label: "My Donations", icon: "💝" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const tabs = userType === "creator" ? creatorTabs : donorTabs;

  return (
    <div>
      {actionLoading && <Loader />}
      {errorMessage && (
        <p className="mb-4 text-sm text-red-500 font-medium">{errorMessage}</p>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-epilogue font-semibold text-[24px] text-text-light dark:text-text-dark text-left mb-2">
          {userType === "creator" ? "Creator Profile" : "My Profile"}
      </h1>
        {userType === "donor" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Donated: <span className="font-semibold text-accent-primary dark:text-accent-secondary">{totalDonated} ETH</span>
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-accent-primary/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-epilogue font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "text-accent-primary dark:text-accent-secondary border-b-2 border-accent-primary dark:border-accent-secondary"
                : "text-gray-600 dark:text-gray-400 hover:text-text-light dark:hover:text-text-dark"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "campaigns" && (
        <div>
          {userType === "creator" ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activeCampaigns.length + endedCampaigns.length} total campaigns
                </p>
              </div>

      <div className="flex flex-wrap mt-[20px] gap-[26px]">
        {isLoading && (
          <img
            src={loader}
            alt="loader"
            className="w-[100px] h-[100px] object-contain"
          />
        )}
        {!isLoading && campaigns.length === 0 && (
          <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-gray-500 dark:text-gray-400">
            You have not created any campaigns yet
          </p>
        )}
        {!isLoading &&
          activeCampaigns.map((campaign) => {
            const isOwner = address && campaign.owner && address.toLowerCase() === campaign.owner.toLowerCase();
            const canPublish = isOwner && campaign.status === "approved" && !campaign.isDeployed && !campaign.onChainId;
            const canEdit = userType === "creator" && (campaign.status === "pending" || userRole === "admin");
            
            return (
              <div key={campaign.pId || campaign._id} className="relative">
                <FundCard
                  {...campaign}
                  showStatus={true}
                  handleClick={() => handleNavigate(campaign)}
                />
                {(canPublish || canEdit) && (
                  <div className="mt-2 flex gap-2 justify-end">
                    {canPublish && (
                      <CustomButton
                        btnType="button"
                        title="Publish"
                        styles="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 min-h-[32px]"
                        handleClick={(e) => {
                          e.stopPropagation();
                          handlePublish(campaign);
                        }}
                      />
                    )}
                    {canEdit && (
                      <>
                        <CustomButton
                          btnType="button"
                          title="Edit"
                          styles="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 min-h-[32px]"
                          handleClick={(e) => {
                            e.stopPropagation();
                            handleEdit(campaign);
                          }}
                        />
                        <CustomButton
                          btnType="button"
                          title="Delete"
                          styles="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 min-h-[32px]"
                          handleClick={(e) => {
                            e.stopPropagation();
                            handleDelete(campaign);
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {endedCampaigns.length > 0 && (
        <div className="mt-10">
          <h2 className="font-epilogue font-semibold text-[16px] text-red-600 dark:text-red-400 mb-2">
            Deadline Ended ({endedCampaigns.length})
          </h2>
          <div className="flex flex-wrap gap-[26px]">
            {endedCampaigns.map((campaign) => (
              <FundCard
                key={campaign.pId || campaign._id}
                {...campaign}
                showStatus={true}
                handleClick={() => handleNavigate(campaign)}
              />
            ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Donor view: Show campaigns they donated to */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {donations.length} campaign{donations.length !== 1 ? "s" : ""} supported
                </p>
              </div>

              <div className="flex flex-wrap mt-[20px] gap-[26px]">
                {isLoading && (
                  <img
                    src={loader}
                    alt="loader"
                    className="w-[100px] h-[100px] object-contain"
                  />
                )}
                {!isLoading && donations.length === 0 && (
                  <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-gray-500 dark:text-gray-400">
                    You haven't donated to any campaigns yet. Browse campaigns to get started!
                  </p>
                )}
                {!isLoading &&
                  donations.map((donation) => (
                    <div key={donation.pId || donation._id} className="relative">
                      <FundCard
                        {...donation}
                        showStatus={false}
                        handleClick={() => handleNavigate(donation)}
                      />
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-green-700 dark:text-green-300 font-semibold">
                          You donated: {donation.donationAmount} ETH
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "updates" && userType === "creator" && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {updates.length} total updates across all campaigns
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <img
                src={loader}
                alt="loader"
                className="w-[100px] h-[100px] object-contain"
              />
            </div>
          ) : updates.length === 0 ? (
            <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-gray-500 dark:text-gray-400 text-center py-8">
              You haven't posted any updates yet.
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update._id}
                  className="cursor-pointer"
                  onClick={() => handleNavigateToUpdate(update)}
                >
                  <UpdateCard
                    update={{
                      ...update,
                      title: `${update.title} - ${update.campaignTitle}`,
                    }}
                    isOwner={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-epilogue font-semibold text-text-light dark:text-text-dark mb-4">
            Account Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Type
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userType === "creator" ? "Creator" : "Donor"}
              </p>
            </div>

            {userType === "creator" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-300">
                  ✓ You're a verified creator. You can create and manage campaigns.
                </p>
              </div>
            )}

            {userType === "donor" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You're a donor. You can browse and donate to campaigns.
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Address
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                {address || "Not connected"}
              </p>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCampaign(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Campaign"
        message={
          campaignToDelete
            ? `Are you sure you want to delete "${campaignToDelete.title}"? This action cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCampaignToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default Profile;
