// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract MyContract {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donators;
        uint256[] donations;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    uint256 public numberOfCampaigns = 0;

    event CampaignCreated(uint256 indexed campaignId, address indexed owner, uint256 target, uint256 deadline);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);

    function createCampaign(
        address _owner, 
        string memory _title, 
        string memory _description, 
        uint256 _target, 
        uint256 _deadline, 
        string memory _image
    ) public returns (uint256) {
        

        require(_deadline > block.timestamp, "The deadline should be a date in the future");
        require(_target > 0, "Target must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_owner != address(0), "Invalid owner address");
        
        Campaign storage campaign = campaigns[numberOfCampaigns];

        campaign.title = _title;
        campaign.owner = _owner;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;

        emit CampaignCreated(numberOfCampaigns, _owner, _target, _deadline);

        numberOfCampaigns++;
        return numberOfCampaigns - 1; 
    }

    function donateToCampaign(uint256 _id) public payable {
        uint256 amount = msg.value;
     
        require(_id < numberOfCampaigns, "Campaign does not exist");
        require(amount > 0, "Donation must be greater than 0");

        Campaign storage campaign = campaigns[_id];
        
        require(block.timestamp < campaign.deadline, "Campaign has ended");

        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);
        campaign.amountCollected = campaign.amountCollected + amount;

        emit DonationReceived(_id, msg.sender, amount);

    
        (bool sent, ) = payable(campaign.owner).call{value: amount}("");
        require(sent, "Failed to send Ether to campaign owner");
    }

    function getDonators(uint256 _id) view public returns(address[] memory, uint256[] memory) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        return(campaigns[_id].donators, campaigns[_id].donations);
    }

    function getCampaigns() public view returns(Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for(uint i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
        }
        return allCampaigns;
    }
}