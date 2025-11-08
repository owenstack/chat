import { convexQuery, useConvexPaginatedQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowUp,
	Check,
	CheckCheck,
	Clock,
	MessageSquareX,
	PlusCircle,
	X,
} from "lucide-react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { useIntersectionObserver, useLocalStorage } from "usehooks-ts";
import { Badge } from "@/components/ui/badge";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ui/conversation";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Message,
	MessageAvatar,
	MessageContent,
} from "@/components/ui/message";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatTimeAgo } from "@/lib/helpers";
import { useSendMessage } from "@/lib/mutations";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ChatMessageType = {
	_id: Id<"messages">;
	authorId: Id<"users">;
	roomId: Id<"rooms">;
	originalText: string;
	sourceLanguage: string;
	createdAt: number;
	status: "sending" | "sent" | "delivered" | "failed";
	isUserMessage: boolean;
};

export const Route = createFileRoute("/app/$roomId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { roomId } = Route.useParams();
	const { results, isLoading, status, loadMore } = useConvexPaginatedQuery(
		api.chat.getMessages,
		{ roomId: roomId as Id<"rooms"> },
		{ initialNumItems: 10 },
	);
	const { ref, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
	});

	if (isIntersecting && status === "CanLoadMore" && !isLoading) {
		loadMore(10);
	}

	return (
		<div className="flex flex-col h-full">
			<Conversation className="flex-1">
				<ConversationContent className="pb-24">
					{status === "LoadingMore" && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}
					{isLoading ? (
						<ConversationEmptyState
							title="Loading..."
							description="Please wait while we fetch your messages"
							icon={<Spinner />}
						/>
					) : results.length === 0 ? (
						<ConversationEmptyState
							title="No messages yet"
							description="Start the conversation by sending a message below"
							icon={<MessageSquareX className="size-12" />}
						/>
					) : (
						<div className="space-y-4">
							{results.map((message: ChatMessageType, index: number) => (
								<ChatMessage
									key={message._id}
									message={message}
									forwardRef={ref}
									isLast={index === results.length - 1}
								/>
							))}
						</div>
					)}
					<ConversationScrollButton />
				</ConversationContent>
			</Conversation>
			<div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<ChatInput />
			</div>
		</div>
	);
}

function ChatMessage({
	message,
	forwardRef,
	isLast,
}: {
	message: ChatMessageType;
	forwardRef: React.Ref<HTMLDivElement>;
	isLast: boolean;
}) {
	const { data } = useQuery({
		...convexQuery(api.user.getUserPublicDetails, {
			userId: message.authorId as Id<"users">,
		}),
		staleTime: Infinity,
	});

	return (
		<div ref={isLast ? forwardRef : null}>
			<Message from={message.isUserMessage ? "user" : "assistant"}>
				<MessageAvatar src={data?.avatar ?? ""} name={data?.name ?? ""} />
				<div className="flex flex-col gap-2">
					<MessageContent>{message.originalText}</MessageContent>
					<div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
						<span className="flex items-center gap-1">
							<Badge
								variant="outline"
								className="text-[10px] font-normal py-0 px-1.5 h-4"
							>
								{message.sourceLanguage}
							</Badge>
						</span>
						<span className="opacity-50">•</span>
						<span className="flex items-center gap-1">
							{message.status === "delivered" ? (
								<CheckCheck className="size-3" />
							) : message.status === "sending" ? (
								<Clock className="size-3" />
							) : message.status === "sent" ? (
								<Check className="size-3" />
							) : (
								<X className="size-3 text-destructive" />
							)}
						</span>
						<span className="opacity-50">•</span>
						<span>{formatTimeAgo(message.createdAt)}</span>
					</div>
				</div>
			</Message>
		</div>
	);
}

function ChatInput() {
	const { roomId } = Route.useParams();
	const { mutate, isPending, error } = useSendMessage();
	const [lang] = useLocalStorage(
		"lang",
		{ language: "en" },
		{ initializeWithValue: false },
	);
	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const message = formData.get("message") as string;
		mutate({
			roomId: roomId as Id<"rooms">,
			sourceLanguage: lang.language,
			message: message.trim(),
		});
		e.currentTarget.reset();
	};
	if (error) {
		toast.error(error.message);
	}

	return (
		<form onSubmit={handleSubmit} className="container max-w-3xl mx-auto p-4">
			<InputGroup className="shadow-lg">
				<InputGroupAddon
					className="flex justify-between items-end gap-2"
					align={"block-end"}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<InputGroupButton
								variant={"ghost"}
								className="rounded-full hover:bg-accent"
								size={"icon-sm"}
							>
								<PlusCircle className="size-5" />
							</InputGroupButton>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p className="text-sm">Media handling is work in progress</p>
						</TooltipContent>
					</Tooltip>
					<InputGroupButton
						type="submit"
						className="rounded-full"
						size="icon-sm"
						disabled={isPending}
					>
						{isPending ? (
							<>
								<Spinner /> <span className="sr-only">Sending...</span>
							</>
						) : (
							<>
								<span className="sr-only">Send message</span>
								<ArrowUp className="size-5" />
							</>
						)}
					</InputGroupButton>
				</InputGroupAddon>
				<InputGroupInput
					placeholder="Type your message..."
					className="resize-none field-sizing-content"
					autoFocus
					required
					name="message"
				/>
			</InputGroup>
		</form>
	);
}
