import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePaginatedQuery } from "convex/react";
import { MessageSquareX, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { NewChat } from "@/components/new";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "@/lib/content";
import { formatTimeAgo } from "@/lib/helpers";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/app/")({
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
	const { isLoading, status, loadMore, results } = usePaginatedQuery(
		api.room.getRooms,
		{},
		{ initialNumItems: 10 },
	);
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: results.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 68,
		overscan: 10,
		rangeExtractor: (range) => {
			const start = Math.max(0, range.startIndex - 1);
			const end = Math.min(results.length, range.endIndex + 1);
			return Array.from({ length: end - start }, (_, i) => start + i);
		},
	});

	useEffect(() => {
		const lastItem = virtualizer.getVirtualItems().at(-1);
		if (
			!lastItem ||
			lastItem.index < results.length - 1 ||
			status !== "CanLoadMore" ||
			isLoading
		)
			return;
		loadMore(10);
	}, [virtualizer, results.length, status, isLoading, loadMore]);

	return (
		<div className="flex flex-col h-full">
			<div
				ref={parentRef}
				className="flex-1 overflow-y-auto"
				style={{
					contain: "layout style paint",
				}}
			>
				<div className="max-w-2xl mx-auto">
					{isLoading &&
						new Array(6).fill(0).map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <index used for iteration>
							<ChatSkeleton key={index} />
						))}
					{!isLoading && results.length === 0 && <ChatEmpty />}
					{results.length > 0 && (
						<div
							style={{
								height: `${virtualizer.getTotalSize()}px`,
								width: "100%",
								position: "relative",
							}}
						>
							<div
								style={{
									transform: `translateY(${virtualizer.getVirtualItems()[0]?.start ?? 0}px)`,
								}}
							>
								{virtualizer.getVirtualItems().map((virtualItem) => (
									<div
										key={virtualItem.key}
										data-index={virtualItem.index}
										className="divide-y"
									>
										{(() => {
											const item = results[virtualItem.index];
											return (
												<ChatPreview
													_id={item._id}
													type={item.type}
													name={item.name}
													lastActivityAt={item.lastActivityAt}
												/>
											);
										})()}
									</div>
								))}
							</div>
						</div>
					)}
					{status === "LoadingMore" && (
						<div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
							<Spinner />
							<span>{t.app.loadingMore}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function ChatPreview({
	_id,
	type,
	name,
	lastActivityAt,
}: {
	_id: string;
	name: string;
	type: "private" | "group";
	lastActivityAt: number;
}) {
	return (
		<Link
			to="/app/$roomId"
			params={{
				roomId: _id,
			}}
			className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
		>
			<div className="size-12 bg-accent border rounded-full flex items-center justify-center text-accent-foreground shrink-0">
				{type === "group" ? (
					<UsersRound className="size-6" />
				) : (
					<UserRound className="size-6" />
				)}
			</div>
			<div className="flex flex-col flex-1 min-w-0">
				<p className="font-semibold text-sm truncate">{name}</p>
				<span className="text-xs text-muted-foreground">
					{formatTimeAgo(lastActivityAt)}
				</span>
			</div>
		</Link>
	);
}

function ChatSkeleton() {
	return (
		<div className="flex items-center gap-3 p-3">
			<Skeleton className="size-12 rounded-full shrink-0" />
			<div className="flex flex-col gap-2 flex-1">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-20" />
			</div>
		</div>
	);
}

function ChatEmpty() {
	const t = useTranslations();
	return (
		<div className="flex flex-col size-full items-center justify-center px-4">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant={"icon"}>
						<MessageSquareX className="size-12" />
					</EmptyMedia>
					<EmptyTitle className="text-2xl font-semibold">
						{t.app.readyToConnect}
					</EmptyTitle>
					<EmptyDescription className="text-base text-muted-foreground max-w-md">
						{t.app.startFirstConversation}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-col gap-3 text-center mt-2">
						<h3 className="text-sm font-medium text-foreground">
							{t.app.startConversation}
						</h3>
						<NewChat showMessage />
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
}
