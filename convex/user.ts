import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { protectedQuery } from "./functions";

export const getMe = protectedQuery({
	args: {},
	handler: async (ctx) => {
		return ctx.user;
	},
});

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
			avatar: identity.pictureUrl ?? "/logo.png",
		});
	},
});

export const getPublicUsers = protectedQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		query: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const results = args.query
			? await ctx.db
					.query("users")
					.withSearchIndex("name_search", (q) =>
						q.search("name", args.query ?? ""),
					)
					.paginate(args.paginationOpts)
			: await ctx.db.query("users").paginate(args.paginationOpts);

		const data = results.page
			.filter((user) => user.tokenIdentifier !== ctx.user.tokenIdentifier)
			.map(({ tokenIdentifier, _creationTime, ...rest }) => rest);
		return {
			...results,
			page: data,
		};
	},
});
