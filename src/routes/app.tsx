import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthCheck } from "@/components/auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
	errorComponent: ({ error }) => {
		useEffect(() => {
			Sentry.captureException(error);
		}, [error]);

		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<div className="max-w-md text-center">
					<h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
					<p className="text-muted-foreground mb-4">
						We've been notified and are looking into it.
					</p>
					<Button onClick={() => window.location.reload()}>Reload page</Button>
				</div>
			</div>
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="flex flex-col min-h-screen">
			<Header />
			<div className="container max-w-screen-2xl mx-auto flex-1 pt-20 px-4">
				<Outlet />
			</div>
			<AuthCheck />
		</main>
	);
}
