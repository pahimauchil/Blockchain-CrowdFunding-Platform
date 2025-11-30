import React, { useEffect, useState, useCallback } from "react";
import { CustomButton, Loader } from "../../components";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import StatusBarChart from "../../components/StatusBarChart";
import TrustScoreChart from "../../components/TrustScoreChart";
import MonthlyTrendChart from "../../components/MonthlyTrendChart";
import { API_URL } from "../../constants/api";

/**
 * Analytics - Detailed charts and insights
 */
const Analytics = () => {
  const { authToken, address, connect } = useStateContext();
  const { showError } = useNotification();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load analytics");
      }

      setAnalytics(data);
    } catch (error) {
      showError(error.message || "Unable to load analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken, showError, API_URL]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to view analytics.
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

  if (isLoading) {
    return <Loader />;
  }

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available.</p>
      </div>
    );
  }

  const statusChartData = [
    {
      label: "Pending",
      value: analytics.statusBreakdown?.pending || 0,
      color: "#eab308",
    },
    {
      label: "Approved",
      value: analytics.statusBreakdown?.approved || 0,
      color: "#22c55e",
    },
    {
      label: "Rejected",
      value: analytics.statusBreakdown?.rejected || 0,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark mb-4">
          Analytics Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Comprehensive insights and trends
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Campaign Status Distribution
          </h3>
          <StatusBarChart data={statusChartData} />
        </div>

        {/* Trust Score Distribution */}
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Trust Score Distribution
          </h3>
          <TrustScoreChart
            distribution={analytics.trustDistribution || { low: 0, medium: 0, high: 0 }}
            total={
              (analytics.trustDistribution?.low || 0) +
              (analytics.trustDistribution?.medium || 0) +
              (analytics.trustDistribution?.high || 0)
            }
          />
        </div>
      </div>

      {/* Monthly Trends */}
      {analytics.monthlyTrends && analytics.monthlyTrends.length > 0 && (
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Campaign Trends (Last 12 Months)
          </h3>
          <MonthlyTrendChart 
            data={analytics.monthlyTrends.map(item => ({ 
              month: item.month, 
              count: item.total || 0 
            }))} 
          />
        </div>
      )}

      {/* Top Risk Factors */}
      {analytics.topRiskFactors && analytics.topRiskFactors.length > 0 && (
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Top Risk Factors
          </h3>
          <div className="space-y-2">
            {analytics.topRiskFactors.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.factor}
                </span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {item.count} campaigns
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Creators */}
      {analytics.topCreators && analytics.topCreators.length > 0 && (
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Top Creators
          </h3>
          <div className="space-y-2">
            {analytics.topCreators.map((creator, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {creator.address.slice(0, 10)}...{creator.address.slice(-8)}
                </span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {creator.campaigns} campaigns
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Donors */}
      {analytics.topDonors && analytics.topDonors.length > 0 && (
        <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Top Donors
          </h3>
          <div className="space-y-2">
            {analytics.topDonors.map((donor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {donor.address.slice(0, 10)}...{donor.address.slice(-8)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {donor.donations} donations
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {donor.total} ETH
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
