import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listWallets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return wallets.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return b.connectedAt - a.connectedAt;
    });
  },
});

export const addWallet = mutation({
  args: {
    address: v.string(),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const existingWallet = await ctx.db
      .query("wallets")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    if (existingWallet) {
      throw new Error("Wallet already connected");
    }

    const existingWallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const isPrimary = existingWallets.length === 0;

    const walletId = await ctx.db.insert("wallets", {
      userId: user._id,
      address: args.address,
      nickname: args.nickname,
      isPrimary,
      connectedAt: Date.now(),
    });

    return walletId;
  },
});

export const setPrimaryWallet = mutation({
  args: {
    walletId: v.id("wallets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== user._id) {
      throw new Error("Wallet not found");
    }

    const allWallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const w of allWallets) {
      await ctx.db.patch(w._id, { isPrimary: w._id === args.walletId });
    }

    return args.walletId;
  },
});

export const removeWallet = mutation({
  args: {
    walletId: v.id("wallets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== user._id) {
      throw new Error("Wallet not found");
    }

    const allWallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (wallet.isPrimary && allWallets.length === 1) {
      throw new Error("Cannot remove the only primary wallet");
    }

    await ctx.db.delete(args.walletId);

    if (wallet.isPrimary && allWallets.length > 1) {
      const nextWallet = allWallets.find((w) => w._id !== args.walletId);
      if (nextWallet) {
        await ctx.db.patch(nextWallet._id, { isPrimary: true });
      }
    }
  },
});

export const getWalletById = query({
  args: {
    walletId: v.id("wallets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== user._id) {
      return null;
    }

    return wallet;
  },
});

export const updateHumanityScore = mutation({
  args: {
    walletId: v.id("wallets"),
    humanityScore: v.number(),
    lastScoreUpdate: v.number(),
    isHumanityVerified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== user._id) {
      throw new Error("Wallet not found");
    }

    await ctx.db.patch(args.walletId, {
      humanityScore: args.humanityScore,
      lastScoreUpdate: args.lastScoreUpdate,
      isHumanityVerified: args.isHumanityVerified,
    });

    return args.walletId;
  },
});

export const getWalletWithScore = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    return wallet;
  },
});
