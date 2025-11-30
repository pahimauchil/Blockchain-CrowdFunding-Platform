import React, { useEffect, useState, useCallback, useMemo } from "react";
import { CustomButton, Loader, ConfirmDialog, PromptDialog } from "../../components";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { getTrustColor } from "../../utils";
import { API_URL } from "../../constants/api";

/**
 * PendingCampaigns - Campaign approval queue page
 * Extracted from AdminDashboard for better organization
 */
const PendingCampaigns = () => {
  const {
    authToken,
    address,
    connect,
  } = useStateContext();
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [campaignToReject, setCampaignToReject] = useState(null);
  const { showError, showSuccess } = useNotification();

  // Search, filter, sort, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [trustFilter, setTrustFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 10;


  const fetchPendingCampaigns = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await fetch(`${API_URL}/admin/campaigns/pending`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load campaigns");
      }

      setPendingCampaigns(data);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load pending campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, authToken]);

  useEffect(() => {
    fetchPendingCampaigns();
  }, [fetchPendingCampaigns]);

  const handleApprove = async (campaign) => {
    if (!authToken) {
      showError("Please reconnect your wallet to approve campaigns.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/campaigns/${campaign._id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to approve campaign.");
      }

      showSuccess("Campaign approved! Creator can now publish it.");
      fetchPendingCampaigns();
    } catch (error) {
      showError(error.message || "Approval failed.");
      console.error("Approve error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (campaignId) => {
    if (!authToken) {
      showError("Please reconnect your wallet to reject campaigns.");
      return;
    }

    setCampaignToReject(campaignId);
    setShowRejectPrompt(true);
  };

  const handleConfirmReject = async (reason) => {
    if (!reason) {
      setShowRejectPrompt(false);
      setCampaignToReject(null);
      return;
    }

    setShowRejectPrompt(false);
    const campaignId = campaignToReject;
    setCampaignToReject(null);

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/campaigns/${campaignId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to reject campaign.");
      }

      showSuccess("Campaign rejected.");
      fetchPendingCampaigns();
    } catch (error) {
      showError(error.message || "Rejection failed.");
      console.error("Reject error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and sort pending campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = [...pendingCampaigns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((campaign) =>
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Trust score filter
    if (trustFilter !== "all") {
      filtered = filtered.filter((campaign) => {
        const score = campaign.aiAnalysis?.trustScore;
        if (score === null || score === undefined) return false;
        if (trustFilter === "high") return score >= 70;
        if (trustFilter === "medium") return score >= 40 && score < 70;
        if (trustFilter === "low") return score < 40;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "highest-trust") {
        const scoreA = a.aiAnalysis?.trustScore ?? 0;
        const scoreB = b.aiAnalysis?.trustScore ?? 0;
        return scoreB - scoreA;
      } else if (sortBy === "lowest-trust") {
        const scoreA = a.aiAnalysis?.trustScore ?? 0;
        const scoreB = b.aiAnalysis?.trustScore ?? 0;
        return scoreA - scoreB;
      }
      return 0;
    });

    return filtered;
  }, [pendingCampaigns, searchQuery, trustFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCampaigns.length / campaignsPerPage);
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * campaignsPerPage;
    return filteredAndSortedCampaigns.slice(startIndex, startIndex + campaignsPerPage);
  }, [filteredAndSortedCampaigns, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, trustFilter, sortBy]);

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to review campaigns.
        </p>
        <CustomButton
          btnType="button"
          title="Connect Wallet"
          styles="bg-accent-primary text-white hover:bg-accent-hover-primary"
          handleClick={connect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(isLoading || actionLoading) && <Loader />}

      <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark">
              Pending Campaigns
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review AI trust scores before publishing on-chain.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
              />
            </div>
            <select
              value={trustFilter}
              onChange={(e) => setTrustFilter(e.target.value)}
              className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
            >
              <option value="all">All Trust Scores</option>
              <option value="high">High (70-100)</option>
              <option value="medium">Medium (40-70)</option>
              <option value="low">Low (0-40)</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-trust">Highest Trust</option>
              <option value="lowest-trust">Lowest Trust</option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedCampaigns.length} of {filteredAndSortedCampaigns.length} campaigns
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 font-medium mb-4">{errorMessage}</p>
        )}

        {paginatedCampaigns.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {pendingCampaigns.length === 0
              ? "No campaigns waiting for approval."
              : "No campaigns match your filters."}
          </p>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedCampaigns.map((campaign) => {
                const ai = campaign.aiAnalysis || {};
                const score =
                  typeof ai.trustScore === "number" ? ai.trustScore : null;
                const riskFactors = ai.riskFactors || [];
                const recommendations = ai.recommendations || [];
                const analyzedAt = ai.analyzedAt
                  ? new Date(ai.analyzedAt).toLocaleString()
                  : "Pending";
                return (
                  <div
                    key={campaign._id}
                    className="border border-accent-primary/10 rounded-xl p-5 bg-white dark:bg-secondary-dark"
                  >
                    <div className="flex flex-col lg:flex-row gap-5">
                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full lg:w-60 h-48 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold text-text-light dark:text-text-dark">
                              {campaign.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Owner: {campaign.owner}
                            </p>
                          </div>
                          <div
                            className={`text-lg font-bold ${score !== null ? getTrustColor(score) : "text-gray-500"}`}
                          >
                            🛡️ Trust {score !== null ? score : "--"}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          {campaign.description}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <p>
                            Target:{" "}
                            <span className="font-semibold">
                              {campaign.target} ETH
                            </span>
                          </p>
                          <p>
                            Deadline:{" "}
                            <span className="font-semibold">
                              {campaign.deadline
                                ? new Date(campaign.deadline).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </p>
                          <p>
                            AI Sentiment:{" "}
                            <span className="font-semibold">{ai.sentiment || "N/A"}</span>
                          </p>
                          <p>
                            Analyzed:{" "}
                            <span className="font-semibold">{analyzedAt}</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold text-red-500 dark:text-red-300 mb-2">
                              ⚠️ Risk Factors
                            </p>
                            {riskFactors.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                {riskFactors.map((factor, index) => (
                                  <li key={`${campaign._id}-risk-${index}`}>
                                    {factor}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No critical risks detected.
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-blue-500 dark:text-blue-300 mb-2">
                              💡 Recommendations
                            </p>
                            {recommendations.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                {recommendations.map((item, index) => (
                                  <li
                                    key={`${campaign._id}-rec-${index}`}
                                    className="leading-5"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No additional recommendations.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-accent-primary/10">
                          <CustomButton
                            btnType="button"
                            title="Approve"
                            styles={`bg-green-600 text-white hover:bg-green-700 ${actionLoading ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            handleClick={() =>
                              !actionLoading && handleApprove(campaign)
                            }
                          />
                          <CustomButton
                            btnType="button"
                            title="Reject"
                            styles={`bg-red-500 text-white hover:bg-red-600 ${actionLoading ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            handleClick={() =>
                              !actionLoading && handleReject(campaign._id)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-accent-primary/10">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PromptDialog
        isOpen={showRejectPrompt}
        title="Reject Campaign"
        message="Please provide a brief reason for rejecting this campaign:"
        placeholder="Enter rejection reason..."
        onSubmit={handleConfirmReject}
        onCancel={() => {
          setShowRejectPrompt(false);
          setCampaignToReject(null);
        }}
        submitText="Reject"
        cancelText="Cancel"
        required={true}
        minLength={3}
      />
    </div>
  );
};

export default PendingCampaigns;

