import { addRxPlugin, createRxDatabase } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

addRxPlugin(RxDBDevModePlugin);

const db = await createRxDatabase({
	name: "chat-db",
	storage: getRxStorageDexie(),
	multiInstance: false,
	eventReduce: true,
});

await db.addCollections({});
