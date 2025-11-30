const axios = require("axios");

/**
 * AI Campaign Analysis Service
 * 
 * This service analyzes campaign content to provide trust scores, risk factors, and recommendations.
 * 
 * PRIMARY: Groq API (Free, Fast, No Credit Card Required)
 * - Model: llama-3.1-8b-instant (fast) or llama-3.3-70b-versatile (more accurate)
 * - Free tier: 30 requests/minute, 14,400/day
 * - Get API key: https://console.groq.com/keys
 * 
 * FALLBACK: Rule-based analysis (Always works, no API needed)
 * - Uses pattern matching and statistical analysis
 * - Never fails, always returns valid results
 * 
 * The service NEVER blocks campaign creation - if all AI methods fail,
 * it returns a neutral score (50) with appropriate warnings.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant"; // Fast and free, good for analysis

// Cache for analysis results (to avoid hitting rate limits)
const analysisCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clamps trust score to valid range (0-100)
 */
const clampScore = (score) => Math.min(100, Math.max(0, Math.round(score)));

/**
 * Creates a cache key from campaign content
 */
const createCacheKey = (title, description, target) => {
  const normalized = `${title || ""}_${description || ""}_${target || 0}`.toLowerCase().trim();
  return normalized.length > 0 ? normalized : "empty";
};

/**
 * Checks if cached result is still valid
 */
const isCacheValid = (cached) => {
  if (!cached || !cached.timestamp) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
};

// ============================================================================
// RULE-BASED ANALYSIS (FALLBACK - ALWAYS WORKS)
// ============================================================================

/**
 * Performs rule-based analysis without any API calls
 * This is the safety net that always works
 */
const performRuleBasedAnalysis = (title, description, target, creatorInfo) => {
  let trustScore = 50; // Base score
  const riskFactors = [];
  const recommendations = [];

  const descriptionText = `${title} ${description}`.toLowerCase();
  const descLength = (description || "").length;
  const titleLength = (title || "").length;
  const numericTarget = Number(target) || 0;

  // ========================================================================
  // POSITIVE SIGNALS (Add points)
  // ========================================================================

  // Detailed description (150+ words)
  if (descLength >= 750) { // ~150 words at ~5 chars/word
    trustScore += 15;
  } else if (descLength >= 500) {
    trustScore += 10;
  } else if (descLength >= 250) {
    trustScore += 5;
  }

  // Realistic target amount
  if (numericTarget > 0 && numericTarget < 10) {
    trustScore += 10;
  } else if (numericTarget >= 10 && numericTarget < 50) {
    trustScore += 8;
  } else if (numericTarget >= 50 && numericTarget < 100) {
    trustScore += 5;
  }

  // Specific milestones mentioned
  const milestoneKeywords = ["milestone", "phase", "step", "stage", "timeline", "deadline", "schedule"];
  const hasMilestones = milestoneKeywords.some(keyword => descriptionText.includes(keyword));
  if (hasMilestones) {
    trustScore += 10;
  }

  // Professional tone indicators
  const professionalKeywords = ["project", "plan", "organization", "team", "goal", "objective", "strategy"];
  const professionalCount = professionalKeywords.filter(keyword => descriptionText.includes(keyword)).length;
  if (professionalCount >= 3) {
    trustScore += 10;
  } else if (professionalCount >= 2) {
    trustScore += 5;
  }

  // Evidence/credentials mentioned
  const evidenceKeywords = ["registered", "certified", "licensed", "experience", "track record", "previous", "successful"];
  const hasEvidence = evidenceKeywords.some(keyword => descriptionText.includes(keyword));
  if (hasEvidence) {
    trustScore += 10;
  }

  // ========================================================================
  // RED FLAGS (Deduct points)
  // ========================================================================

  // Unrealistic promises
  if (/(guaranteed|100%|guarantee|promise.*return|risk.free)/i.test(descriptionText)) {
    trustScore -= 20;
    riskFactors.push("Uses absolute guarantees or unrealistic promises");
    recommendations.push("Avoid promising guaranteed returns; set realistic expectations");
  }

  // Pressure tactics
  if (/(urgent|act now|limited time|don't miss|hurry|immediate|asap)/i.test(descriptionText)) {
    trustScore -= 15;
    riskFactors.push("Uses high-pressure language or urgency tactics");
    recommendations.push("Clarify timelines without resorting to urgency triggers");
  }

  // Very high target
  if (numericTarget > 100) {
    trustScore -= 15;
    riskFactors.push("Funding target exceeds 100 ETH");
    recommendations.push("Consider lowering the goal or explaining why a high target is needed");
  } else if (numericTarget > 50) {
    trustScore -= 5;
  }

  // Very brief description
  if (descLength < 50) {
    trustScore -= 20;
    riskFactors.push("Description is very brief (less than 50 characters)");
    recommendations.push("Add detailed project information to increase transparency");
  } else if (descLength < 100) {
    trustScore -= 15;
    riskFactors.push("Description is brief (less than 100 characters)");
    recommendations.push("Add more project details to increase transparency");
  } else if (descLength < 200) {
    trustScore -= 10;
    riskFactors.push("Description could be more detailed");
    recommendations.push("Add more specific project details");
  }

  // All caps or excessive punctuation
  const capsRatio = (descriptionText.match(/[A-Z]/g) || []).length / Math.max(descriptionText.length, 1);
  const excessivePunctuation = (descriptionText.match(/[!?]{2,}/g) || []).length;
  if (capsRatio > 0.3 || excessivePunctuation > 2) {
    trustScore -= 10;
    riskFactors.push("Uses excessive capitalization or punctuation");
    recommendations.push("Use professional, clear language");
  }

  // Vague/generic description
  const vagueKeywords = ["help", "support", "money", "fund", "donate", "need"];
  const vagueCount = vagueKeywords.filter(keyword => descriptionText.includes(keyword)).length;
  if (vagueCount >= 4 && descLength < 300) {
    trustScore -= 10;
    riskFactors.push("Description is vague or generic");
    recommendations.push("Add specific project details, goals, and use cases");
  }

  // Suspicious patterns
  if (/(crypto|bitcoin|ethereum|investment|trading|profit|returns)/i.test(descriptionText) && 
      !/(charity|non-profit|donation|cause|help|support)/i.test(descriptionText)) {
    trustScore -= 15;
    riskFactors.push("May be promoting investment rather than a cause");
    recommendations.push("Clarify that this is a donation-based campaign, not an investment");
  }

  // Empty or missing title
  if (!title || title.trim().length < 3) {
    trustScore -= 10;
    riskFactors.push("Campaign title is missing or too short");
    recommendations.push("Add a clear, descriptive title");
  }

  // ========================================================================
  // CREATOR INFORMATION ANALYSIS
  // ========================================================================

  if (creatorInfo) {
    const { name, email, bio, hasVerifiedEmail } = creatorInfo;

    // Verified email increases trust
    if (hasVerifiedEmail) {
      trustScore += 5;
    } else {
      riskFactors.push("Creator email not verified");
      recommendations.push("Verify your email address to increase trust");
    }

    // Bio presence increases trust
    if (bio && bio.length > 100) {
      trustScore += 5;
    } else if (bio && bio.length > 50) {
      trustScore += 3;
    } else if (!bio || bio.length < 20) {
      riskFactors.push("Creator profile lacks detailed bio");
      recommendations.push("Add a comprehensive bio to your creator profile");
    }

    // Name consistency check
    if (name && name.length < 2) {
      riskFactors.push("Creator name appears incomplete");
    }
  }

  // ========================================================================
  // FINAL SCORE ADJUSTMENT
  // ========================================================================

  // Ensure score is within bounds
  trustScore = clampScore(trustScore);

  // If score is too low, add a note
  if (trustScore < 30) {
    recommendations.push("Consider revising your campaign to address the identified concerns");
  }

  return {
    trustScore,
    riskFactors: riskFactors.slice(0, 5), // Limit to 5 most important
    recommendations: recommendations.slice(0, 5), // Limit to 5 most important
    analyzedAt: new Date(),
    sentiment: "ANALYZED",
    analysisMethod: "rule-based"
  };
};

// ============================================================================
// GROQ AI ANALYSIS (PRIMARY METHOD)
// ============================================================================

/**
 * Analyzes campaign using Groq API
 * Returns null if API fails (will fallback to rule-based)
 */
const performGroqAnalysis = async (title, description, target) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log("GROQ_API_KEY not configured, using rule-based analysis");
    return null;
  }

  try {
    const prompt = `Analyze this crowdfunding campaign and provide a trust assessment.

Title: ${title || "N/A"}
Description: ${description || "N/A"}
Target Amount: ${target || 0} ETH

Provide a JSON response with this exact structure:
{
  "trustScore": <number 0-100>,
  "riskFactors": [<array of strings>],
  "recommendations": [<array of strings>],
  "sentiment": "<POSITIVE|NEGATIVE|NEUTRAL>"
}

Guidelines:
- trustScore: 0-100 (50 is neutral, 70+ is good, 30- is suspicious)
- riskFactors: List specific concerns (max 5 items)
- recommendations: List actionable improvements (max 5 items)
- sentiment: Overall tone assessment

Focus on:
- Content quality and detail
- Realistic goals
- Professional tone
- Red flags (guarantees, pressure tactics, vague promises)
- Positive signals (specifics, milestones, evidence)`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing crowdfunding campaigns for trustworthiness. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("Groq API returned empty response");
      return null;
    }

    // Parse JSON response
    let aiResult;
    try {
      aiResult = JSON.parse(content);
    } catch (parseError) {
      console.warn("Failed to parse Groq JSON response:", parseError.message);
      return null;
    }

    // Validate and normalize response
    const trustScore = clampScore(Number(aiResult.trustScore) || 50);
    const riskFactors = Array.isArray(aiResult.riskFactors) 
      ? aiResult.riskFactors.slice(0, 5).filter(f => typeof f === "string")
      : [];
    const recommendations = Array.isArray(aiResult.recommendations)
      ? aiResult.recommendations.slice(0, 5).filter(r => typeof r === "string")
      : [];
    const sentiment = aiResult.sentiment || "NEUTRAL";

    return {
      trustScore,
      riskFactors,
      recommendations,
      analyzedAt: new Date(),
      sentiment: sentiment.toUpperCase(),
      analysisMethod: "groq-ai"
    };

  } catch (error) {
    // Log error but don't throw - we'll fallback to rule-based
    if (error.response) {
      console.warn(`Groq API error (${error.response.status}):`, error.response.data?.error?.message || error.message);
    } else if (error.code === "ECONNABORTED") {
      console.warn("Groq API timeout, using fallback");
    } else {
      console.warn("Groq API error:", error.message);
    }
    return null;
  }
};

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyzes a campaign and returns trust score, risk factors, and recommendations
 * 
 * @param {Object} params - Campaign data
 * @param {string} params.title - Campaign title
 * @param {string} params.description - Campaign description
 * @param {number} params.target - Funding target in ETH
 * @param {Object} params.creatorInfo - Optional creator information
 * @returns {Promise<Object>} Analysis result with trustScore, riskFactors, recommendations
 */
const analyzeCampaign = async ({
  title = "",
  description = "",
  target = 0,
  creatorInfo = null
}) => {
  const baseResult = {
    trustScore: 50,
    riskFactors: [],
    recommendations: [],
    analyzedAt: new Date(),
    sentiment: "UNKNOWN",
    analysisMethod: "fallback"
  };

  // Check if we have content to analyze
  const textToAnalyze = description || title;
  if (!textToAnalyze || textToAnalyze.trim().length === 0) {
    return {
      ...baseResult,
      trustScore: 20,
      riskFactors: ["Campaign description is empty"],
      recommendations: ["Add a detailed description of your campaign"],
      analysisMethod: "empty-content"
    };
  }

  // Check cache first
  const cacheKey = createCacheKey(title, description, target);
  const cached = analysisCache.get(cacheKey);
  if (isCacheValid(cached)) {
    console.log("Using cached analysis result");
    return {
      ...cached.result,
      analyzedAt: new Date() // Update timestamp
    };
  }

  // Try Groq AI first (if configured)
  let aiResult = null;
  if (process.env.GROQ_API_KEY) {
    try {
      aiResult = await performGroqAnalysis(title, description, target);
      if (aiResult) {
        // Cache successful AI result
        analysisCache.set(cacheKey, {
          result: aiResult,
          timestamp: Date.now()
        });
        
        // Merge creator info analysis into AI result
        if (creatorInfo) {
          const ruleBasedCreator = performRuleBasedAnalysis("", "", 0, creatorInfo);
          // Adjust score based on creator info (but keep AI analysis as primary)
          if (ruleBasedCreator.trustScore !== 50) {
            const adjustment = ruleBasedCreator.trustScore - 50;
            aiResult.trustScore = clampScore(aiResult.trustScore + adjustment);
          }
          // Merge risk factors and recommendations
          aiResult.riskFactors = [...aiResult.riskFactors, ...ruleBasedCreator.riskFactors].slice(0, 5);
          aiResult.recommendations = [...aiResult.recommendations, ...ruleBasedCreator.recommendations].slice(0, 5);
        }
        
        return aiResult;
      }
    } catch (error) {
      console.error("Unexpected error in Groq analysis:", error.message);
      // Continue to fallback
    }
  }

  // Fallback to rule-based analysis (always works)
  console.log("Using rule-based analysis (AI API unavailable or not configured)");
  const ruleBasedResult = performRuleBasedAnalysis(title, description, target, creatorInfo);
  
  // Cache rule-based result too
  analysisCache.set(cacheKey, {
    result: ruleBasedResult,
    timestamp: Date.now()
  });

  return ruleBasedResult;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  analyzeCampaign,
  // Export for testing
  performRuleBasedAnalysis,
  performGroqAnalysis
};
