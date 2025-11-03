import { v } from "convex/values";
import { query } from "./_generated/server";

export const preloadQuery = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
			.unique();
		const rooms = await ctx.db
			.query("rooms")
			.filter((q) => q.eq(q.field("memberIds"), [args.userId]))
			.collect();
		return { user, rooms };
	},
});
