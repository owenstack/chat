import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { protectedMutation, protectedQuery } from "./functions";

export const getRooms = protectedQuery({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		// Get all room memberships for the user
		const userRooms = await ctx.db
			.query("user_rooms")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
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

export const createRoom = protectedMutation({
	args: {
		name: v.string(),
		memberIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const roomId = await ctx.db.insert("rooms", {
			name: args.name,
			type: args.memberIds.length >= 2 ? "group" : "private",
			createdBy: ctx.user._id,
			lastActivityAt: Date.now(),
		});

		const allMemberIds = [...args.memberIds, ctx.user._id];

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
