import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CustomButton, FormField, Loader } from "../components";
import { useStateContext } from "../context";
import { useNotification } from "../context/NotificationContext";
import { API_URL } from "../constants/api";

/**
 * PostUpdate - Component for creators to post updates to deployed campaigns
 * This allows communication with backers without modifying immutable blockchain data
 */
const PostUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const campaign = location.state?.campaign;
  const { authToken, ensureBackendSession, address, userType } = useStateContext();
  const { showError, showSuccess } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
  });


  useEffect(() => {
    if (!campaign && id) {
      // Fetch campaign if not provided via state
      // This would require a campaign fetch function
      console.warn("Campaign not provided, need to fetch");
    }
  }, [campaign, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      showError("Please fill in all fields");
      return;
    }

    try {
      await ensureBackendSession();
    } catch (error) {
      showError(error.message || "Please reconnect your wallet to continue.");
      return;
    }

    setIsLoading(true);
    try {
      // Ensure we have auth token
      if (!authToken) {
        await ensureBackendSession();
      }

      const response = await fetch(`${API_URL}/campaigns/${campaign?._id || id}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken || localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to post update");
      }

      showSuccess("Update submitted for admin review!");
      setForm({ title: "", content: "" });
      navigate(`/campaign-details/${campaign?.title || id}`, { state: campaign });
    } catch (error) {
      showError(error.message || "Failed to post update");
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaign) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark">
          Campaign not found. Please navigate from a campaign page.
        </p>
      </div>
    );
  }

  if (userType !== "creator") {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Only creators can post campaign updates.
        </p>
        <CustomButton
          btnType="button"
          title="Go Back"
          styles="bg-accent-primary text-white hover:bg-accent-hover-primary"
          handleClick={() => navigate(-1)}
        />
      </div>
    );
  }

  if (!campaign.isDeployed && campaign.onChainId === null) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          This campaign is not yet deployed. You can edit it directly instead.
        </p>
        <CustomButton
          btnType="button"
          title="Go Back"
          styles="bg-accent-primary text-white hover:bg-accent-hover-primary"
          handleClick={() => navigate(-1)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md">
      {isLoading && <Loader />}
      <h1 className="text-2xl font-epilogue font-bold text-text-light dark:text-text-dark mb-6">
        Post Campaign Update
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Share progress, milestones, or important information with your backers. Updates require admin approval before being visible to the public.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          labelName="Update Title *"
          placeholder="e.g., 'Milestone Reached!' or 'Important Announcement'"
          inputType="text"
          value={form.title}
          handleChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <FormField
          labelName="Update Content *"
          placeholder="Share your progress, milestones, or any important information..."
          isTextArea
          value={form.content}
          handleChange={(e) => setForm({ ...form, content: e.target.value })}
        />

        <div className="flex gap-4 justify-end">
          <CustomButton
            btnType="button"
            title="Cancel"
            styles="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
            handleClick={() => navigate(-1)}
          />
          <CustomButton
            btnType="submit"
            title="Submit Update"
            styles="bg-accent-primary dark:bg-accent-primary text-white hover:bg-accent-hover-primary"
          />
        </div>
      </form>
    </div>
  );
};

export default PostUpdate;
