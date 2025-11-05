import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$roomId")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/app/$roomId"!</div>;
}
