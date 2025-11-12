import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { protectedMutation, protectedQuery } from "./functions";

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
			// to sync already created accounts
			if (!user.accountType) {
				await ctx.db.patch(user._id, { accountType: "public" });
			}
			return user._id;
		}
		return await ctx.db.insert("users", {
			name: identity.name ?? "Anonymous",
			tokenIdentifier: identity.tokenIdentifier,
			selectedLanguage: args.selectedLanguage,
			avatar: identity.pictureUrl ?? "/logo.png",
			accountType: "public",
		});
	},
});

export const getPublicUsers = protectedQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		query: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const publicUsersQuery = ctx.db
			.query("users")
			.withIndex("by_type", (q) => q.eq("accountType", "public"));

		if (args.query) {
			const searchQuery = args.query;
			const allPublicUsers = await publicUsersQuery.collect();
			const searchResults = await ctx.db
				.query("users")
				.withSearchIndex("public_name_search", (q) =>
					q.search("name", searchQuery),
				)
				.paginate(args.paginationOpts);

			const matchingIds = new Set(searchResults.page.map((u) => u._id));
			const filtered = allPublicUsers.filter((u) => matchingIds.has(u._id));

			const data = filtered
				.filter((user) => user.tokenIdentifier !== ctx.user.tokenIdentifier)
				.map(({ tokenIdentifier, _creationTime, ...rest }) => rest);

			return {
				...searchResults,
				page: data,
			};
		}

		const results = await publicUsersQuery.paginate(args.paginationOpts);
		const data = results.page
			.filter((user) => user.tokenIdentifier !== ctx.user.tokenIdentifier)
			.map(({ tokenIdentifier, _creationTime, ...rest }) => rest);
		return {
			...results,
			page: data,
		};
	},
});

export const getUploadUrl = protectedMutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

export const updateUser = protectedMutation({
	args: {
		body: v.object({
			accountType: v.optional(
				v.union(v.literal("public"), v.literal("private")),
			),
			name: v.optional(v.string()),
			avatar: v.optional(v.id("_storage")),
		}),
	},
	handler: async (ctx, args) => {
		if (args.body.avatar) {
			const url = await ctx.storage.getUrl(args.body.avatar);
			if (!url) throw new Error("Invalid avatar ID");
			await ctx.db.patch(ctx.user._id, {
				avatar: url,
			});
		}
		return await ctx.db.patch(ctx.user._id, {
			accountType: args.body.accountType,
			name: args.body.name,
		});
	},
});
