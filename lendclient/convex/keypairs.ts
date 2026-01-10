import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get or create user keypair
export const getOrCreateKeypair = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Check if keypair already exists
    const existing = await ctx.db
      .query("keypairs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      return existing;
    }
    
    // Will be created via API call that generates the actual keypair
    return null;
  },
});

// Store user keypair (called from API after generation)
export const storeKeypair = mutation({
  args: {
    userId: v.id("users"),
    publicKey: v.string(),
    privateKey: v.string(),
    did: v.string(),
  },
  handler: async (ctx, { userId, publicKey, privateKey, did }) => {
    return await ctx.db.insert("keypairs", {
      userId,
      publicKey,
      privateKey,
      did,
      createdAt: Date.now(),
    });
  },
});

// Get user keypair
export const getUserKeypair = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("keypairs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});