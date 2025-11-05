// in convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Stores user information and their language preference
	users: defineTable({
		name: v.string(),
		tokenIdentifier: v.string(), // For authentication
		selectedLanguage: v.string(), // e.g., "en", "es", "ja"
		// accountType: v.union(v.literal('public'), v.literal('private'))
	})
		.index("by_token", ["tokenIdentifier"])
		.searchIndex("name_search", { searchField: "name" }),

	// Defines a chat room
	rooms: defineTable({
		name: v.string(),
		memberIds: v.array(v.id("users")),
		type: v.union(v.literal("private"), v.literal("group")),
		createdBy: v.id("users"),
		lastActivityAt: v.number(),
	})
		.index("by_member", ["memberIds"])
		.index("by_last_activity", ["lastActivityAt"]),

	// Stores the original, untranslated messages
	messages: defineTable({
		authorId: v.id("users"),
		roomId: v.id("rooms"),
		originalText: v.string(),
		sourceLanguage: v.string(),
		createdAt: v.number(),
		status: v.union(
			v.literal("sending"),
			v.literal("sent"),
			v.literal("delivered"),
			v.literal("failed"),
		),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_time", ["roomId", "createdAt"]),

	// Our global, cost-saving cache for translations
	translation_cache: defineTable({
		sourceText: v.string(), // The original text (e.g., "Hello")
		targetLanguage: v.string(), // The target language (e.g., "es")
		translatedText: v.string(), // The translated result (e.g., "Hola")
	})
		// This composite index is VITAL for fast, cheap lookups!
		// It allows us to instantly find if a translation already exists.
		.index("by_source_and_target", ["sourceText", "targetLanguage"]),
});
