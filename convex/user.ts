import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const setUpUser = mutation({
	args: {
		selectedLanguage: v.string(),
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
		if (user !== null) {
			if (user.name !== identity.name) {
				await ctx.db.patch(user._id, { name: identity.name });
			}
			if (user.selectedLanguage !== args.selectedLanguage) {
				await ctx.db.patch(user._id, {
					selectedLanguage: args.selectedLanguage,
				});
			}
			return user._id;
		}
		return await ctx.db.insert("users", {
			name: identity.name ?? "Anonymous",
			tokenIdentifier: identity.tokenIdentifier,
			selectedLanguage: args.selectedLanguage,
			rooms: [],
		});
	},
});
