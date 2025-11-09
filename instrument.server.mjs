//@ts-check
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
	dsn: "https://cd23920f7b040fba4fad3fa569da7aa4@o4506367715311616.ingest.us.sentry.io/4510336688586752",
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
	integrations: [
		Sentry.feedbackIntegration({
			colorScheme: "system",
		}),
		Sentry.replayIntegration(),
	],
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
});
