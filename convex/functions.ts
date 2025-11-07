import {
	customCtx,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import {
	type Rules,
	wrapDatabaseReader,
	wrapDatabaseWriter,
} from "convex-helpers/server/rowLevelSecurity";
import type { DataModel, Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

export const rules = async (ctx: QueryCtx) =>
	({
		users: {
			read: async ({ user }, targetUser) => {
				// Users can read their own profile
				return user._id === targetUser._id;
			},
			modify: async ({ user }, targetUser) => {
				// Only allow users to modify their own profile
				return user._id === targetUser._id;
			},
		},
		rooms: {
			read: async ({ user }, room) => {
				// User can read a room if they're a member
				const membership = await ctx.db
					.query("user_rooms")
					.withIndex("by_user_room", (q) =>
						q.eq("userId", user._id).eq("roomId", room._id),
					)
					.unique();
				return !!membership;
			},
			modify: async ({ user }, room) => {
				// Only the creator can modify the room
				return room.createdBy === user._id;
			},
		},
		user_rooms: {
			read: async ({ user }, userRoom) => {
				// User can see all members of rooms they are in
				const membership = await ctx.db
					.query("user_rooms")
					.withIndex("by_user_room", (q) =>
						q.eq("userId", user._id).eq("roomId", userRoom.roomId),
					)
					.unique();
				return !!membership;
			},
			modify: async ({ user }, userRoom) => {
				// Only the user can modify their own membership
				return userRoom.userId === user._id;
			},
		},
		messages: {
			read: async ({ user }, message) => {
				// User can read messages in rooms they are a member of
				const membership = await ctx.db
					.query("user_rooms")
					.withIndex("by_user_room", (q) =>
						q.eq("userId", user._id).eq("roomId", message.roomId),
					)
					.unique();
				return !!membership;
			},
			modify: async ({ user }, message) => {
				// Only the author can modify their own message
				return message.authorId === user._id;
			},
		},
		user_messages: {
			read: async ({ user }, userMessage) => {
				// User can read their own messages
				return userMessage.userId === user._id;
			},
			insert: async ({ user }, userMessage) => {
				// User can insert a message if they are in the room that the message belongs to.
				const message = await ctx.db.get(userMessage.messageId);
				if (!message) return false;

				const membership = await ctx.db
					.query("user_rooms")
					.withIndex("by_user_room", (q) =>
						q.eq("userId", user._id).eq("roomId", message.roomId),
					)
					.unique();
				return !!membership;
			},
			modify: async () => false,
		},
		translation_cache: {
			read: async () => true, // Anyone can read translations
			modify: async () => false, // Only allow inserts, not modifications
			insert: async () => true,
		},
	}) satisfies Rules<{ user: Doc<"users"> }, DataModel>;

export const protectedQuery = customQuery(
	query,
	customCtx(async (ctx) => {
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
		const db = wrapDatabaseReader({ user }, ctx.db, await rules(ctx));
		return { user, db };
	}),
);

export const protectedMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
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
		const db = wrapDatabaseWriter({ user }, ctx.db, await rules(ctx));
		return { user, db };
	}),
);
