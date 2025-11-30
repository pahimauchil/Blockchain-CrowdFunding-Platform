import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton, FormField, Loader } from "../components";
import { useStateContext } from "../context";
import { useNotification } from "../context/NotificationContext";
import { API_URL } from "../constants/api";

/**
 * CreatorSignup - Page for users to sign up as campaign creators
 * Requires wallet connection and additional verification details
 * 
 * Flow:
 * 1. If no wallet connected -> Show only connect wallet (no sidebar/navbar)
 * 2. After wallet connect -> Check if creator exists in DB
 * 3. If creator exists -> Redirect to profile
 * 4. If creator doesn't exist -> Show signup form (no sidebar/navbar)
 */
const CreatorSignup = () => {
  const navigate = useNavigate();
  const { address, connect, ensureBackendSession, authToken, userType } = useStateContext();
  const { showError, showSuccess } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCreator, setIsCheckingCreator] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    idProofNumber: "",
    bio: "",
    website: "",
    twitter: "",
  });


  // Check if creator already exists after wallet connection
  useEffect(() => {
    const checkExistingCreator = async () => {
      // Always reset form visibility when address/authToken changes
      setShowForm(false);
      
      if (!address) {
        return;
      }

      // If address exists but no token, ensure session first
      if (!authToken) {
        try {
          await ensureBackendSession();
          // Will trigger useEffect again when authToken is set
          return;
        } catch (error) {
          console.error("Failed to ensure backend session:", error);
          return;
        }
      }

      // Now we have both address and authToken
      setIsCheckingCreator(true);
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const user = data?.user;

          // If user is already a creator, redirect to profile
          if (user?.userType === "creator") {
            showSuccess("You're already a verified creator!");
            navigate("/profile");
            return;
          }

          // If user exists but is not a creator, show form
          setShowForm(true);
        } else {
          // If check fails, still show form (might be new user)
          setShowForm(true);
        }
      } catch (error) {
        console.error("Failed to check creator status:", error);
        // On error, show form anyway
        setShowForm(true);
      } finally {
        setIsCheckingCreator(false);
      }
    };

    checkExistingCreator();
  }, [address, authToken, navigate, ensureBackendSession, API_URL, showSuccess]);

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.city.trim() || !form.idProofNumber.trim()) {
      showError("Name, email, phone, city, and ID proof number are required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      showError("Please enter a valid email address");
      return;
    }

    // Ensure wallet is connected
    if (!address) {
      try {
        await connect();
      } catch (error) {
        showError(error.message || "Please connect your wallet first");
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Ensure backend session exists
      await ensureBackendSession();

      const response = await fetch(`${API_URL}/auth/creator-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
          walletAddress: address,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          idProofNumber: form.idProofNumber.trim(),
          bio: form.bio.trim() || undefined,
          website: form.website.trim() || undefined,
          socialLinks: {
            twitter: form.twitter.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create creator account");
      }

      // Update local storage with new token and userType
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      if (data.user?.userType) {
        localStorage.setItem("userType", data.user.userType);
      }

      showSuccess("Creator account created successfully! You can now create campaigns.");
      navigate("/profile");
    } catch (error) {
      showError(error.message || "Failed to create creator account");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: No wallet connected - show only connect wallet
  // Always check address first - don't show form if wallet is not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-primary-light dark:bg-primary-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to sign up as a campaign creator.
          </p>
          <CustomButton
            btnType="button"
            title="Connect Wallet"
            styles="bg-accent-primary text-white hover:bg-accent-hover-primary w-full"
            handleClick={connect}
          />
        </div>
      </div>
    );
  }

  // Step 2: Checking if creator exists or ensuring backend session
  // Show loading while checking or if we don't have authToken yet
  if (isCheckingCreator || !authToken) {
    return (
      <div className="min-h-screen bg-primary-light dark:bg-primary-dark flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Step 3: Show signup form (only after wallet is connected and check is complete)
  if (showForm) {
    return (
      <div className="min-h-screen bg-primary-light dark:bg-primary-dark p-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md">
          {isLoading && <Loader />}
          
          <div className="mb-6">
            <h1 className="text-3xl font-epilogue font-bold text-text-light dark:text-text-dark mb-2">
              Become a Campaign Creator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your profile to start creating campaigns. This information helps us verify creators and improve trust scores.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                labelName="Full Name *"
                placeholder="John Doe"
                inputType="text"
                value={form.name}
                handleChange={(e) => handleFormFieldChange("name", e)}
              />
              <FormField
                labelName="Email *"
                placeholder="john@example.com"
                inputType="email"
                value={form.email}
                handleChange={(e) => handleFormFieldChange("email", e)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                labelName="Phone *"
                placeholder="+1 234 567 8900"
                inputType="tel"
                value={form.phone}
                handleChange={(e) => handleFormFieldChange("phone", e)}
              />
              <FormField
                labelName="City *"
                placeholder="New York"
                inputType="text"
                value={form.city}
                handleChange={(e) => handleFormFieldChange("city", e)}
              />
            </div>

            <FormField
              labelName="ID Proof Number *"
              placeholder="Passport number, National ID, or Driver's License number"
              inputType="text"
              value={form.idProofNumber}
              handleChange={(e) => handleFormFieldChange("idProofNumber", e)}
            />

            <FormField
              labelName="Bio (Optional but Recommended)"
              placeholder="Tell us about yourself, your background, and why you're creating campaigns..."
              isTextArea
              value={form.bio}
              handleChange={(e) => handleFormFieldChange("bio", e)}
            />

            <FormField
              labelName="Website (Optional)"
              placeholder="https://yourwebsite.com"
              inputType="url"
              value={form.website}
              handleChange={(e) => handleFormFieldChange("website", e)}
            />

            <FormField
              labelName="Twitter (Optional)"
              placeholder="@username"
              inputType="text"
              value={form.twitter}
              handleChange={(e) => handleFormFieldChange("twitter", e)}
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Providing more information helps improve your campaign's trust score and increases the likelihood of approval. All information is stored securely and used only for verification purposes.
              </p>
            </div>

            <div className="flex gap-4 justify-end">
              <CustomButton
                btnType="button"
                title="Cancel"
                styles="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                handleClick={() => navigate("/")}
              />
              <CustomButton
                btnType="submit"
                title="Create Creator Account"
                styles="bg-accent-primary dark:bg-accent-primary text-white hover:bg-accent-hover-primary"
              />
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Default: show loading
  return (
    <div className="min-h-screen bg-primary-light dark:bg-primary-dark flex items-center justify-center">
      <Loader />
    </div>
  );
};

export default CreatorSignup;

