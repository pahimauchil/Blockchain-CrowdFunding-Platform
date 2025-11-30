import React, { useEffect, useState, useCallback } from "react";
import { CustomButton, Loader, ConfirmDialog, PromptDialog } from "../../components";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../constants/api";

/**
 * EditApprovals - Campaign edit approval queue
 * Shows campaigns with pending edits requiring admin approval
 */
const EditApprovals = () => {
  const { authToken, address, connect } = useStateContext();
  const { showError, showSuccess } = useNotification();
  const [pendingEdits, setPendingEdits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [editToReject, setEditToReject] = useState(null);


  const fetchPendingEdits = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/admin/campaigns/pending-edits`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load pending edits");
      }

      setPendingEdits(data || []);
    } catch (error) {
      showError(error.message || "Unable to load pending edits.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, authToken, showError]);

  useEffect(() => {
    fetchPendingEdits();
  }, [fetchPendingEdits]);

  const handleApproveEdit = async (campaignId, editId) => {
    if (!authToken) {
      showError("Please reconnect your wallet to approve edits.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/campaigns/${campaignId}/approve-edit/${editId}`,
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
        throw new Error(data?.message || "Failed to approve edit");
      }

      showSuccess("Edit approved and applied to campaign!");
      fetchPendingEdits();
    } catch (error) {
      showError(error.message || "Approval failed.");
      console.error("Approve edit error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectEdit = (campaignId, editId) => {
    if (!authToken) {
      showError("Please reconnect your wallet to reject edits.");
      return;
    }

    setEditToReject({ campaignId, editId });
    setShowRejectPrompt(true);
  };

  const handleConfirmReject = async (reason) => {
    if (!reason || !editToReject) {
      setShowRejectPrompt(false);
      setEditToReject(null);
      return;
    }

    const { campaignId, editId } = editToReject;
    setShowRejectPrompt(false);
    setEditToReject(null);

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/campaigns/${campaignId}/reject-edit/${editId}`,
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
        throw new Error(data?.message || "Failed to reject edit");
      }

      showSuccess("Edit rejected.");
      fetchPendingEdits();
    } catch (error) {
      showError(error.message || "Rejection failed.");
      console.error("Reject edit error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to review edit requests.
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
        <div className="mb-6">
          <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark">
            Edit Approvals
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and approve campaign edit requests from creators.
          </p>
        </div>

        {pendingEdits.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No pending edit requests.
          </p>
        ) : (
          <div className="space-y-6">
            {pendingEdits.map((item) => {
              const { campaignId, campaignTitle, owner, edit } = item;
              const changes = edit.changes || {};

              return (
                <div
                  key={`${campaignId}-${edit._id}`}
                  className="border border-accent-primary/10 rounded-xl p-5 bg-white dark:bg-secondary-dark"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-text-light dark:text-text-dark">
                      {campaignTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Owner: {owner} • Edited: {new Date(edit.editedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="space-y-4 mb-4">
                    {Object.keys(changes).map((field) => {
                      const change = changes[field];
                      return (
                        <div
                          key={field}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              Current ({field})
                            </p>
                            <p className="text-sm text-text-light dark:text-text-dark">
                              {typeof change.old === "object" && change.old instanceof Date
                                ? change.old.toLocaleString()
                                : String(change.old || "N/A")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              Proposed ({field})
                            </p>
                            <p className="text-sm text-accent-primary dark:text-accent-secondary font-medium">
                              {typeof change.new === "object" && change.new instanceof Date
                                ? change.new.toLocaleString()
                                : String(change.new || "N/A")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-accent-primary/10">
                    <CustomButton
                      btnType="button"
                      title="Approve Edit"
                      styles={`bg-green-600 text-white hover:bg-green-700 ${actionLoading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      handleClick={() =>
                        !actionLoading && handleApproveEdit(campaignId, edit._id)
                      }
                    />
                    <CustomButton
                      btnType="button"
                      title="Reject Edit"
                      styles={`bg-red-500 text-white hover:bg-red-600 ${actionLoading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      handleClick={() =>
                        !actionLoading && handleRejectEdit(campaignId, edit._id)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PromptDialog
        isOpen={showRejectPrompt}
        title="Reject Edit Request"
        message="Please provide a reason for rejecting this edit:"
        placeholder="Enter rejection reason..."
        onSubmit={handleConfirmReject}
        onCancel={() => {
          setShowRejectPrompt(false);
          setEditToReject(null);
        }}
        submitText="Reject"
        cancelText="Cancel"
        required={true}
        minLength={3}
      />
    </div>
  );
};

export default EditApprovals;
