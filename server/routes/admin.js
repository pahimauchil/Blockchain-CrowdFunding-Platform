const express = require("express");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Donation = require("../models/Donation");
const { analyzeCampaign } = require("../services/aiService");

const router = express.Router();

router.get("/campaigns/pending", async (_req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "pending" }).sort({
      createdAt: 1,
    });
    return res.json(campaigns);
  } catch (error) {
    console.error("Pending campaigns error:", error.message);
    return res.status(500).json({ message: "Failed to fetch pending campaigns" });
  }
});

router.post("/campaigns/:id/approve", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "approved") {
      return res
        .status(400)
        .json({ message: "Campaign is already approved." });
    }

    // Approve campaign - only update status, don't set deployment info
    campaign.status = "approved";
    campaign.rejectionReason = undefined;
    // Note: onChainId and isDeployed will be set when creator publishes
    await campaign.save();

    return res.json({ message: "Campaign approved. Creator can now publish it.", campaign });
  } catch (error) {
    console.error("Approve campaign error:", error.message);
    return res.status(500).json({ message: "Failed to approve campaign" });
  }
});

router.post("/campaigns/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    campaign.status = "rejected";
    campaign.rejectionReason = reason;
    campaign.onChainId = null;
    await campaign.save();

    return res.json({ message: "Campaign rejected", campaign });
  } catch (error) {
    console.error("Reject campaign error:", error.message);
    return res.status(500).json({ message: "Failed to reject campaign" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCampaigns,
      pendingCampaigns,
      approvedCampaigns,
      rejectedCampaigns,
      totalUsers,
      allCampaigns,
      campaignsThisMonth,
      campaignsLastMonth,
      allDonations,
    ] = await Promise.all([
        Campaign.countDocuments(),
        Campaign.countDocuments({ status: "pending" }),
        Campaign.countDocuments({ status: "approved" }),
      Campaign.countDocuments({ status: "rejected" }),
        User.countDocuments(),
      Campaign.find({}).select("aiAnalysis target status createdAt"),
      Campaign.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),
      Campaign.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      Donation.find({}).select("amount campaignId"),
    ]);

    // Calculate average trust score
    const campaignsWithScores = allCampaigns.filter(
      (c) => c.aiAnalysis && typeof c.aiAnalysis.trustScore === "number"
    );
    const averageTrustScore =
      campaignsWithScores.length > 0
        ? Math.round(
            campaignsWithScores.reduce(
              (sum, c) => sum + c.aiAnalysis.trustScore,
              0
            ) / campaignsWithScores.length
          )
        : 0;

    // Count high-risk campaigns (trust score < 40)
    const highRiskCampaigns = campaignsWithScores.filter(
      (c) => c.aiAnalysis.trustScore < 40
    ).length;

    // Calculate approval rate
    const totalSubmitted = totalCampaigns;
    const approvalRate =
      totalSubmitted > 0
        ? Math.round((approvedCampaigns / totalSubmitted) * 100)
        : 0;

    // Get top risk factors
    const riskFactorCounts = {};
    allCampaigns.forEach((campaign) => {
      if (campaign.aiAnalysis && Array.isArray(campaign.aiAnalysis.riskFactors)) {
        campaign.aiAnalysis.riskFactors.forEach((factor) => {
          riskFactorCounts[factor] = (riskFactorCounts[factor] || 0) + 1;
        });
      }
    });
    const topRiskFactors = Object.entries(riskFactorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    // Calculate total donors (unique wallet addresses)
    const uniqueDonors = new Set(allDonations.map((d) => d.donor));
    const totalDonors = uniqueDonors.size;

    // Calculate total raised (sum of all donations)
    const totalRaised = allDonations.reduce(
      (sum, d) => sum + parseFloat(d.amount || 0),
      0
    );

    // Calculate average donation
    const averageDonation =
      allDonations.length > 0
        ? totalRaised / allDonations.length
        : 0;

    // Calculate month-over-month change for total campaigns
    const totalCampaignsLastMonth = await Campaign.countDocuments({
      createdAt: { $lt: startOfMonth },
    });
    const totalCampaignsMoMChange =
      totalCampaignsLastMonth > 0
        ? Math.round(((totalCampaigns - totalCampaignsLastMonth) / totalCampaignsLastMonth) * 100)
        : 0;

    // Calculate rejection rate
    const rejectionRate =
      totalSubmitted > 0
        ? Math.round((rejectedCampaigns / totalSubmitted) * 100)
        : 0;

    // Get active users this week (users who created campaigns or made donations)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const activeUsersThisWeek = new Set();
    
    // Users who created campaigns this week
    const recentCampaigns = await Campaign.find({
      createdAt: { $gte: oneWeekAgo },
    }).select("owner");
    recentCampaigns.forEach((c) => activeUsersThisWeek.add(c.owner));

    // Users who made donations this week
    const recentDonations = await Donation.find({
      createdAt: { $gte: oneWeekAgo },
    }).select("donor");
    recentDonations.forEach((d) => activeUsersThisWeek.add(d.donor));

    // Trust score distribution (0-40 red, 40-70 yellow, 70-100 green)
    const trustDistribution = {
      low: campaignsWithScores.filter((c) => c.aiAnalysis.trustScore < 40).length,
      medium: campaignsWithScores.filter(
        (c) => c.aiAnalysis.trustScore >= 40 && c.aiAnalysis.trustScore < 70
      ).length,
      high: campaignsWithScores.filter((c) => c.aiAnalysis.trustScore >= 70).length,
    };

    // Monthly trends for last 6 months
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthCampaigns = await Campaign.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });
      monthlyTrends.push({
        month: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
        count: monthCampaigns,
      });
    }

    return res.json({
      totalCampaigns,
      pendingCampaigns,
      approvedCampaigns,
      rejectedCampaigns,
      totalUsers,
      totalDonors,
      averageTrustScore,
      highRiskCampaigns,
      campaignsThisMonth,
      campaignsLastMonth,
      approvalRate,
      rejectionRate,
      topRiskFactors,
      totalRaised: totalRaised.toFixed(4),
      averageDonation: averageDonation.toFixed(4),
      totalCampaignsMoMChange,
      activeUsersThisWeek: activeUsersThisWeek.size,
      trustDistribution,
      monthlyTrends,
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/activity", async (_req, res) => {
  try {
    const campaigns = await Campaign.find({})
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("title status createdAt updatedAt rejectionReason owner")
      .lean();

    const activities = campaigns.map((campaign) => {
      let action = "";
      let description = "";

      if (campaign.status === "pending") {
        action = "submitted";
        description = `Campaign "${campaign.title}" was submitted for review`;
      } else if (campaign.status === "approved") {
        action = "approved";
        description = `Campaign "${campaign.title}" was approved and published`;
      } else if (campaign.status === "rejected") {
        action = "rejected";
        description = `Campaign "${campaign.title}" was rejected${
          campaign.rejectionReason ? `: ${campaign.rejectionReason}` : ""
        }`;
      }

      return {
        id: campaign._id,
        type: action,
        description,
        campaignTitle: campaign.title,
        owner: campaign.owner,
        timestamp: campaign.updatedAt || campaign.createdAt,
      };
    });

    return res.json(activities);
  } catch (error) {
    console.error("Admin activity error:", error.message);
    return res.status(500).json({ message: "Failed to fetch activity" });
  }
});

// Get pending edit requests
router.get("/campaigns/pending-edits", async (_req, res) => {
  try {
    const campaigns = await Campaign.find({
      "editHistory.status": "pending",
      isDeployed: false, // Only show edits for non-deployed campaigns
    })
      .select("title owner editHistory")
      .lean();

    // Filter to only include campaigns with pending edits
    const campaignsWithPendingEdits = campaigns
      .map((campaign) => {
        const pendingEdit = campaign.editHistory.find(
          (edit) => edit.status === "pending"
        );
        if (pendingEdit) {
          return {
            campaignId: campaign._id,
            campaignTitle: campaign.title,
            owner: campaign.owner,
            edit: pendingEdit,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    return res.json(campaignsWithPendingEdits);
  } catch (error) {
    console.error("Pending edits error:", error.message);
    return res.status(500).json({ message: "Failed to fetch pending edits" });
  }
});

// Approve edit
router.post("/campaigns/:id/approve-edit/:editId", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.isDeployed) {
      return res.status(400).json({
        message: "Cannot approve edits for deployed campaigns",
      });
    }

    const edit = campaign.editHistory.id(req.params.editId);
    if (!edit) {
      return res.status(404).json({ message: "Edit not found" });
    }

    if (edit.status !== "pending") {
      return res.status(400).json({ message: "Edit is not pending" });
    }

    // Apply changes
    Object.keys(edit.changes).forEach((field) => {
      campaign[field] = edit.changes[field].new;
    });

    // Update edit status
    edit.status = "approved";
    edit.reviewedBy = req.user?.walletAddress || "admin";
    edit.reviewedAt = new Date();

    // Re-run AI analysis if content changed
    if (edit.changes.title || edit.changes.description || edit.changes.target) {
      const aiAnalysis = await analyzeCampaign({
        title: campaign.title,
        description: campaign.description,
        target: campaign.target,
      });
      campaign.aiAnalysis = aiAnalysis;
    }

    await campaign.save();

    return res.json({
      message: "Edit approved and applied",
      campaign,
    });
  } catch (error) {
    console.error("Approve edit error:", error.message);
    return res.status(500).json({ message: "Failed to approve edit" });
  }
});

// Reject edit
router.post("/campaigns/:id/reject-edit/:editId", async (req, res) => {
  try {
    const { reason } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const edit = campaign.editHistory.id(req.params.editId);
    if (!edit) {
      return res.status(404).json({ message: "Edit not found" });
    }

    if (edit.status !== "pending") {
      return res.status(400).json({ message: "Edit is not pending" });
    }

    // Update edit status
    edit.status = "rejected";
    edit.reviewedBy = req.user?.walletAddress || "admin";
    edit.reviewedAt = new Date();
    edit.rejectionReason = reason || "No reason provided";

    await campaign.save();

    return res.json({
      message: "Edit rejected",
      campaign,
    });
  } catch (error) {
    console.error("Reject edit error:", error.message);
    return res.status(500).json({ message: "Failed to reject edit" });
  }
});

// Get pending campaign updates
router.get("/updates/pending", async (_req, res) => {
  try {
    const campaigns = await Campaign.find({
      "updates.status": "pending",
    })
      .select("title owner updates")
      .lean();

    // Extract pending updates with campaign info
    const pendingUpdates = [];
    campaigns.forEach((campaign) => {
      campaign.updates
        .filter((update) => update.status === "pending")
        .forEach((update) => {
          pendingUpdates.push({
            updateId: update._id.toString(),
            campaignId: campaign._id.toString(),
            campaignTitle: campaign.title,
            owner: campaign.owner,
            update: {
              _id: update._id,
              title: update.title,
              content: update.content,
              author: update.author,
              createdAt: update.createdAt,
            },
          });
        });
    });

    return res.json(pendingUpdates);
  } catch (error) {
    console.error("Pending updates error:", error.message);
    return res.status(500).json({ message: "Failed to fetch pending updates" });
  }
});

// Approve update
router.post("/updates/:updateId/approve", async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      "updates._id": req.params.updateId,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Update not found" });
    }

    const update = campaign.updates.id(req.params.updateId);
    if (!update) {
      return res.status(404).json({ message: "Update not found" });
    }

    if (update.status !== "pending") {
      return res.status(400).json({ message: "Update is not pending" });
    }

    update.status = "approved";
    update.reviewedBy = req.user?.walletAddress || "admin";
    update.reviewedAt = new Date();

    await campaign.save();

    return res.json({
      message: "Update approved",
      campaign,
    });
  } catch (error) {
    console.error("Approve update error:", error.message);
    return res.status(500).json({ message: "Failed to approve update" });
  }
});

// Reject update
router.post("/updates/:updateId/reject", async (req, res) => {
  try {
    const { reason } = req.body;

    const campaign = await Campaign.findOne({
      "updates._id": req.params.updateId,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Update not found" });
    }

    const update = campaign.updates.id(req.params.updateId);
    if (!update) {
      return res.status(404).json({ message: "Update not found" });
    }

    if (update.status !== "pending") {
      return res.status(400).json({ message: "Update is not pending" });
    }

    update.status = "rejected";
    update.reviewedBy = req.user?.walletAddress || "admin";
    update.reviewedAt = new Date();
    update.rejectionReason = reason || "No reason provided";

    await campaign.save();

    return res.json({
      message: "Update rejected",
      campaign,
    });
  } catch (error) {
    console.error("Reject update error:", error.message);
    return res.status(500).json({ message: "Failed to reject update" });
  }
});

// Get all campaigns with filters
router.get("/campaigns", async (req, res) => {
  try {
    const { status, search, sortBy = "newest", page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { owner: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "highest-trust":
        sort = { "aiAnalysis.trustScore": -1 };
        break;
      case "lowest-trust":
        sort = { "aiAnalysis.trustScore": 1 };
        break;
      case "highest-target":
        sort = { target: -1 };
        break;
      case "lowest-target":
        sort = { target: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

    return res.json({
      campaigns,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get all campaigns error:", error.message);
    return res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const { search, userType, role, sortBy = "newest", page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (userType && userType !== "all") {
      query.userType = userType;
    }
    if (role && role !== "all") {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { walletAddress: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "creatorDetails.name": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "name":
        sort = { "creatorDetails.name": 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const campaignsCount = await Campaign.countDocuments({
          owner: user.walletAddress.toLowerCase(),
        });
        const donationsCount = await Donation.countDocuments({
          donor: user.walletAddress.toLowerCase(),
        });
        const totalDonated = await Donation.aggregate([
          { $match: { donor: user.walletAddress.toLowerCase() } },
          { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
        ]);

        return {
          ...user,
          stats: {
            campaignsCount,
            donationsCount,
            totalDonated: totalDonated[0]?.total || 0,
          },
        };
      })
    );

    return res.json({
      users: usersWithStats,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get all users error:", error.message);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update user role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: "User role updated",
      user: {
        _id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error.message);
    return res.status(500).json({ message: "Failed to update user role" });
  }
});

// Get detailed analytics
router.get("/analytics", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get all campaigns and donations
    const [allCampaigns, allDonations] = await Promise.all([
      Campaign.find({}).lean(),
      Donation.find({}).lean(),
    ]);

    // Campaign status breakdown
    const statusBreakdown = {
      pending: allCampaigns.filter((c) => c.status === "pending").length,
      approved: allCampaigns.filter((c) => c.status === "approved").length,
      rejected: allCampaigns.filter((c) => c.status === "rejected").length,
    };

    // Trust score distribution
    const campaignsWithScores = allCampaigns.filter(
      (c) => c.aiAnalysis && typeof c.aiAnalysis.trustScore === "number"
    );
    const trustDistribution = {
      excellent: campaignsWithScores.filter((c) => c.aiAnalysis.trustScore >= 80).length,
      good: campaignsWithScores.filter((c) => c.aiAnalysis.trustScore >= 60 && c.aiAnalysis.trustScore < 80).length,
      medium: campaignsWithScores.filter((c) => c.aiAnalysis.trustScore >= 40 && c.aiAnalysis.trustScore < 60).length,
      low: campaignsWithScores.filter((c) => c.aiAnalysis.trustScore < 40).length,
    };

    // Monthly campaign trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthCampaigns = allCampaigns.filter(
        (c) => new Date(c.createdAt) >= monthStart && new Date(c.createdAt) <= monthEnd
      );
      monthlyTrends.push({
        month: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
        total: monthCampaigns.length,
        approved: monthCampaigns.filter((c) => c.status === "approved").length,
        rejected: monthCampaigns.filter((c) => c.status === "rejected").length,
      });
    }

    // Donation trends
    const donationTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthDonations = allDonations.filter(
        (d) => new Date(d.createdAt) >= monthStart && new Date(d.createdAt) <= monthEnd
      );
      const monthTotal = monthDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      donationTrends.push({
        month: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
        count: monthDonations.length,
        total: monthTotal.toFixed(4),
      });
    }

    // Top risk factors
    const riskFactorCounts = {};
    allCampaigns.forEach((campaign) => {
      if (campaign.aiAnalysis && Array.isArray(campaign.aiAnalysis.riskFactors)) {
        campaign.aiAnalysis.riskFactors.forEach((factor) => {
          riskFactorCounts[factor] = (riskFactorCounts[factor] || 0) + 1;
        });
      }
    });
    const topRiskFactors = Object.entries(riskFactorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([factor, count]) => ({ factor, count }));

    // Top creators by campaigns
    const creatorCampaignCounts = {};
    allCampaigns.forEach((campaign) => {
      const owner = campaign.owner.toLowerCase();
      creatorCampaignCounts[owner] = (creatorCampaignCounts[owner] || 0) + 1;
    });
    const topCreators = Object.entries(creatorCampaignCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([address, count]) => ({ address, campaigns: count }));

    // Top donors
    const donorCounts = {};
    allDonations.forEach((donation) => {
      const donor = donation.donor.toLowerCase();
      if (!donorCounts[donor]) {
        donorCounts[donor] = { count: 0, total: 0 };
      }
      donorCounts[donor].count += 1;
      donorCounts[donor].total += parseFloat(donation.amount || 0);
    });
    const topDonors = Object.entries(donorCounts)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([address, data]) => ({
        address,
        donations: data.count,
        total: data.total.toFixed(4),
      }));

    return res.json({
      statusBreakdown,
      trustDistribution,
      monthlyTrends,
      donationTrends,
      topRiskFactors,
      topCreators,
      topDonors,
    });
  } catch (error) {
    console.error("Analytics error:", error.message);
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

module.exports = router;
