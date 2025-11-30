import React from "react";

/**
 * Simple line chart showing monthly campaign trends
 * Uses CSS for the line and dots
 */
const MonthlyTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.count), 1);
  const minValue = Math.min(...data.map((item) => item.count), 0);
  const range = maxValue - minValue || 1;

  // Calculate positions for SVG path
  const width = 100;
  const height = 200;
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const y =
      height - ((item.count - minValue) / range) * height;
    return { x, y, value: item.count, label: item.month };
  });

  // Create SVG path
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-64"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y * 2}
            x2={width}
            y2={y * 2}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-300 dark:text-gray-700"
            opacity="0.5"
          />
        ))}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent-primary dark:text-accent-secondary"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="currentColor"
              className="text-accent-primary dark:text-accent-secondary"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="currentColor"
              className="text-accent-primary dark:text-accent-secondary opacity-20"
            />
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex-1 text-center truncate"
            title={item.month}
          >
            {item.month.split(" ")[0]}
          </div>
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-500 pr-2">
        <span>{maxValue}</span>
        <span>{Math.round((maxValue + minValue) / 2)}</span>
        <span>{minValue}</span>
      </div>
    </div>
  );
};

export default MonthlyTrendChart;

