import React, {
  useContext,
  createContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
  useDisconnect,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { API_URL } from "../constants/api";

const StateContext = createContext();

const resolveAddressValue = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === "string");
    return firstString || null;
  }

  if (typeof value === "object") {
    if (typeof value.address === "string") return value.address;
    if (typeof value.walletAddress === "string") return value.walletAddress;
  }

  return null;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    "0xAB12c29169F8C2d683C91A926c3808300946A32E"
  );
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const connectWallet = useMetamask();
  const disconnectWallet = useDisconnect();
  const [searchQuery, setSearchQuery] = useState("");
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || null
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || "user"
  );
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "donor"
  );


  const storeSession = (token, role = "user", userType = "donor") => {
    setAuthToken(token);
    setUserRole(role);
    setUserType(userType);
    if (token) {
      localStorage.setItem("authToken", token);
    }
    if (role) {
      localStorage.setItem("userRole", role);
    }
    if (userType) {
      localStorage.setItem("userType", userType);
    }
  };

  const clearSession = () => {
    setAuthToken(null);
    setUserRole("user");
    setUserType("donor");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userType");
  };

  const connectWithBackend = useCallback(async () => {
    try {
      let walletAddress = resolveAddressValue(address);

      if (!walletAddress) {
        await connectWallet();

        for (let attempts = 0; attempts < 10 && !walletAddress; attempts += 1) {
          if (typeof window !== "undefined" && window?.ethereum) {
            walletAddress =
              resolveAddressValue(window.ethereum.selectedAddress) ||
              resolveAddressValue(window.ethereum.accounts);

            if (!walletAddress && window.ethereum.request) {
              try {
                const accounts = await window.ethereum.request({
                  method: "eth_accounts",
                });
                walletAddress = resolveAddressValue(accounts);
              } catch (requestError) {
                console.warn("Unable to get accounts", requestError);
              }
            }
          }

          if (!walletAddress) {
            walletAddress = resolveAddressValue(address);
          }

          if (!walletAddress) {
            await wait(200);
          }
        }
      }

      if (!walletAddress) {
        throw new Error("Unable to detect wallet address");
      }

      const normalizedAddress = walletAddress.toLowerCase();

      const response = await fetch(`${API_URL}/auth/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: normalizedAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to authenticate wallet");
      }

      storeSession(
        data.token,
        data.user?.role || "user",
        data.user?.userType || "donor"
      );
      return data;
    } catch (error) {
      console.error("connectWithBackend error:", error);
      throw error;
    }
  }, [API_URL, address, connectWallet]);

  const ensureBackendSession = useCallback(async () => {
    if (authToken) {
      return { token: authToken, role: userRole };
    }
    return connectWithBackend();
  }, [authToken, userRole, connectWithBackend]);

  useEffect(() => {
    const refreshUserRole = async () => {
      if (!authToken) return;

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to refresh user role");
        }

        const data = await response.json();
        if (data?.user?.role) {
          setUserRole(data.user.role);
          localStorage.setItem("userRole", data.user.role);
        }
        if (data?.user?.userType) {
          setUserType(data.user.userType);
          localStorage.setItem("userType", data.user.userType);
        }
      } catch (error) {
        console.error("Failed to refresh user role", error);
      }
    };

    refreshUserRole();
  }, [API_URL, authToken]);

  const fetchChainCampaigns = useCallback(async () => {
    if (!contract) return [];

    try {
      const campaigns = await contract.call("getCampaigns");

      return campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(
          campaign.amountCollected.toString()
        ),
        image: campaign.image,
        pId: i,
      }));
    } catch (error) {
      console.error("fetchChainCampaigns error:", error);
      return [];
    }
  }, [contract]);

  const normalizeDeadlineSeconds = (deadline) => {
    if (!deadline) return 0;

    if (typeof deadline === "number") {
      return deadline >= 1e12 ? Math.floor(deadline / 1000) : deadline;
    }

    const date = new Date(deadline);
    if (!Number.isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000);
    }

    if (typeof deadline === "string") {
      const parts = deadline.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        const normalized = new Date(
          Date.UTC(year, month - 1, day, 23, 59, 59)
        );
        return Math.floor(normalized.getTime() / 1000);
      }
    }

    return 0;
  };

  const mergeCampaignsWithChain = (dbCampaigns, chainCampaigns) => {
    const chainMap = new Map(chainCampaigns.map((item) => [item.pId, item]));

    return dbCampaigns.map((campaign) => {
      const chainData =
        typeof campaign.onChainId === "number"
          ? chainMap.get(campaign.onChainId)
          : null;

      return {
        ...campaign,
        owner: chainData?.owner || campaign.owner,
        target: chainData?.target || String(campaign.target ?? ""),
        amountCollected: chainData?.amountCollected || "0",
        deadline:
          chainData?.deadline || normalizeDeadlineSeconds(campaign.deadline),
        image: campaign.image,
        pId:
          typeof campaign.onChainId === "number"
            ? campaign.onChainId
            : campaign._id,
        status: campaign.status,
        aiAnalysis: campaign.aiAnalysis,
        rejectionReason: campaign.rejectionReason,
      };
    });
  };

  const publishCampaign = async (form) => {
    let token = authToken;
    if (!token) {
      const session = await ensureBackendSession();
      token = session?.token;
    }

    if (!token) {
      throw new Error("Connect your wallet before creating a campaign.");
    }

    try {
      const response = await fetch(`${API_URL}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          target: form.target,
          deadline: form.deadline,
          image: form.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit campaign");
      }

      return data;
    } catch (error) {
      console.error("publishCampaign error:", error);
      throw error;
    }
  };

  const getCampaigns = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns`);
      const dbCampaigns = await response.json();

      if (!response.ok) {
        throw new Error(dbCampaigns?.message || "Failed to fetch campaigns");
      }

      // Try to fetch chain campaigns, but don't fail if contract is not ready
      let chainCampaigns = [];
      try {
        chainCampaigns = await fetchChainCampaigns();
      } catch (chainError) {
        console.warn("Could not fetch chain campaigns (contract may not be ready):", chainError);
        // Continue with DB campaigns only
      }

      return mergeCampaignsWithChain(dbCampaigns, chainCampaigns);
    } catch (error) {
      console.error("getCampaigns error:", error);
      return [];
    }
  }, [API_URL, fetchChainCampaigns]);

  const getUserCampaigns = useCallback(async () => {
    if (!authToken) {
      throw new Error("Connect your wallet to view your campaigns.");
    }

    try {
      const response = await fetch(`${API_URL}/campaigns/my-campaigns`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const dbCampaigns = await response.json();

      if (!response.ok) {
        throw new Error(dbCampaigns?.message || "Failed to fetch campaigns");
      }

      const chainCampaigns = await fetchChainCampaigns();
      return mergeCampaignsWithChain(dbCampaigns, chainCampaigns);
    } catch (error) {
      console.error("getUserCampaigns error:", error);
      throw error;
    }
  }, [API_URL, authToken, fetchChainCampaigns]);

  const getDeadlineSeconds = (deadlineValue) => {
    if (!deadlineValue) return null;

    if (typeof deadlineValue === "number") {
      return deadlineValue >= 1e12
        ? Math.floor(deadlineValue / 1000)
        : deadlineValue;
    }

    const parsedDate = new Date(deadlineValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return Math.floor(parsedDate.getTime() / 1000);
    }

    if (typeof deadlineValue === "string") {
      const parts = deadlineValue.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        const normalized = new Date(
          Date.UTC(year, month - 1, day, 23, 59, 59)
        );
        return Math.floor(normalized.getTime() / 1000);
      }
    }

    return null;
  };

  const publishToBlockchain = async (campaign) => {
    if (!contract || !createCampaign) {
      throw new Error("Smart contract is not ready yet.");
    }

    try {
      const deadlineSeconds =
        getDeadlineSeconds(campaign.deadlineInput || campaign.deadline) || 0;

      if (!deadlineSeconds) {
        throw new Error("Invalid campaign deadline");
      }

      const data = await createCampaign({
        args: [
          campaign.owner,
          campaign.title,
          campaign.description,
          ethers.utils.parseUnits(String(campaign.target || "0"), 18),
          deadlineSeconds,
          campaign.image,
        ],
      });

      console.log("contract call success", data);

      const totalCampaigns = await contract.call("numberOfCampaigns");
      const numericTotal =
        typeof totalCampaigns?.toNumber === "function"
          ? totalCampaigns.toNumber()
          : Number(totalCampaigns);
      const onChainId = Math.max(0, numericTotal - 1);

      return { success: true, data: onChainId };
    } catch (error) {
      console.error("publishToBlockchain error:", error);
      return { success: false, error };
    }
  };

  const donate = async (pId, amount) => {
    if (!contract) {
      throw new Error("Smart contract is not ready yet.");
    }

    const data = await contract.call("donateToCampaign", [pId], {
      value: ethers.utils.parseEther(amount),
    });
    return data;
  };

  const getDonations = useCallback(
    async (pId) => {
      if (!contract) return [];

      const donations = await contract.call("getDonators", [pId]);
      const numberOfDonations = donations[0].length;
      const parsedDonations = [];

      for (let i = 0; i < numberOfDonations; i++) {
        parsedDonations.push({
          donator: donations[0][i],
          donation: ethers.utils.formatEther(donations[1][i].toString()),
        });
      }

      return parsedDonations;
    },
    [contract]
  );

  const editCampaign = async (campaignId, form) => {
    if (!authToken) {
      throw new Error("Connect your wallet before editing a campaign.");
    }

    try {
      // Import date utility dynamically to avoid circular dependencies
      const { dateInputToTimestamp } = await import("../utils/dateUtils");
      
      // Convert date input (YYYY-MM-DD) to timestamp (seconds) if it's a date string
      let deadline = form.deadline;
      if (typeof form.deadline === "string" && form.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
        deadline = dateInputToTimestamp(form.deadline);
        if (!deadline) {
          throw new Error("Invalid deadline date");
        }
      }

      const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          target: form.target,
          deadline: deadline,
          image: form.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update campaign");
      }

      // Return the response data including the message
      return data;
    } catch (error) {
      console.error("editCampaign error:", error);
      throw error;
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!authToken) {
      throw new Error("Connect your wallet before deleting a campaign.");
    }

    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete campaign");
      }

      return data;
    } catch (error) {
      console.error("deleteCampaign error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await disconnectWallet();
      clearSession();
      console.log("Logout successful");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect: connectWithBackend,
        ensureBackendSession,
        disconnect: handleLogout,
        createCampaign: publishCampaign,
        editCampaign,
        deleteCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
        searchQuery,
        setSearchQuery,
        authToken,
        userRole,
        userType,
        publishToBlockchain,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};
export const useStateContext = () => useContext(StateContext);
