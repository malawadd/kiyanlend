import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const createAssessmentRequest = mutation({
  args: {
    borrowerId: v.id("users"),
    loanRequestId: v.optional(v.id("loanRequests")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const lender = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!lender) throw new Error("User not found");

    const lenderProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", lender._id))
      .unique();

    if (!lenderProfile) throw new Error("Profile not found");

    const fee = 0.5;
    if (lenderProfile.credits < fee) {
      throw new Error("Insufficient credits");
    }

    const borrowerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.borrowerId))
      .unique();

    if (!borrowerProfile || !borrowerProfile.allowAssessments) {
      throw new Error("Borrower does not allow assessments");
    }

    await ctx.db.patch(lenderProfile._id, {
      credits: lenderProfile.credits - fee,
    });

    const assessmentId = await ctx.db.insert("assessmentRequests", {
      lenderId: lender._id,
      borrowerId: args.borrowerId,
      loanRequestId: args.loanRequestId,
      status: "pending",
      fee,
      requestedAt: Date.now(),
    });

    return assessmentId;
  },
});

export const approveAssessment = mutation({
  args: {
    assessmentId: v.id("assessmentRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment || assessment.borrowerId !== user._id) {
      throw new Error("Assessment not found");
    }

    if (assessment.status !== "pending") {
      throw new Error("Assessment already processed");
    }

    await ctx.db.patch(args.assessmentId, {
      status: "processing",
    });

    return args.assessmentId;
  },
});

export const declineAssessment = mutation({
  args: {
    assessmentId: v.id("assessmentRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment || assessment.borrowerId !== user._id) {
      throw new Error("Assessment not found");
    }

    if (assessment.status !== "pending") {
      throw new Error("Assessment already processed");
    }

    await ctx.db.patch(args.assessmentId, {
      status: "declined",
      declinedAt: Date.now(),
    });
  },
});

export const processAssessment = action({
  args: {
    assessmentId: v.id("assessmentRequests"),
  },
  handler: async (ctx, args) => {
    // Get the assessment request
    const assessment = await ctx.runQuery(api.assessments.getAssessmentForProcessing, {
      assessmentId: args.assessmentId,
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Get borrower's documents
    const documents = await ctx.runQuery(api.documents.getDocumentsForAssessment, {
      borrowerId: assessment.borrowerId,
    });

    // Get loan request details if available
    let loanAmount = 5000; // Default
    let loanDuration = 12; // Default
    let loanPurpose = "Personal loan"; // Default

    if (assessment.loanRequestId) {
      const loanRequest = await ctx.runQuery(api.loanRequests.getLoanRequestById, {
        loanRequestId: assessment.loanRequestId,
      });
      
      if (loanRequest) {
        loanAmount = loanRequest.amount;
        loanDuration = loanRequest.duration;
        loanPurpose = loanRequest.purpose;
      }
    }

    // Prepare documents data for AI analysis
    const documentsData = documents.map(doc => ({
      filename: doc.filename,
      category: doc.category,
      documentType: doc.documentType || doc.category,
      keyDetails: doc.keyDetails || [],
      summary: doc.summary || `${doc.category} document`,
      rawOutput: doc.rawOutput || "{}",
    }));

    let aiAnalysis;
    
    try {
      // Call AI analysis
      aiAnalysis = await ctx.runAction(api.nilai.analyzeDocumentsWithAI, {
        documentsData,
        loanAmount,
        loanDuration,
        loanPurpose,
      });
    } catch (error) {
      console.error("AI analysis failed:", error);
      
      // Fallback to basic analysis based on documents
      const docCount = documents.length;
      const categories = [...new Set(documents.map(d => d.category))];
      
      aiAnalysis = {
        trustScore: Math.min(85, 50 + (docCount * 8) + (categories.length * 5)),
        summaryBullets: [
          `${docCount} financial documents reviewed`,
          `${categories.length} document categories: ${categories.join(", ")}`,
          "Standard risk assessment completed",
        ],
        riskFactors: docCount < 2 ? ["Limited documentation provided"] : [],
        recommendations: ["Consider additional documentation for enhanced assessment"],
      };
    }

    // Complete the assessment with AI results
    await ctx.runMutation(api.assessments.completeAssessmentWithAI, {
      assessmentId: args.assessmentId,
      trustScore: aiAnalysis.trustScore,
      summaryBullets: aiAnalysis.summaryBullets,
      riskFactors: aiAnalysis.riskFactors,
      recommendations: aiAnalysis.recommendations,
    });
  },
});

export const completeAssessment = mutation({
  args: {
    assessmentId: v.id("assessmentRequests"),
    trustScore: v.number(),
    summaryBullets: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment || assessment.status !== "processing") {
      throw new Error("Assessment not found or not in processing state");
    }

    await ctx.db.patch(args.assessmentId, {
      status: "completed",
      trustScore: args.trustScore,
      summaryBullets: args.summaryBullets,
      completedAt: Date.now(),
    });
  },
});

export const getAssessmentForProcessing = query({
  args: {
    assessmentId: v.id("assessmentRequests"),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment || assessment.status !== "processing") {
      return null;
    }
    return assessment;
  },
});

export const completeAssessmentWithAI = mutation({
  args: {
    assessmentId: v.id("assessmentRequests"),
    trustScore: v.number(),
    summaryBullets: v.array(v.string()),
    riskFactors: v.array(v.string()),
    recommendations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment || assessment.status !== "processing") {
      throw new Error("Assessment not found or not in processing state");
    }

    await ctx.db.patch(args.assessmentId, {
      status: "completed",
      trustScore: args.trustScore,
      summaryBullets: args.summaryBullets,
      riskFactors: args.riskFactors,
      recommendations: args.recommendations,
      completedAt: Date.now(),
    });
  },
});

export const listBorrowerAssessments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const assessments = await ctx.db
      .query("assessmentRequests")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", user._id))
      .collect();

    const assessmentsWithLenders = await Promise.all(
      assessments.map(async (assessment) => {
        const lenderUser = await ctx.db.get(assessment.lenderId);
        const lenderProfile = lenderUser
          ? await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", lenderUser._id))
              .unique()
          : null;

        return {
          ...assessment,
          lenderName: lenderProfile?.displayName || "Unknown",
        };
      })
    );

    return assessmentsWithLenders.sort((a, b) => b.requestedAt - a.requestedAt);
  },
});

export const listLenderAssessments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const assessments = await ctx.db
      .query("assessmentRequests")
      .withIndex("by_lender", (q) => q.eq("lenderId", user._id))
      .collect();

    const assessmentsWithBorrowers = await Promise.all(
      assessments.map(async (assessment) => {
        const borrowerUser = await ctx.db.get(assessment.borrowerId);
        const borrowerProfile = borrowerUser
          ? await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
              .unique()
          : null;

        const loanRequest = assessment.loanRequestId
          ? await ctx.db.get(assessment.loanRequestId)
          : null;

        return {
          ...assessment,
          borrowerName: borrowerProfile?.displayName || "Unknown",
          amount: loanRequest?.amount,
          duration: loanRequest?.duration,
        };
      })
    );

    return assessmentsWithBorrowers.sort((a, b) => b.requestedAt - a.requestedAt);
  },
});
