import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { CustomButton, Loader } from "../../components";
import StatusBarChart from "../../components/StatusBarChart";
import TrustScoreChart from "../../components/TrustScoreChart";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { getRelativeTime, getTrustColor } from "../../utils";
import { API_URL } from "../../constants/api";

/**
 * Admin Dashboard - Overview page with key metrics and quick actions
 * This is the default admin page showing executive summary
 */
const Dashboard = () => {
  const { authToken, address, connect } = useStateContext();
  const { showError } = useNotification();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  const fetchDashboardData = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_URL}/admin/activity`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      if (!statsRes.ok) {
        throw new Error(statsData?.message || "Failed to load stats");
      }

      setStats(statsData);
      setActivities(Array.isArray(activityData) ? activityData.slice(0, 5) : []);
    } catch (error) {
      showError(error.message || "Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, authToken, showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to view the admin dashboard.
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


  const keyStats = [
    {
      label: "Total Campaigns",
      value: stats?.totalCampaigns ?? 0,
      icon: "📊",
      link: "/admin/campaigns",
    },
    {
      label: "Pending Review",
      value: stats?.pendingCampaigns ?? 0,
      icon: "⏳",
      color: "text-yellow-600 dark:text-yellow-400",
      urgency: stats?.pendingCampaigns > 5,
      link: "/admin/pending",
    },
    {
      label: "Approved",
      value: stats?.approvedCampaigns ?? 0,
      icon: "✅",
      color: "text-green-600 dark:text-green-400",
      link: "/admin/campaigns?status=approved",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: "👥",
      link: "/admin/users",
    },
    {
      label: "Total Raised",
      value: stats?.totalRaised ? `${stats.totalRaised} ETH` : "0 ETH",
      icon: "💰",
      color: "text-accent-primary dark:text-accent-secondary",
    },
    {
      label: "Avg Trust Score",
      value: stats?.averageTrustScore ?? 0,
      icon: "🛡️",
      color: getTrustColor(stats?.averageTrustScore ?? 50),
    },
  ];

  const statusChartData = [
    {
      label: "Pending",
      value: stats?.pendingCampaigns ?? 0,
      color: "#eab308",
    },
    {
      label: "Approved",
      value: stats?.approvedCampaigns ?? 0,
      color: "#22c55e",
    },
    {
      label: "Rejected",
      value: stats?.rejectedCampaigns ?? 0,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {isLoading && <Loader />}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/pending"
          className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-accent-primary/30"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">⏳</div>
            <div>
              <h3 className="font-semibold text-text-light dark:text-text-dark">
                Review Pending Campaigns
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats?.pendingCampaigns ?? 0} waiting for approval
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/edit-approvals"
          className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-accent-primary/30"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">✏️</div>
            <div>
              <h3 className="font-semibold text-text-light dark:text-text-dark">
                Review Edit Requests
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Campaign edit approvals
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-accent-primary/30"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="font-semibold text-text-light dark:text-text-dark">
                View Analytics
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Detailed insights and charts
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {keyStats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link || "#"}
            className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p
              className={`text-3xl font-bold ${stat.color || "text-text-light dark:text-text-dark"} mt-2`}
            >
              {stat.value}
            </p>
            {stat.urgency && (
              <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mt-2">
                ⚠️ High priority
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Campaign Status
          </h3>
          <StatusBarChart data={statusChartData} />
        </div>

        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Trust Score Distribution
          </h3>
          <TrustScoreChart
            distribution={stats?.trustDistribution || { low: 0, medium: 0, high: 0 }}
            total={
              (stats?.trustDistribution?.low || 0) +
              (stats?.trustDistribution?.medium || 0) +
              (stats?.trustDistribution?.high || 0)
            }
          />
        </div>
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
              Recent Activity
            </h3>
            <Link
              to="/admin/activity"
              className="text-sm text-accent-primary dark:text-accent-secondary hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => {
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
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <span className="text-xl">{activityIcons[activity.type] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${activityColors[activity.type] || ""}`}
                    >
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High Priority Alerts */}
      {(stats?.pendingCampaigns > 5 || stats?.highRiskCampaigns > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
            ⚠️ High Priority Alerts
          </h3>
          <ul className="space-y-2">
            {stats.pendingCampaigns > 5 && (
              <li className="text-sm text-yellow-700 dark:text-yellow-400">
                • {stats.pendingCampaigns} campaigns pending review (threshold exceeded)
              </li>
            )}
            {stats.highRiskCampaigns > 0 && (
              <li className="text-sm text-yellow-700 dark:text-yellow-400">
                • {stats.highRiskCampaigns} high-risk campaigns require attention
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

