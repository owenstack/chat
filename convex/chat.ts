import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getRooms = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}
		const userId = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.unique()
			.then((user) => {
				if (!user) {
					throw new Error("User not found");
				}
				return user._id;
			});
		const results = await ctx.db
			.query("rooms")
			.withIndex("by_member", (q) => q.eq("memberIds", [userId]))
			.order("desc")
			.paginate(args.paginationOpts);
		const data = results.page.map(
			({ memberIds, createdBy, _creationTime, ...rest }) => rest,
		);
		return {
			...results,
			page: data,
		};
	},
});

export const getPublicUsers = query({
	args: {
		paginationOpts: paginationOptsValidator,
		query: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}
		const results = await ctx.db
			.query("users")
			.withSearchIndex("name_search", (q) => q.search("name", args.query ?? ""))
			.paginate(args.paginationOpts);
		const data = results.page.map(
			({ tokenIdentifier, _creationTime, ...rest }) => rest,
		);
		return {
			...results,
			page: data,
		};
	},
});

export const createRoom = mutation({
	args: {
		name: v.string(),
		memberIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}
		const creator = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.unique();
		if (!creator) {
			throw new Error("User not found");
		}
		const roomId = await ctx.db.insert("rooms", {
			name: args.name,
			memberIds: args.memberIds,
			type: args.memberIds.length > 2 ? "group" : "private",
			createdBy: creator._id,
			lastActivityAt: Date.now(),
		});
		return roomId;
	},
});
