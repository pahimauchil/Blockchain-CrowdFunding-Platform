const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Donor mode: Simple wallet connection (default)
router.post("/connect", async (req, res) => {
  try {
    const { walletAddress, email } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required" });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      // New user defaults to donor type
      user = await User.create({
        walletAddress: normalizedAddress,
        email,
        userType: "donor",
      });
    } else if (email && !user.email) {
      user.email = email;
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        userType: user.userType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Auth connect error:", error.message);
    return res.status(500).json({ message: "Failed to authenticate wallet" });
  }
});

// Creator signup: Complete profile with additional details
router.post("/creator-signup", async (req, res) => {
  try {
    const {
      walletAddress,
      name,
      email,
      phone,
      city,
      idProofNumber,
      bio,
      website,
      socialLinks,
    } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required" });
    }

    if (!name || !email || !phone || !city || !idProofNumber) {
      return res.status(400).json({
        message: "Name, email, phone, city, and ID proof number are required for creator accounts",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      // Create new creator account
      user = await User.create({
        walletAddress: normalizedAddress,
        email: email.toLowerCase().trim(),
        userType: "creator",
        creatorDetails: {
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          idProofNumber: idProofNumber.trim(),
          bio: bio?.trim(),
          website: website?.trim(),
          socialLinks: {
            twitter: socialLinks?.twitter?.trim(),
          },
        },
      });
    } else {
      // Upgrade existing user to creator
      user.userType = "creator";
      user.email = email.toLowerCase().trim();
      user.creatorDetails = {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        idProofNumber: idProofNumber.trim(),
        bio: bio?.trim(),
        website: website?.trim(),
        socialLinks: {
          twitter: socialLinks?.twitter?.trim(),
        },
      };
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        userType: user.userType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        userType: user.userType,
        creatorDetails: user.creatorDetails,
      },
    });
  } catch (error) {
    console.error("Creator signup error:", error.message);
    return res.status(500).json({ message: "Failed to create creator account" });
  }
});

router.get("/me", authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;

