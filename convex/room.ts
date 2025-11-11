import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
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

		const data = rooms.map(({ createdBy, ...rest }) => rest);

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

export const getRoomMembers = protectedQuery({
	args: { roomId: v.id("rooms") },
	handler: async (ctx, args) => {
		const userRooms = await ctx.db
			.query("user_rooms")
			.withIndex("by_room", (q) => q.eq("roomId", args.roomId))
			.collect();

		const users = await Promise.all(
			userRooms.map(async (ur) => {
				const user = await ctx.db.get(ur.userId);
				return {
					_id: user?._id,
					name: user?.name,
					avatar: user?.avatar,
				};
			}),
		);
		return users.reduce(
			(acc, user) => {
				if (user._id) acc[user._id] = user;
				return acc;
			},
			{} as Record<Id<"users">, Partial<Doc<"users">>>,
		);
	},
});

export const getRoom = protectedQuery({
	args: { roomId: v.id("rooms") },
	handler: async (ctx, args) => {
		const room = await ctx.db.get(args.roomId);
		if (!room) {
			throw new Error("Room not found");
		}
		const { _creationTime, ...data } = room;
		return data;
	},
});
