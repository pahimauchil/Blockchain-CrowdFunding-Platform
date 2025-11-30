import React from "react";

/**
 * Simple CSS-based bar chart for campaign status breakdown
 * Uses flexbox and CSS gradients for visualization
 */
const StatusBarChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const barWidth = total > 0 ? (item.value / maxValue) * 100 : 0;

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="font-medium text-text-light dark:text-text-dark">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.value}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: item.color,
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusBarChart;

