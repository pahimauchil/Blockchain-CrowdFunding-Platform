import React from "react";
import { formatDate } from "../utils";

/**
 * UpdateCard - Component for displaying campaign updates
 * Shows update title, content, timestamp, and status
 */
const UpdateCard = ({ update, isOwner = false, onEdit, onDelete }) => {
  const statusBadges = {
    approved: {
      label: "Published",
      classes: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    },
    pending: {
      label: "Pending Review",
      classes: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200",
    },
    rejected: {
      label: "Rejected",
      classes: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    },
  };

  const status = update.status || "approved";
  const statusMeta = statusBadges[status] || statusBadges.approved;

  return (
    <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-1">
            {update.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatDate(update.createdAt)}</span>
            {isOwner && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMeta.classes}`}>
                {statusMeta.label}
              </span>
            )}
          </div>
        </div>
        {isOwner && status === "approved" && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(update)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(update)}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {update.content}
        </p>
      </div>
      {update.image && (
        <div className="mt-3">
          <img
            src={update.image}
            alt="Update"
            className="w-full max-w-2xl rounded-lg object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}
      {update.video && (
        <div className="mt-3">
          {update.video.includes("youtube.com") || update.video.includes("youtu.be") ? (
            <iframe
              src={update.video.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
              title="Update Video"
              className="w-full max-w-2xl h-64 rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={update.video}
              controls
              className="w-full max-w-2xl rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
      {update.rejectionReason && isOwner && status === "rejected" && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            <strong>Rejection reason:</strong> {update.rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
};

export default UpdateCard;

