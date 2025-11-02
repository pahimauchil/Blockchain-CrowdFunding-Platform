import React, { useState, useEffect, useMemo } from "react";
import { useStateContext } from "../context";
import { DisplayCampaigns } from '../components';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { address, contract, getCampaigns, searchQuery } = useStateContext();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const data = await getCampaigns();
    setCampaigns(data);
    setIsLoading(false);
  }

  useEffect(() => {
    if (contract) fetchCampaigns();
  }, [address, contract]);

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
