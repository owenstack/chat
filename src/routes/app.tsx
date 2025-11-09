import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthCheck } from "@/components/auth";
import { Header } from "@/components/header";

export const Route = createFileRoute("/app")({
	errorComponent: ({ error }) => {
		useEffect(() => {
			Sentry.captureException(error);
		}, [error]);
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
