import { type RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

export const messageSchemaLiteral = {
	title: "message schema",
	version: 0,
	primaryKey: "_id",
	type: "object",
	properties: {
		_id: {
			type: "string",
			maxLength: 100,
		},
		authorId: {
			type: "string",
		},
		roomId: {
			type: "string",
		},
		originalText: {
			type: "string",
		},
		sourceLanguage: {
			type: "string",
		},
		createdAt: {
			type: "number",
		},
		status: {
			type: "string",
			enum: ["sending", "sent", "delivered", "failed"],
		},
		isUserMessage: {
			type: "boolean",
		},
	},
	required: [
		"_id",
		"authorId",
		"roomId",
		"originalText",
		"sourceLanguage",
		"createdAt",
		"status",
		"isUserMessage",
	],
} as const;

const schemaTyped = toTypedRxJsonSchema(messageSchemaLiteral);
export type MessageDocType = typeof schemaTyped.properties;
export const messageSchema: RxJsonSchema<MessageDocType> = schemaTyped;
