import { createFileRoute } from "@tanstack/react-router";
import { Conversation } from "@/components/ui/conversation";

export const Route = createFileRoute("/app/$roomId")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<ChatSkeleton />
		</div>
	);
}

function Chat() {
	return <Conversation>something</Conversation>;
}

function ChatSkeleton() {
	return "Loading...";
}
