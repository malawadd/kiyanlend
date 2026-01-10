import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("borrower"), v.literal("lender"), v.literal("both")),
    allowAssessments: v.boolean(),
    credits: v.number(),
  }).index("by_user", ["userId"]),

  wallets: defineTable({
    userId: v.id("users"),
    address: v.string(),
    nickname: v.string(),
    isPrimary: v.boolean(),
    connectedAt: v.number(),
    humanityScore: v.optional(v.number()),
    lastScoreUpdate: v.optional(v.number()),
    isHumanityVerified: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_address", ["address"]),

  documents: defineTable({
    userId: v.id("users"),
    loanRequestId: v.optional(v.id("loanRequests")), // Link documents to specific loan requests
    vaultRef: v.string(),
    filename: v.string(),
    category: v.string(),
    uploadedAt: v.number(),
    isDeleted: v.boolean(),
    // AI Analysis fields
    documentType: v.optional(v.string()),
    keyDetails: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    confidence: v.optional(v.number()),
    rawOutput: v.optional(v.string()), // Store complete OpenAI response
  })
    .index("by_user", ["userId"])
    .index("by_loan_request", ["loanRequestId"]),

  loanRequests: defineTable({
    userId: v.id("users"),
    shortId: v.string(), // URL-safe unique identifier
    amount: v.number(),
    duration: v.number(),
    purpose: v.string(),
    note: v.optional(v.string()),
    allowAssessments: v.boolean(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    payoutWallet: v.optional(v.id("wallets")),
    isPublished: v.optional(v.boolean()),
    // Blockchain integration fields
    blockchainTxHash: v.optional(v.string()),
    isOnChain: v.optional(v.boolean()),
    // Funding fields
    isFunded: v.optional(v.boolean()),
    fundedBy: v.optional(v.string()),
    fundingTxHash: v.optional(v.string()),
    payoutWalletAddress: v.optional(v.string()),

  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_shortId", ["shortId"])
    .index("by_blockchain", ["isOnChain"])
    .index("by_funding", ["isFunded"]),

  assessmentRequests: defineTable({
    lenderId: v.id("users"),
    borrowerId: v.id("users"),
    loanRequestId: v.optional(v.id("loanRequests")),
    status: v.string(), // pending, processing, completed, declined
    fee: v.number(),
    trustScore: v.optional(v.number()),
    summaryBullets: v.optional(v.array(v.string())),
    riskFactors: v.optional(v.array(v.string())), // New AI field
    recommendations: v.optional(v.array(v.string())), // New AI field
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
  })
    .index("by_lender", ["lenderId"])
    .index("by_borrower", ["borrowerId"])
    .index("by_status", ["status"]),

  uploadHistory: defineTable({
    userId: v.id("users"),
    action: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  // Nillion keypairs for SecretVaults
  keypairs: defineTable({
    userId: v.id("users"),
    publicKey: v.string(),
    privateKey: v.string(), // Encrypted or stored securely
    did: v.string(), // Decentralized identifier
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_did", ["did"]),
});
