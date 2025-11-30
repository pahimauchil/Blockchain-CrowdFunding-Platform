import React, { useEffect, useState, useCallback, useMemo } from "react";
import { CustomButton, Loader } from "../../components";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { getTrustColor } from "../../utils";
import { API_URL } from "../../constants/api";

/**
 * AllCampaigns - Complete list of all campaigns with advanced filters
 */
const AllCampaigns = () => {
  const { authToken, address, connect } = useStateContext();
  const { showError } = useNotification();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const campaignsPerPage = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const fetchCampaigns = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: campaignsPerPage.toString(),
        sortBy,
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`${API_URL}/admin/campaigns?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load campaigns");
      }

      setCampaigns(data.campaigns || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      showError(error.message || "Unable to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken, currentPage, statusFilter, searchQuery, sortBy, campaignsPerPage, showError, API_URL]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [statusFilter, searchQuery, sortBy]);

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to view campaigns.
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

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
  };

  return (
    <div className="space-y-6">
      {isLoading && <Loader />}

      <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark">
            All Campaigns
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all campaigns ({total} total)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, description, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
            <option value="highest-target">Highest Target</option>
            <option value="lowest-target">Lowest Target</option>
          </select>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No campaigns found.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const score = campaign.aiAnalysis?.trustScore;
                return (
                  <div
                    key={campaign._id}
                    className="border border-accent-primary/10 rounded-xl p-5 bg-white dark:bg-secondary-dark hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full md:w-40 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
                              {campaign.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Owner: {campaign.owner}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[campaign.status] || ""}`}
                            >
                              {campaign.status.toUpperCase()}
                            </span>
                            {score !== null && score !== undefined && (
                              <span className={`text-sm font-bold ${getTrustColor(score)}`}>
                                🛡️ {score}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <span>
                            Target: <strong>{campaign.target} ETH</strong>
                          </span>
                          <span>
                            Deadline:{" "}
                            <strong>
                              {campaign.deadline
                                ? new Date(campaign.deadline).toLocaleDateString()
                                : "N/A"}
                            </strong>
                          </span>
                          <span>
                            Created:{" "}
                            <strong>
                              {new Date(campaign.createdAt).toLocaleDateString()}
                            </strong>
                          </span>
                          {campaign.isDeployed && (
                            <span className="text-green-600 dark:text-green-400">
                              ✓ Deployed (ID: {campaign.onChainId})
                            </span>
                          )}
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
                  Page {currentPage} of {totalPages} ({total} total)
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
    </div>
  );
};

export default AllCampaigns;
