const express = require("express");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const { analyzeCampaign } = require("../services/aiService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const parseDeadline = (deadline) => {
  if (!deadline) return null;

  if (deadline instanceof Date) {
    return deadline;
  }

  const date = new Date(deadline);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const parts = deadline.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  }

  return null;
};

router.post("/", authenticateToken, async (req, res) => {
  try {
    // Check if user is a creator (or admin)
    if (req.user.userType !== "creator" && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only creators can create campaigns. Please sign up as a creator first.",
      });
    }

    const { title, description, target, deadline, image } = req.body;

    if (!title || !description || !target || !deadline || !image) {
      return res
        .status(400)
        .json({ message: "All campaign fields are required." });
    }

    const numericTarget = Number(target);
    if (Number.isNaN(numericTarget) || numericTarget <= 0) {
      return res
        .status(400)
        .json({ message: "Target must be a number greater than 0." });
    }

    const parsedDeadline = parseDeadline(deadline);
    if (!parsedDeadline || parsedDeadline.getTime() <= Date.now()) {
      return res
        .status(400)
        .json({ message: "Deadline must be a future date." });
    }

    // Get creator information for enhanced AI analysis
    const creator = await User.findOne({ 
      walletAddress: req.user.walletAddress.toLowerCase() 
    });
    
    const creatorInfo = creator && creator.userType === "creator" ? {
      name: creator.creatorDetails?.name,
      email: creator.email,
      bio: creator.creatorDetails?.bio,
      hasVerifiedEmail: !!creator.email,
      hasWebsite: !!creator.creatorDetails?.website,
      hasSocialLinks: !!creator.creatorDetails?.socialLinks?.twitter,
    } : null;

    const aiAnalysis = await analyzeCampaign({
      title,
      description,
      target: numericTarget,
      creatorInfo,
    });

    const campaign = await Campaign.create({
      owner: req.user.walletAddress,
      title,
      description,
      target: numericTarget,
      deadline: parsedDeadline,
      image,
      status: "pending",
      aiAnalysis,
    });

    return res.status(201).json({
      message: "Campaign submitted for admin review",
      campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error.message);
    return res.status(500).json({ message: "Failed to submit campaign" });
  }
});

router.get("/", async (_req, res) => {
  try {
    // Only show approved AND deployed campaigns to public
    const campaigns = await Campaign.find({ 
      status: "approved",
      isDeployed: true 
    }).sort({
      createdAt: -1,
    });

    return res.json(campaigns);
  } catch (error) {
    console.error("Get campaigns error:", error.message);
    return res.status(500).json({ message: "Failed to load campaigns" });
  }
});

router.get("/my-campaigns", authenticateToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      owner: req.user.walletAddress,
    }).sort({ createdAt: -1 });

    return res.json(campaigns);
  } catch (error) {
    console.error("Get my campaigns error:", error.message);
    return res.status(500).json({ message: "Failed to load your campaigns" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    return res.json(campaign);
  } catch (error) {
    console.error("Get campaign error:", error.message);
    return res.status(500).json({ message: "Failed to load campaign" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Check ownership or admin role
    const isOwner = campaign.owner.toLowerCase() === req.user.walletAddress.toLowerCase();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only edit your own campaigns",
      });
    }

    // CRITICAL: Cannot edit deployed campaigns (blockchain immutable)
    if (campaign.isDeployed) {
      return res.status(400).json({
        message: "Cannot edit deployed campaigns. Use campaign updates instead.",
      });
    }

    // Only allow editing pending campaigns (not approved/rejected) unless admin
    if (campaign.status !== "pending" && !isAdmin) {
      return res.status(400).json({
        message: "Only pending campaigns can be edited",
      });
    }

    const { title, description, target, deadline, image } = req.body;

    // Track changes for edit history
    const changes = {};
    const oldValues = {
      title: campaign.title,
      description: campaign.description,
      target: campaign.target,
      deadline: campaign.deadline,
      image: campaign.image,
    };

    if (title && title !== campaign.title) {
      changes.title = { old: campaign.title, new: title };
      campaign.title = title;
    }
    if (description && description !== campaign.description) {
      changes.description = { old: campaign.description, new: description };
      campaign.description = description;
    }
    if (target !== undefined) {
      const numericTarget = Number(target);
      if (Number.isNaN(numericTarget) || numericTarget <= 0) {
        return res.status(400).json({ message: "Target must be a number greater than 0." });
      }
      if (numericTarget !== campaign.target) {
        changes.target = { old: campaign.target, new: numericTarget };
      campaign.target = numericTarget;
      }
    }
    if (deadline) {
      const parsedDeadline = parseDeadline(deadline);
      if (!parsedDeadline || parsedDeadline.getTime() <= Date.now()) {
        return res.status(400).json({ message: "Deadline must be a future date." });
      }
      if (parsedDeadline.getTime() !== campaign.deadline.getTime()) {
        changes.deadline = { old: campaign.deadline, new: parsedDeadline };
      campaign.deadline = parsedDeadline;
    }
    }
    if (image && image !== campaign.image) {
      changes.image = { old: campaign.image, new: image };
      campaign.image = image;
    }

    // If no changes, return early
    if (Object.keys(changes).length === 0) {
      return res.json({
        message: "No changes detected",
        campaign,
      });
    }

    // If admin is editing, apply changes immediately
    // Otherwise, create edit history entry for approval
    if (isAdmin) {
      // Admin edits are applied immediately
    // Re-run AI analysis if content changed
    if (title || description || target !== undefined) {
      const aiAnalysis = await analyzeCampaign({
        title: campaign.title,
        description: campaign.description,
        target: campaign.target,
      });
      campaign.aiAnalysis = aiAnalysis;
    }
      await campaign.save();
      return res.json({
        message: "Campaign updated successfully",
        campaign,
      });
    } else {
      // Regular user edits require approval
      // Create edit history entry
      campaign.editHistory.push({
        editedBy: req.user.walletAddress,
        editedAt: new Date(),
        changes: changes,
        status: "pending",
      });

      // Re-run AI analysis with new values for preview
      if (title || description || target !== undefined) {
        const aiAnalysis = await analyzeCampaign({
          title: campaign.title,
          description: campaign.description,
          target: campaign.target,
        });
        campaign.aiAnalysis = aiAnalysis;
      }

    await campaign.save();

    return res.json({
        message: "Edit submitted for admin review",
      campaign,
    });
    }
  } catch (error) {
    console.error("Update campaign error:", error.message);
    return res.status(500).json({ message: "Failed to update campaign" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Check ownership or admin role
    const isOwner = campaign.owner.toLowerCase() === req.user.walletAddress.toLowerCase();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own campaigns",
      });
    }

    // Only allow deleting pending campaigns (not approved) unless admin
    if (campaign.status === "approved" && !isAdmin) {
      return res.status(400).json({
        message: "Approved campaigns cannot be deleted. Contact an admin if needed.",
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Delete campaign error:", error.message);
    return res.status(500).json({ message: "Failed to delete campaign" });
  }
});

// Post campaign update (for deployed campaigns)
router.post("/:id/updates", authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Check ownership
    const isOwner = campaign.owner.toLowerCase() === req.user.walletAddress.toLowerCase();
    if (!isOwner) {
      return res.status(403).json({
        message: "You can only post updates to your own campaigns",
      });
    }

    const { title, content, image, video } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    // Create update entry (auto-approved, no admin review needed)
    campaign.updates.push({
      author: req.user.walletAddress,
      title: title.trim(),
      content: content.trim(),
      image: image ? image.trim() : "",
      video: video ? video.trim() : "",
      createdAt: new Date(),
      status: "approved", // Auto-approve updates
    });

    await campaign.save();

    return res.status(201).json({
      message: "Update posted successfully",
      campaign,
    });
  } catch (error) {
    console.error("Post update error:", error.message);
    return res.status(500).json({ message: "Failed to post update" });
  }
});

// Get campaign updates (public endpoint, no auth required)
router.get("/:id/updates", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const updates = campaign.updates || [];
    
    // Check if user is authenticated and is owner or admin
    let isOwner = false;
    let isAdmin = false;
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isOwner = campaign.owner.toLowerCase() === decoded.walletAddress.toLowerCase();
        isAdmin = decoded.role === "admin";
      } catch (error) {
        // Invalid token, treat as public user
      }
    }

    // For owner/admin, return all updates (including pending/rejected)
    // For public, only return approved updates
    if (isOwner || isAdmin) {
      return res.json(updates);
    } else {
      const approvedUpdates = updates.filter((update) => update.status === "approved");
      return res.json(approvedUpdates);
    }
  } catch (error) {
    console.error("Get updates error:", error.message);
    return res.status(500).json({ message: "Failed to load updates" });
  }
});

// Publish approved campaign to blockchain
router.post("/:id/publish", authenticateToken, async (req, res) => {
  try {
    const { onChainId } = req.body;
    
    if (onChainId === undefined || onChainId === null) {
      return res.status(400).json({ message: "onChainId is required" });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Check ownership
    const isOwner = campaign.owner.toLowerCase() === req.user.walletAddress.toLowerCase();
    if (!isOwner) {
      return res.status(403).json({
        message: "You can only publish your own campaigns",
      });
    }

    // Only allow publishing approved campaigns that haven't been deployed yet
    if (campaign.status !== "approved") {
      return res.status(400).json({
        message: "Only approved campaigns can be published",
      });
    }

    if (campaign.isDeployed) {
      return res.status(400).json({
        message: "Campaign is already published",
      });
    }

    // Update campaign with blockchain deployment info
    campaign.onChainId = Number(onChainId);
    campaign.isDeployed = true;
    campaign.deployedAt = new Date();
    await campaign.save();

    return res.json({ 
      message: "Campaign published successfully", 
      campaign 
    });
  } catch (error) {
    console.error("Publish campaign error:", error.message);
    return res.status(500).json({ message: "Failed to publish campaign" });
  }
});

module.exports = router;

