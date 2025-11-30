import React, { useEffect, useState, useCallback } from "react";
import { CustomButton, Loader } from "../../components";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { getRelativeTime } from "../../utils";
import { API_URL } from "../../constants/api";

/**
 * ActivityLog - Complete activity history
 */
const ActivityLog = () => {
  const { authToken, address, connect } = useStateContext();
  const { showError } = useNotification();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchActivities = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/admin/activity`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load activity");
      }

      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      showError(error.message || "Unable to load activity log.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken, showError, API_URL]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to view activity log.
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

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.type === filter;
  });

  const activityIcons = {
    submitted: "📝",
    approved: "✅",
    rejected: "❌",
  };

  const activityColors = {
    submitted: "text-blue-600 dark:text-blue-400",
    approved: "text-green-600 dark:text-green-400",
    rejected: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      {isLoading && <Loader />}

      <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark">
              Activity Log
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete history of all campaign activities ({filteredActivities.length} entries)
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
          >
            <option value="all">All Activities</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredActivities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No activities found.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-2xl">{activityIcons[activity.type] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${activityColors[activity.type] || ""}`}
                  >
                    {activity.description}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Campaign: {activity.campaignTitle}</span>
                    <span>Owner: {activity.owner.slice(0, 10)}...{activity.owner.slice(-8)}</span>
                    <span>{getRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
