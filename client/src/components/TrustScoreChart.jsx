import React from "react";

/**
 * Horizontal bar chart showing trust score distribution
 * Color-coded: 0-40 red, 40-70 yellow, 70-100 green
 */
const TrustScoreChart = ({ distribution, total }) => {
  const categories = [
    {
      label: "High Risk (0-40)",
      value: distribution.low || 0,
      color: "#ef4444", // red-500
      bgColor: "bg-red-100 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-300",
    },
    {
      label: "Medium Risk (40-70)",
      value: distribution.medium || 0,
      color: "#eab308", // yellow-500
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      textColor: "text-yellow-700 dark:text-yellow-300",
    },
    {
      label: "Low Risk (70-100)",
      value: distribution.high || 0,
      color: "#22c55e", // green-500
      bgColor: "bg-green-100 dark:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-300",
    },
  ];

  const maxValue = Math.max(...categories.map((c) => c.value), 1);

  return (
    <div className="space-y-4">
      {categories.map((category, index) => {
        const percentage = total > 0 ? (category.value / total) * 100 : 0;
        const barWidth = total > 0 ? (category.value / maxValue) * 100 : 0;

        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span
                className={`font-medium ${category.textColor} ${category.bgColor} px-3 py-1 rounded-full`}
              >
                {category.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  {category.value}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: category.color,
                }}
              >
                {category.value > 0 && (
                  <span className="text-xs font-semibold text-white">
                    {category.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrustScoreChart;

