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
		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.unique();

		if (!user) {
			throw new Error("User not found");
		}
		const userId = user._id;

		// Get all room memberships for the user
		const userRooms = await ctx.db
			.query("user_rooms")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.paginate(args.paginationOpts);

		// Get the full room documents
		const rooms = await Promise.all(
			userRooms.page.map((userRoom) => ctx.db.get(userRoom.roomId)),
		).then((rooms) => rooms.filter((room) => room !== null));

		const data = rooms.map(({ _creationTime, createdBy, ...rest }) => rest);

		return {
			...userRooms,
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
		const results = args.query
			? await ctx.db
					.query("users")
					.withSearchIndex("name_search", (q) =>
						q.search("name", args.query ?? ""),
					)
					.paginate(args.paginationOpts)
			: await ctx.db.query("users").paginate(args.paginationOpts);

		const data = results.page
			.filter((user) => user.tokenIdentifier !== identity.tokenIdentifier)
			.map(({ tokenIdentifier, _creationTime, ...rest }) => rest);
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
			type: args.memberIds.length > 2 ? "group" : "private",
			createdBy: creator._id,
			lastActivityAt: Date.now(),
		});

		const allMemberIds = [...args.memberIds, creator._id];

		await Promise.all(
			allMemberIds.map((userId) =>
				ctx.db.insert("user_rooms", {
					userId,
					roomId,
				}),
			),
		);

		return roomId;
	},
});
