import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CustomButton, FormField, Loader } from "./";
import { checkIfImage, timestampToDateInput, dateInputToTimestamp } from "../utils";
import { useNotification } from "../context/NotificationContext";
import { useStateContext } from "../context";
import { API_URL } from "../constants/api";

const EditCampaignModal = ({ campaign, isOpen, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const { showError, showSuccess } = useNotification();
  const { authToken, address, userType, ensureBackendSession } = useStateContext();
  const [form, setForm] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  });
  const [updateForm, setUpdateForm] = useState({
    title: "",
    content: "",
    image: "",
    video: "",
  });
  const [isDeployed, setIsDeployed] = useState(false);

  useEffect(() => {
    if (campaign && isOpen) {
      // Check if campaign is deployed to blockchain
      setIsDeployed(campaign.isDeployed === true || campaign.onChainId !== null);

      // Use utility function to convert timestamp to date input format
      const deadlineStr = timestampToDateInput(campaign.deadline);

      setForm({
        title: campaign.title || "",
        description: campaign.description || "",
        target: campaign.target?.toString() || "",
        deadline: deadlineStr,
        image: campaign.image || "",
      });
    }
  }, [campaign, isOpen]);

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleUpdateFormChange = (fieldName, e) => {
    setUpdateForm({ ...updateForm, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent editing deployed campaigns
    if (isDeployed) {
      showError("Cannot edit deployed campaigns. Use campaign updates instead.");
      return;
    }

    checkIfImage(form.image, async (exists) => {
      if (!exists) {
        showError("Provide valid image URL");
        setForm({ ...form, image: "" });
        return;
      }

      try {
        setIsLoading(true);
        await onSave(campaign._id, form);
        onClose();
      } catch (error) {
        showError(error.message || "Failed to update campaign");
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();

    if (!updateForm.title.trim() || !updateForm.content.trim()) {
      showError("Title and content are required");
      return;
    }

    // Check if user is a creator and the owner
    if (userType !== "creator") {
      showError("Only creators can post campaign updates");
      return;
    }
    if (!address || address.toLowerCase() !== campaign.owner.toLowerCase()) {
      showError("You can only post updates to your own campaigns");
      return;
    }

    try {
      await ensureBackendSession();
    } catch (error) {
      showError(error.message || "Please reconnect your wallet to continue.");
      return;
    }

    setIsPostingUpdate(true);
    try {
      const token = authToken || localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/campaigns/${campaign._id}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: updateForm.title.trim(),
          content: updateForm.content.trim(),
          image: updateForm.image.trim() || undefined,
          video: updateForm.video.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to post update");
      }

      showSuccess("Update posted successfully!");
      setUpdateForm({ title: "", content: "", image: "", video: "" });
      // Refresh the page to show the new update
      window.location.reload();
    } catch (error) {
      showError(error.message || "Failed to post update");
    } finally {
      setIsPostingUpdate(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-secondary-dark rounded-xl p-6 sm:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[10000]">
        {isLoading && <Loader />}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-epilogue font-bold text-2xl text-text-light dark:text-text-dark">
            Edit Campaign
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {isDeployed && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>⚠️ This campaign is live on blockchain.</strong> Editing core details (title, description, target, deadline) is not allowed as blockchain data is immutable. 
              You can post campaign updates instead to communicate changes to backers.
            </p>
          </div>
        )}

        {/* Campaign Details Section (Read-only if deployed) */}
        <div className="mb-6">
          <h3 className="font-epilogue font-semibold text-lg text-text-light dark:text-text-dark mb-4">
            Campaign Details {isDeployed && <span className="text-sm text-gray-500">(Read-only)</span>}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex-1">
                <FormField
                  labelName="Campaign Title *"
                  placeholder="Write a Title"
                  inputType="text"
                  value={form.title}
                  handleChange={(e) => handleFormFieldChange("title", e)}
                  disabled={isDeployed}
                />
                {isDeployed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cannot edit after deployment
                  </p>
                )}
              </div>
              <div className="flex-1">
                <FormField
                  labelName="Goal (ETH) *"
                  placeholder="0.50"
                  inputType="text"
                  value={form.target}
                  handleChange={(e) => handleFormFieldChange("target", e)}
                  disabled={isDeployed}
                />
                {isDeployed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cannot edit after deployment
                  </p>
                )}
              </div>
            </div>

            <div>
              <FormField
                labelName="Story *"
                placeholder="Write your story"
                isTextArea
                value={form.description}
                handleChange={(e) => handleFormFieldChange("description", e)}
                disabled={isDeployed}
              />
              {isDeployed && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cannot edit after deployment
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex-1">
                <FormField
                  labelName="End Date *"
                  placeholder="End Date"
                  inputType="date"
                  value={form.deadline}
                  handleChange={(e) => handleFormFieldChange("deadline", e)}
                  disabled={isDeployed}
                />
                {isDeployed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cannot edit after deployment
                  </p>
                )}
              </div>
              <div className="flex-1">
                <FormField
                  labelName="Campaign Image *"
                  placeholder="Place image URL of your campaign"
                  inputType="url"
                  value={form.image}
                  handleChange={(e) => handleFormFieldChange("image", e)}
                  disabled={isDeployed}
                />
                {isDeployed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cannot edit after deployment
                  </p>
                )}
              </div>
            </div>

            {!isDeployed && (
              <div className="flex gap-4 justify-end mt-4">
                <CustomButton
                  btnType="button"
                  title="Cancel"
                  styles="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                  handleClick={onClose}
                />
                <CustomButton
                  btnType="submit"
                  title="Save Changes"
                  styles="bg-[#1a8b9d] dark:bg-[#1a8b9d] text-white hover:bg-[#1a8b9d]/90"
                />
              </div>
            )}
          </form>
        </div>

        {/* Post Update Section */}
        {isDeployed && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-epilogue font-semibold text-lg text-text-light dark:text-text-dark mb-4">
              Post an Update
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Share progress, milestones, or important information with your backers. Updates are immediately visible.
            </p>
            <form onSubmit={handlePostUpdate} className="flex flex-col gap-6">
              <FormField
                labelName="Update Title *"
                placeholder="e.g., 'Milestone Reached!' or 'Important Announcement'"
                inputType="text"
                value={updateForm.title}
                handleChange={(e) => handleUpdateFormChange("title", e)}
              />

              <FormField
                labelName="Update Content *"
                placeholder="Share your progress, milestones, or any important information..."
                isTextArea
                value={updateForm.content}
                handleChange={(e) => handleUpdateFormChange("content", e)}
              />

              <div className="flex flex-wrap gap-6">
                <div className="flex-1">
                  <FormField
                    labelName="Image URL (Optional)"
                    placeholder="Place image URL for this update"
                    inputType="url"
                    value={updateForm.image}
                    handleChange={(e) => handleUpdateFormChange("image", e)}
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    labelName="Video URL (Optional)"
                    placeholder="Place video URL or embed link"
                    inputType="url"
                    value={updateForm.video}
                    handleChange={(e) => handleUpdateFormChange("video", e)}
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-4">
                <CustomButton
                  btnType="button"
                  title="Cancel"
                  styles="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                  handleClick={onClose}
                />
                <CustomButton
                  btnType="submit"
                  title={isPostingUpdate ? "Posting..." : "Post Update"}
                  styles="bg-accent-primary dark:bg-accent-primary text-white hover:bg-accent-hover-primary"
                  disabled={isPostingUpdate}
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EditCampaignModal;
