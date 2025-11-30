import React, { useState, useEffect, useMemo } from "react";
import { useStateContext } from "../context";
import { DisplayCampaigns } from '../components';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { address, contract, getCampaigns, searchQuery } = useStateContext();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        // getCampaigns can work without wallet connection (browsing mode)
        const data = await getCampaigns();
        setCampaigns(data || []);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        setCampaigns([]); // Set empty array on error to prevent undefined
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch campaigns regardless of wallet connection (browsing allowed)
    fetchCampaigns();
  }, [getCampaigns]);

  // Filter campaigns based on search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) {
      return campaigns;
    }

    const query = searchQuery.toLowerCase().trim();
    return campaigns.filter((campaign) => {
      const titleMatch = campaign.title?.toLowerCase().includes(query);
      const descriptionMatch = campaign.description?.toLowerCase().includes(query);
      const ownerMatch = campaign.owner?.toLowerCase().includes(query);

      return titleMatch || descriptionMatch || ownerMatch;
    });
  }, [campaigns, searchQuery]);

  return <div>
    <DisplayCampaigns title="All Campaigns"
      isLoading={isLoading}
      campaigns={filteredCampaigns} />
  </div>;
};

export default Home;
