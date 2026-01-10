/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate unique shortId
const generateShortId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createLoanRequest = mutation({
  args: {
    amount: v.number(),
    duration: v.number(),
    purpose: v.string(),
    note: v.optional(v.string()),
    allowAssessments: v.boolean(),
    payoutWallet: v.optional(v.id("wallets")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Generate unique shortId
    let shortId = generateShortId();
    let existing = await ctx.db
      .query("loanRequests")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
    
    while (existing) {
      shortId = generateShortId();
      existing = await ctx.db
        .query("loanRequests")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
    }

    const loanRequestId = await ctx.db.insert("loanRequests", {
      userId: user._id,
      shortId,
      amount: args.amount,
      duration: args.duration,
      purpose: args.purpose,
      note: args.note,
      allowAssessments: args.allowAssessments,
      payoutWallet: args.payoutWallet,
      status: "draft",
      isPublished: false,
      createdAt: Date.now(),
    });

    return { id: loanRequestId, shortId };
  },
});

export const getLoanRequestByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    const loanRequest = await ctx.db
      .query("loanRequests")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();

    if (!loanRequest) return null;

    const user = await ctx.db.get(loanRequest.userId);
    const profile = user 
      ? await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique()
      : null;

    const payoutWallet = loanRequest.payoutWallet 
      ? await ctx.db.get(loanRequest.payoutWallet)
      : null;

    const assessments = await ctx.db
      .query("assessmentRequests")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", loanRequest.userId))
      .filter((q) => q.eq(q.field("loanRequestId"), loanRequest._id))
      .collect();

    return {
      ...loanRequest,
      borrowerName: profile?.displayName || "Unknown",
      payoutWalletAddress: payoutWallet?.address,
      assessmentCount: assessments.length,
    };
  },
});

export const getLoanRequestById = query({
  args: { loanRequestId: v.id("loanRequests") },
  handler: async (ctx, args) => {
    const loanRequest = await ctx.db.get(args.loanRequestId);
    if (!loanRequest) return null;

    return {
      _id: loanRequest._id,
      amount: loanRequest.amount,
      duration: loanRequest.duration,
      purpose: loanRequest.purpose,
      userId: loanRequest.userId,
    };
  },
});

export const updateLoanRequest = mutation({
  args: {
    shortId: v.string(),
    amount: v.optional(v.number()),
    duration: v.optional(v.number()),
    purpose: v.optional(v.string()),
    note: v.optional(v.string()),
    allowAssessments: v.optional(v.boolean()),
    payoutWallet: v.optional(v.id("wallets")),
    status: v.optional(v.string()),
    blockchainTxHash: v.optional(v.string()),
    isOnChain: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
    // Funding fields
    isFunded: v.optional(v.boolean()),
    fundedBy: v.optional(v.string()),
    fundingTxHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const loanRequest = await ctx.db
      .query("loanRequests")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();

    if (!loanRequest || loanRequest.userId !== user._id) {
      throw new Error("Loan request not found or access denied");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.purpose !== undefined) updates.purpose = args.purpose;
    if (args.note !== undefined) updates.note = args.note;
    if (args.allowAssessments !== undefined) updates.allowAssessments = args.allowAssessments;
    if (args.payoutWallet !== undefined) updates.payoutWallet = args.payoutWallet;
    if (args.status !== undefined) updates.status = args.status;
    if (args.blockchainTxHash !== undefined) updates.blockchainTxHash = args.blockchainTxHash;
    if (args.isOnChain !== undefined) updates.isOnChain = args.isOnChain;
    if (args.isPublished !== undefined) updates.isPublished = args.isPublished;
    if (args.isFunded !== undefined) updates.isFunded = args.isFunded;
    if (args.fundedBy !== undefined) updates.fundedBy = args.fundedBy;
    if (args.fundingTxHash !== undefined) updates.fundingTxHash = args.fundingTxHash;

    await ctx.db.patch(loanRequest._id, updates);
    return args.shortId;
  },
});

export const listMyLoanRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const requests = await ctx.db
      .query("loanRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const requestsWithData = await Promise.all(
      requests.map(async (request) => {
        const assessments = await ctx.db
          .query("assessmentRequests")
          .withIndex("by_borrower", (q) => q.eq("borrowerId", user._id))
          .filter((q) => q.eq(q.field("loanRequestId"), request._id))
          .collect();

        const payoutWallet = request.payoutWallet 
          ? await ctx.db.get(request.payoutWallet)
          : null;

        return {
          ...request,
          assessmentCount: assessments.length,
          completedAssessments: assessments.filter(a => a.status === 'completed').length,
          pendingAssessments: assessments.filter(a => a.status === 'pending').length,
          payoutWalletAddress: payoutWallet?.address,
        };
      })
    );

    return requestsWithData.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Keep existing functions for backward compatibility
export const listAllLoanRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const requests = await ctx.db
      .query("loanRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const requestsWithBorrowers = await Promise.all(
      requests.map(async (request) => {
        const borrowerUser = await ctx.db.get(request.userId);
        const borrowerProfile = borrowerUser
          ? await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
              .unique()
          : null;

        const wallets = borrowerUser
          ? await ctx.db
              .query("wallets")
              .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
              .collect()
          : [];

        const existingAssessment = await ctx.db
          .query("assessmentRequests")
          .withIndex("by_borrower", (q) => q.eq("borrowerId", request.userId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .first();

        return {
          ...request,
          borrower: {
            displayName: borrowerProfile?.displayName || "Unknown",
            walletsCount: wallets.length,
            hasScore: !!existingAssessment,
            trustScore: existingAssessment?.trustScore,
          },
        };
      })
    );

    return requestsWithBorrowers
      .filter((req) => req.userId !== user._id)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listPublicLoanRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    // Only show published, active requests
    const requests = await ctx.db
      .query("loanRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const requestsWithBorrowers = await Promise.all(
      requests.map(async (request) => {
        const borrowerUser = await ctx.db.get(request.userId);
        const borrowerProfile = borrowerUser
          ? await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
              .unique()
          : null;

        const wallets = borrowerUser
          ? await ctx.db
              .query("wallets")
              .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
              .collect()
          : [];

        const primaryWallet = wallets.find(w => w.isPrimary);
        
        const existingAssessment = await ctx.db
          .query("assessmentRequests")
          .withIndex("by_lender", (q) => q.eq("lenderId", user._id))
          .filter((q) => q.eq(q.field("borrowerId"), request.userId))
          .first();

        const assessmentCount = await ctx.db
          .query("assessmentRequests")
          .withIndex("by_borrower", (q) => q.eq("borrowerId", request.userId))
          .collect().then(assessments => assessments.filter(a => a.status === 'completed').length);

        return {
          ...request,
          borrower: {
            displayName: borrowerProfile?.displayName || "Unknown",
            walletsCount: wallets.length,
            humanityScore: primaryWallet?.humanityScore,
            hasExistingAssessment: !!existingAssessment,
            existingAssessmentStatus: existingAssessment?.status,
            completedAssessments: assessmentCount,
          },
        };
      })
    );

    return requestsWithBorrowers
      .filter((req) => req.userId !== user._id) // Don't show own requests
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPublicLoanRequestByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const loanRequest = await ctx.db
      .query("loanRequests")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();

    if (!loanRequest) return null;

    // Only return if it's published and active
    if (loanRequest.status !== 'active' || !loanRequest.isPublished) {
      return null;
    }

    // Don't show own requests
    if (loanRequest.userId === user._id) {
      return null;
    }

    const borrowerUser = await ctx.db.get(loanRequest.userId);
    const borrowerProfile = borrowerUser 
      ? await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
          .unique()
      : null;

    const wallets = borrowerUser
      ? await ctx.db
          .query("wallets")
          .withIndex("by_user", (q) => q.eq("userId", borrowerUser._id))
          .collect()
      : [];

    const primaryWallet = wallets.find(w => w.isPrimary);

    const existingAssessment = await ctx.db
      .query("assessmentRequests")
      .withIndex("by_lender", (q) => q.eq("lenderId", user._id))
      .filter((q) => q.eq(q.field("borrowerId"), loanRequest.userId))
      .first();

    const allAssessments = await ctx.db
      .query("assessmentRequests")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", loanRequest.userId))
      .collect();

    return {
      ...loanRequest,
      borrowerName: borrowerProfile?.displayName || "Unknown",
      borrowerWalletsCount: wallets.length,
      borrowerHumanityScore: primaryWallet?.humanityScore,
      borrowerHumanityVerified: primaryWallet?.isHumanityVerified,
      existingAssessment,
      totalAssessments: allAssessments.filter(a => a.status === 'completed').length,
      canRequestAssessment: loanRequest.allowAssessments && !existingAssessment,
      // Include funding fields
      isFunded: loanRequest.isFunded || false,
      fundedBy: loanRequest.fundedBy,
      fundingTxHash: loanRequest.fundingTxHash,
    };
  },
});
