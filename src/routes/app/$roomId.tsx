import { convexQuery, useConvexPaginatedQuery } from "@convex-dev/react-query";
import * as Sentry from "@sentry/tanstackstart-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCustomer } from "autumn-js/react";
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
import { useStickToBottom } from "use-stick-to-bottom";
import { useLocalStorage } from "usehooks-ts";
import PaywallDialog from "@/components/autumn/paywall-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PresenceAvatars, TypingIndicator } from "@/components/ui/presence";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Language, useTranslations } from "@/lib/content";
import { formatTimeAgo } from "@/lib/helpers";
import { useRoomPresence } from "@/lib/hooks/use-room-presence";
import useTypingIndicator from "@/lib/hooks/use-typing-indicator";
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
	const t = useTranslations();
	const { roomId } = Route.useParams();
	const { results, isLoading, status, loadMore } = useConvexPaginatedQuery(
		api.chat.getMessages,
		{ roomId: roomId as Id<"rooms"> },
		{ initialNumItems: 10 },
	);
	const { others, updatePresence } = useRoomPresence(roomId as Id<"rooms">);
	const { data: members } = useQuery({
		...convexQuery(api.room.getRoomMembers, { roomId: roomId as Id<"rooms"> }),
		staleTime: Infinity,
	});
	const { data: room } = useSuspenseQuery({
		...convexQuery(api.room.getRoom, { roomId: roomId as Id<"rooms"> }),
		staleTime: Infinity,
	});
	const messages = useMemo(() => [...results].reverse(), [results]);
	const count = messages.length;
	const { isAtBottom, scrollToBottom, scrollRef } = useStickToBottom();
	const hasInitialized = useRef(false);

	const virtualizer = useVirtualizer({
		count,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => 100,
		overscan: 5,
	});

	const typingUsers = useMemo(
		() =>
			others
				?.filter((p) => {
					const data = p.data as Record<string, unknown>;
					return data?.typing === true;
				})
				.map((p) => members?.[p.userId as Id<"users">]?.name || "Someone"),
		[others, members],
	);

	// this implementation is sub-optimal at best
	// useEffect hell looks like a ticking time bomb
	// I should mostly allow the virtualizer handle the scroll
	// that didn't work and even this hack isn't working as best as it should
	// will have to review this and come back to it

	const virtualItems = virtualizer.getVirtualItems();

	// Load more messages when scrolling to top
	useEffect(() => {
		const [firstItem] = virtualItems;
		if (!firstItem) return;

		if (firstItem.index === 0 && status === "CanLoadMore" && !isLoading) {
			loadMore(10);
		}
	}, [virtualItems, status, isLoading, loadMore]);

	// Initial scroll to bottom when messages first load
	useEffect(() => {
		if (count === 0 || hasInitialized.current) return;
		hasInitialized.current = true;
		scrollToBottom();
	}, [count, scrollToBottom]);

	// Scroll to bottom when new messages arrive and user is at bottom
	useEffect(() => {
		if (count === 0 || !isAtBottom) return;

		scrollToBottom();
	}, [count, isAtBottom, scrollToBottom]);

	const presenceWithUserData = useMemo(
		() =>
			others?.map((p) => {
				const member = members?.[p.userId as Id<"users">];
				return {
					userId: p.userId,
					name: member?.name,
					avatar: member?.avatar,
					online: p.online,
					lastSeen: p.lastDisconnected,
				};
			}) ?? [],
		[others, members],
	);

	return (
		<div className="flex flex-col h-full">
			<div className="border-b bg-background px-4 py-2 fixed z-20 top-14 left-0 right-0">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold truncate max-w-sm">{room.name}</h2>
					<PresenceAvatars users={presenceWithUserData} maxDisplay={5} />
				</div>
			</div>
			<div ref={scrollRef} className="flex-1 overflow-y-auto pb-24">
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
				<TypingIndicator names={typingUsers} />
				<ChatInput onTypingChange={updatePresence} />
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
						<>
							<MessageContent>{message.displayText}</MessageContent>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="text-xs text-muted-foreground/70 hover:text-muted-foreground text-left w-fit"
									>
										{t.common.original}
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="text-sm">{message.originalText}</p>
								</TooltipContent>
							</Tooltip>
						</>
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

function ChatInput({
	onTypingChange,
}: {
	onTypingChange: (typing: boolean) => void;
}) {
	const t = useTranslations();
	const { roomId } = Route.useParams();
	const [message, setMessage] = useState("");
	const { mutate, isPending, error } = useSendMessage();
	const [lang] = useLocalStorage<{ language: Language }>(
		"lang",
		{ language: "en" },
		{ initializeWithValue: true },
	);
	const { check } = useCustomer();

	useTypingIndicator(message, onTypingChange);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!message.trim()) return;
		await check({
			featureId: "messages",
			dialog: PaywallDialog,
		});

		mutate({
			roomId: roomId as Id<"rooms">,
			sourceLanguage: lang.language,
			message: message.trim(),
		});
		setMessage("");
		onTypingChange(false);
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
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
			</InputGroup>
		</form>
	);
}
