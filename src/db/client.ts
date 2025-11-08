import { addRxPlugin, createRxDatabase, type RxDatabase } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { messageSchema } from "./schema";

addRxPlugin(RxDBDevModePlugin);

const getDB = async () => {
	let dbInstance: RxDatabase | null = null;
	if (typeof window === "undefined") {
		console.log("Running on the server, no database created.");
		return null;
	}
	if (dbInstance) return dbInstance;
	dbInstance = await createRxDatabase({
		name: "chat-db",
		storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
		multiInstance: false,
		eventReduce: true,
	});

	return await dbInstance.addCollections({
		messages: {
			schema: messageSchema,
		},
	});
};

export const db = await getDB();
