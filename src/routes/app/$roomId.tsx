import { convexQuery, useConvexPaginatedQuery } from "@convex-dev/react-query";
import * as Sentry from "@sentry/tanstackstart-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { Badge } from "@/components/ui/badge";
import { ConversationEmptyState } from "@/components/ui/conversation";
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
import { type Language, useTranslations } from "@/lib/content";
import { formatTimeAgo } from "@/lib/helpers";
import { useSendMessage } from "@/lib/mutations";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ChatMessageType = {
	_id: Id<"messages">;
	authorId: Id<"users">;
	roomId: Id<"rooms">;
	originalText: string;
	displayText: string;
	sourceLanguage: string;
	createdAt: number;
	status: "sending" | "sent" | "delivered" | "failed";
	isUserMessage: boolean;
};

export const Route = createFileRoute("/app/$roomId")({
	errorComponent: ({ error }) => {
		useEffect(() => {
			Sentry.captureException(error);
		}, [error]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const t = useTranslations();
	const { roomId } = Route.useParams();
	const { results, isLoading, status, loadMore } = useConvexPaginatedQuery(
		api.chat.getMessages,
		{ roomId: roomId as Id<"rooms"> },
		{ initialNumItems: 10 },
	);
	const { data: members } = useQuery({
		...convexQuery(api.room.getRoomMembers, { roomId: roomId as Id<"rooms"> }),
		staleTime: Infinity,
	});

	const parentRef = useRef<HTMLDivElement>(null);
	const messages = useMemo(() => [...results].reverse(), [results]);
	const count = messages.length;
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
	const prevCountRef = useRef(0);

	const virtualizer = useVirtualizer({
		count,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 100,
		overscan: 5,
	});

	const virtualItems = virtualizer.getVirtualItems();

	// Load more messages when scrolling to top
	useEffect(() => {
		const [firstItem] = virtualItems;
		if (!firstItem) return;

		// Only trigger load more if we've already scrolled to bottom initially
		if (
			firstItem.index === 0 &&
			status === "CanLoadMore" &&
			!isLoading &&
			hasScrolledToBottom
		) {
			loadMore(10);
		}
	}, [virtualItems, status, isLoading, loadMore, hasScrolledToBottom]);

	// Scroll to bottom on initial load or when new messages arrive
	useEffect(() => {
		if (count === 0) return;

		// Initial scroll to bottom
		if (!hasScrolledToBottom && !isLoading) {
			// Use setTimeout to ensure elements are measured
			setTimeout(() => {
				virtualizer.scrollToIndex(count - 1, {
					align: "end",
					behavior: "auto",
				});
				setHasScrolledToBottom(true);
			}, 100);
		}
		// Scroll to bottom when new messages are added (not when loading older messages)
		else if (count > prevCountRef.current && hasScrolledToBottom) {
			// Only scroll if we added messages (not loaded older ones)
			// Check if user is near bottom before auto-scrolling
			const scrollElement = parentRef.current;
			if (scrollElement) {
				const { scrollTop, scrollHeight, clientHeight } = scrollElement;
				const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

				if (isNearBottom) {
					setTimeout(() => {
						virtualizer.scrollToIndex(count - 1, {
							align: "end",
							behavior: "smooth",
						});
					}, 50);
				}
			}
		}

		prevCountRef.current = count;
	}, [count, isLoading, virtualizer, hasScrolledToBottom]);

	return (
		<div className="flex flex-col h-full">
			<div ref={parentRef} className="flex-1 overflow-y-auto pb-24">
				{isLoading && count === 0 ? (
					<ConversationEmptyState
						title={t.common.loading}
						description={t.app.readyToConnect}
						icon={<Spinner />}
					/>
				) : count === 0 ? (
					<ConversationEmptyState
						title={t.app.conversationStartsHere}
						description={t.app.breakIceMessage}
						icon={<MessageSquareX className="size-12" />}
					/>
				) : (
					<div
						style={{
							height: virtualizer.getTotalSize(),
							width: "100%",
							position: "relative",
						}}
					>
						{status === "CanLoadMore" && isLoading && (
							<div className="flex justify-center py-4">
								<Spinner />
							</div>
						)}
						{virtualizer.getVirtualItems().map((virtualItem) => {
							const message = messages[virtualItem.index] as ChatMessageType;
							return (
								<div
									key={virtualItem.key}
									data-index={virtualItem.index}
									ref={virtualizer.measureElement}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										transform: `translateY(${virtualItem.start}px)`,
									}}
								>
									<ChatMessage message={message} members={members} />
								</div>
							);
						})}
					</div>
				)}
			</div>
			<div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<ChatInput
					onMessageSent={() => {
						// Scroll to bottom after sending message
						setTimeout(() => {
							virtualizer.scrollToIndex(count, {
								align: "end",
								behavior: "smooth",
							});
						}, 50);
					}}
				/>
			</div>
		</div>
	);
}

function ChatMessage({
	message,
	members,
}: {
	message: ChatMessageType;
	members:
		| Record<
				Id<"users">,
				Partial<{
					_id: Id<"users">;
					_creationTime: number;
					name: string;
					tokenIdentifier: string;
					selectedLanguage: string;
					avatar: string;
				}>
		  >
		| undefined;
}) {
	const t = useTranslations();
	const authorDetails = members?.[message.authorId];

	return (
		<div className="p-4">
			<Message from={message.isUserMessage ? "user" : "assistant"}>
				<MessageAvatar
					src={authorDetails?.avatar ?? ""}
					name={authorDetails?.name}
				/>
				<div className="flex flex-col gap-2">
					{!message.isUserMessage ||
					message.displayText !== message.originalText ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<MessageContent>{message.displayText}</MessageContent>
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-sm">
									{t.common.original}: {message.originalText}
								</p>
							</TooltipContent>
						</Tooltip>
					) : (
						<MessageContent>{message.displayText}</MessageContent>
					)}
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

function ChatInput({ onMessageSent }: { onMessageSent: () => void }) {
	const t = useTranslations();
	const { roomId } = Route.useParams();
	const { mutate, isPending, error } = useSendMessage();
	const [lang] = useLocalStorage<{ language: Language }>(
		"lang",
		{ language: "en" },
		{ initializeWithValue: true },
	);
	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const message = formData.get("message") as string;
		if (!message.trim()) return;
		mutate(
			{
				roomId: roomId as Id<"rooms">,
				sourceLanguage: lang.language,
				message: message.trim(),
			},
			{
				onSuccess: () => {
					onMessageSent();
				},
			},
		);
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
							<p className="text-sm">{t.common.mediaSharingComingSoon}</p>
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
								<Spinner /> <span className="sr-only">{t.common.sending}</span>
							</>
						) : (
							<>
								<span className="sr-only">{t.common.sendMessage}</span>
								<ArrowUp className="size-5" />
							</>
						)}
					</InputGroupButton>
				</InputGroupAddon>
				<InputGroupInput
					placeholder={t.common.typeYourMessage}
					className="resize-none field-sizing-content"
					autoFocus
					required
					name="message"
				/>
			</InputGroup>
		</form>
	);
}
