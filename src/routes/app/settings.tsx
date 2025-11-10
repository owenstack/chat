import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/settings")({
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
	return <div>Hello "/app/settings"!</div>;
}

// autumn pricing and feature usage
// public and private accounts
// account settings page
// change language preference
// change avatar
// delete account
// usage stats
// plan details and billing
// use the useMe hook to get user info
// view transitions for animations ??
