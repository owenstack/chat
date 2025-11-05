// in convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Stores user information and their language preference
	users: defineTable({
		name: v.string(),
		tokenIdentifier: v.string(), // For authentication
		selectedLanguage: v.string(), // e.g., "en", "es", "ja"
		rooms: v.array(v.id("rooms")), // Rooms the user is a member of
	}).index("by_token", ["tokenIdentifier"]),

	// Defines a chat room
	rooms: defineTable({
		name: v.string(),
		memberIds: v.array(v.id("users")),
	}),

	// Stores the original, untranslated messages
	messages: defineTable({
		authorId: v.id("users"),
		roomId: v.id("rooms"),
		originalText: v.string(),
	}).index("by_room", ["roomId"]),

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
