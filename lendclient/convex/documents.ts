import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listDocuments = query({
  args: { loanRequestId: v.optional(v.id("loanRequests")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const query = ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    const documents = await query
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    // Filter by loan request if specified
    if (args.loanRequestId) {
      return documents.filter(doc => doc.loanRequestId === args.loanRequestId);
    }

    return documents.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

export const uploadDocument = mutation({
  args: {
    loanRequestId: v.optional(v.id("loanRequests")),
    vaultRef: v.string(),
    filename: v.string(),
    category: v.string(),
    documentType: v.optional(v.string()),
    keyDetails: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    confidence: v.optional(v.number()),
    rawOutput: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // If loanRequestId is provided, verify ownership
    if (args.loanRequestId) {
      const loanRequest = await ctx.db.get(args.loanRequestId);
      if (!loanRequest || loanRequest.userId !== user._id) {
        throw new Error("Loan request not found or access denied");
      }
    }

    const documentId = await ctx.db.insert("documents", {
      userId: user._id,
      loanRequestId: args.loanRequestId,
      vaultRef: args.vaultRef,
      filename: args.filename,
      category: args.category,
      uploadedAt: Date.now(),
      isDeleted: false,
      documentType: args.documentType,
      keyDetails: args.keyDetails,
      summary: args.summary,
      confidence: args.confidence,
      rawOutput: args.rawOutput,
    });

    // Log upload action
    await ctx.db.insert("uploadHistory", {
      userId: user._id,
      action: `Uploaded ${args.filename}${args.loanRequestId ? ` to loan request` : ''}`,
      timestamp: Date.now(),
    });

    return documentId;
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== user._id) {
      throw new Error("Document not found or access denied");
    }

    await ctx.db.patch(args.documentId, { isDeleted: true });

    // Log deletion action
    await ctx.db.insert("uploadHistory", {
      userId: user._id,
      action: `Deleted ${document.filename}`,
      timestamp: Date.now(),
    });

    return args.documentId;
  },
});

export const getUploadHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const history = await ctx.db
      .query("uploadHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  },
});

export const listDocumentsForLoanRequest = query({
  args: { loanRequestId: v.id("loanRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    // Verify loan request ownership
    const loanRequest = await ctx.db.get(args.loanRequestId);
    if (!loanRequest || loanRequest.userId !== user._id) {
      throw new Error("Loan request not found or access denied");
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_loan_request", (q) => q.eq("loanRequestId", args.loanRequestId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return documents.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

export const getDocumentsForAssessment = query({
  args: {
    borrowerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all documents for the borrower
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.borrowerId))
      .collect();

    return documents.map(doc => ({
      _id: doc._id,
      filename: doc.filename,
      category: doc.category,
      documentType: doc.documentType,
      keyDetails: doc.keyDetails || [],
      summary: doc.summary || `${doc.category} document`,
      rawOutput: doc.rawOutput || "{}",
      uploadedAt: doc.uploadedAt,
    }));
  },
});
