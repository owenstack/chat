import { generateObject } from "ai";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { z } from "zod";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { protectedMutation, protectedQuery } from "./functions";
import { system } from "./prompts";

const messageSchema = z.object({
	message: z
		.string()
		.describe("The translated message text in the target language"),
	targetLanguage: z
		.string()
		.describe("The language code of the translation (e.g., 'en', 'es', 'fr')"),
});

export const sendMessage = protectedMutation({
	args: {
		message: v.string(),
		sourceLanguage: v.string(),
		roomId: v.id("rooms"),
	},
	handler: async (ctx, args) => {
		const previousMessagesRaw = await ctx.db
			.query("messages")
			.withIndex("by_room", (q) => q.eq("roomId", args.roomId))
			.order("desc")
			.take(3);

		const previousMessages = previousMessagesRaw.reverse().map((msg) => ({
			message: msg.originalText,
			sourceLanguage: msg.sourceLanguage,
			byUser: msg.authorId === ctx.user._id,
		}));

		const members = await ctx.db
			.query("user_rooms")
			.withIndex("by_room", (q) => q.eq("roomId", args.roomId))
			.collect();

		const usersByLanguage: Record<string, string[]> = {};
		const allLanguages = new Set<string>();

		for (const member of members) {
			const user = await ctx.db.get(member.userId);
			if (user?.selectedLanguage) {
				if (!usersByLanguage[user.selectedLanguage]) {
					usersByLanguage[user.selectedLanguage] = [];
				}
				usersByLanguage[user.selectedLanguage].push(user._id);
				allLanguages.add(user.selectedLanguage);
			}
		}

		const messageId = await ctx.db.insert("messages", {
			roomId: args.roomId,
			authorId: ctx.user._id,
			originalText: args.message,
			sourceLanguage: args.sourceLanguage,
			status: "delivered",
			createdAt: Date.now(),
		});

		await Promise.all(
			Object.entries(usersByLanguage).map(async ([language, userIds]) => {
				await ctx.scheduler.runAt(
					Date.now() - 1000,
					api.chat.getAITranslation,
					{
						message: args.message,
						sourceLanguage: args.sourceLanguage,
						targetLanguage: language,
						userIds: userIds as Id<"users">[],
						messageId: messageId,
						previousMessages,
					},
				);
			}),
		);
		await ctx.db.patch(args.roomId, {
			lastActivityAt: Date.now(),
		});
		return messageId;
	},
});

export const getMessages = protectedQuery({
	args: {
		roomId: v.id("rooms"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_room", (q) => q.eq("roomId", args.roomId))
			.order("asc")
			.paginate(args.paginationOpts);
		const data = await Promise.all(
			messages.page.map(async (message) => {
				const { _creationTime, ...rest } = message;
				const isUserMessage = rest.authorId === ctx.user._id;

				if (!isUserMessage) {
					const userMessage = await ctx.db
						.query("user_messages")
						.withIndex("by_user_message", (q) =>
							q.eq("userId", ctx.user._id).eq("messageId", rest._id),
						)
						.unique();
					if (userMessage) {
						return {
							...rest,
							originalText: userMessage.translatedText,
							isUserMessage,
						};
					}
				}

				return {
					...rest,
					isUserMessage,
				};
			}),
		);
		return {
			...messages,
			page: data,
		};
	},
});

export const getAITranslation = action({
	args: {
		previousMessages: v.optional(
			v.array(
				v.object({
					message: v.string(),
					sourceLanguage: v.string(),
					byUser: v.boolean(),
				}),
			),
		),
		message: v.string(),
		sourceLanguage: v.string(),
		targetLanguage: v.string(),
		userIds: v.array(v.id("users")),
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const cached = await ctx.runQuery(internal.chat.getTranslationFromCache, {
			sourceText: args.message,
			targetLanguage: args.targetLanguage,
		});

		let translatedText: string;

		if (cached) {
			translatedText = cached.translatedText;
		} else {
			let prompt = `Translate from ${args.sourceLanguage} to ${args.targetLanguage}: ${args.message}`;

			if (args.previousMessages && args.previousMessages.length > 0) {
				const history = args.previousMessages
					.map(
						(msg) =>
							`${msg.byUser ? "User" : "Other"}: ${msg.message} (${msg.sourceLanguage})`,
					)
					.join("\n");
				prompt = `Conversation History:\n${history}\n\nTranslate the last message from ${args.sourceLanguage} to ${args.targetLanguage}: ${args.message}`;
			}

			const { object } = await generateObject({
				model: "minimax/minimax-m2",
				system,
				prompt,
				schema: messageSchema,
			});

			translatedText = object.message;
			await ctx.runMutation(internal.chat.storeTranslation, {
				sourceText: args.message,
				targetLanguage: args.targetLanguage,
				translatedText: translatedText,
			});
		}

		await ctx.runMutation(internal.chat.deliverTranslation, {
			messageId: args.messageId,
			userIds: args.userIds,
			translatedText: translatedText,
			targetLanguage: args.targetLanguage,
		});
	},
});

export const getTranslationFromCache = internalQuery({
	args: { sourceText: v.string(), targetLanguage: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("translation_cache")
			.withIndex("by_source_and_target", (q) =>
				q
					.eq("sourceText", args.sourceText)
					.eq("targetLanguage", args.targetLanguage),
			)
			.first();
	},
});

export const storeTranslation = internalMutation({
	args: {
		sourceText: v.string(),
		targetLanguage: v.string(),
		translatedText: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("translation_cache", {
			sourceText: args.sourceText,
			targetLanguage: args.targetLanguage,
			translatedText: args.translatedText,
		});
	},
});

export const deliverTranslation = internalMutation({
	args: {
		messageId: v.id("messages"),
		userIds: v.array(v.id("users")),
		translatedText: v.string(),
		targetLanguage: v.string(),
	},
	handler: async (ctx, args) => {
		await Promise.all(
			args.userIds.map((userId) =>
				ctx.db.insert("user_messages", {
					messageId: args.messageId,
					userId: userId,
					translatedText: args.translatedText,
					targetLanguage: args.targetLanguage,
				}),
			),
		);
	},
});
