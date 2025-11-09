import { ConvexQueryClient } from "@convex-dev/react-query";
import * as Sentry from "@sentry/tanstackstart-react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ErrorBoundary } from "./components/error-boundary";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const convexUrl = import.meta.env.VITE_CONVEX_URL;
	if (!convexUrl) {
		console.error("VITE_CONVEX_URL is not defined");
	}
	const convex = new ConvexReactClient(convexUrl as string, {
		unsavedChangesWarning: false,
	});

	const convexQueryClient = new ConvexQueryClient(convex);

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);
	const router = routerWithQueryClient(
		createRouter({
			routeTree,
			defaultPreload: "intent",
			context: { queryClient, convexClient: convex, convexQueryClient },
			scrollRestoration: true,
			defaultPreloadStaleTime: 0,
			Wrap: ({ children }) => (
				<ConvexProvider client={convexQueryClient.convexClient}>
					{children}
				</ConvexProvider>
			),
			defaultErrorComponent: ErrorBoundary,
			defaultNotFoundComponent: () => <NotFound />,
		}),
		queryClient,
	);
	if (!router.isServer) {
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
	}
	return router;
};
