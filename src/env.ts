import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		CONVEX_DEPLOYMENT: z.string(),
		OPENROUTER_API_KEY: z.string(),
	},
	client: {
		VITE_CONVEX_URL: z.string().url(),
		VITE_AUTH0_DOMAIN: z.string(),
		VITE_AUTH0_CLIENT_ID: z.string(),
	},
	clientPrefix: "VITE_",
	runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
});
