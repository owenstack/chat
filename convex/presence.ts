import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { protectedMutation, protectedQuery } from "./functions";

export const presence = new Presence(components.presence);

export const heartbeat = protectedMutation({
	args: {
		roomId: v.id("rooms"),
		interval: v.number(),
		userId: v.id("users"),
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		return await presence.heartbeat(
			ctx,
			args.roomId,
			ctx.user._id,
			ctx.user.tokenIdentifier,
			args.interval,
		);
	},
});

export const list = protectedQuery({
	args: {
		roomToken: v.string(),
	},
	handler: async (ctx, args) => {
		return await presence.list(ctx, args.roomToken);
	},
});

export const disconnect = mutation({
	args: {
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		return await presence.disconnect(ctx, args.sessionToken);
	},
});
