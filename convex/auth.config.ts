import type { AuthConfig } from "convex/server";

export default {
	providers: [
		{
			domain: process.env.VITE_AUTH0_DOMAIN as string,
			applicationID: process.env.VITE_AUTH0_CLIENT_ID as string,
		},
	],
} satisfies AuthConfig;
