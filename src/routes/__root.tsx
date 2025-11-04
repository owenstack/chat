import { Auth0Provider } from "@auth0/auth0-react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
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
import type { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { NotFound } from "@/components/not-found";
import { ThemeProvider } from "@/components/theme";
import { env } from "@/env";
import { getThemeServerFn } from "@/lib/theme";
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
			{
				title: "TanStack Start Starter",
			},
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
				<ThemeProvider theme={theme}>
					<RootDocument>
						<Outlet />
						<Toaster richColors />
					</RootDocument>
				</ThemeProvider>
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
				<Scripts />
			</body>
		</html>
	);
}
