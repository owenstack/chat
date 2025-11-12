import { Auth0Provider } from "@auth0/auth0-react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import * as Sentry from "@sentry/tanstackstart-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AutumnProvider } from "autumn-js/react";
import type { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { NotFound } from "@/components/not-found";
import { ThemeProvider } from "@/components/theme";
import { env } from "@/env";
import { seo } from "@/lib/seo";
import { getThemeServerFn } from "@/lib/theme";
import { api } from "../../convex/_generated/api";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
	convexQueryClient: ConvexQueryClient;
}>()({
	loader: () => getThemeServerFn(),
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title: "Chat - Connect Across Languages",
				description:
					"Real-time chat with instant translation. Connect with people worldwide in their native language.",
			}),
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootComponent,
	errorComponent: (props) => {
		useEffect(() => {
			Sentry.captureException(props.error);
		}, [props.error]);
		return (
			<RootDocument>
				<ErrorBoundary {...props} />
			</RootDocument>
		);
	},
	notFoundComponent: () => <NotFound />,
});

function RootComponent() {
	const context = Route.useRouteContext();
	const theme = Route.useLoaderData();

	return (
		<Auth0Provider
			domain={env.VITE_AUTH0_DOMAIN}
			clientId={env.VITE_AUTH0_CLIENT_ID}
			authorizationParams={{
				redirect_uri:
					typeof window !== "undefined" ? window.location.origin : undefined,
			}}
			useRefreshTokens={true}
			cacheLocation="localstorage"
		>
			<ConvexProviderWithAuth0 client={context.convexClient}>
				<AutumnProvider convex={context.convexClient} convexApi={api.autumn}>
					<ThemeProvider theme={theme}>
						<RootDocument>
							<Outlet />
							<Toaster richColors />
						</RootDocument>
					</ThemeProvider>
				</AutumnProvider>
			</ConvexProviderWithAuth0>
		</Auth0Provider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const theme = Route.useLoaderData();
	return (
		<html lang="en" className={theme} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							{
								name: "Query",
								render: <ReactQueryDevtoolsPanel />,
							},
						]}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}
