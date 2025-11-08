import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { MessageSquareX, UserRound, UsersRound } from "lucide-react";
import { useIntersectionObserver } from "usehooks-ts";
import { NewChat } from "@/components/new";
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
import { formatTimeAgo } from "@/lib/helpers";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/app/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { isLoading, status, loadMore, results } = usePaginatedQuery(
		api.room.getRooms,
		{},
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
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-2xl mx-auto">
					{isLoading &&
						new Array(6).fill(0).map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <index used for iteration>
							<ChatSkeleton key={index} />
						))}
					{!isLoading && results.length === 0 && <ChatEmpty />}
					{results.length > 0 && (
						<div className="divide-y">
							{results.map(({ _id, type, name, lastActivityAt }, index) => (
								<div
									key={_id}
									ref={index === results.length - 1 ? ref : undefined}
								>
									<ChatPreview
										_id={_id}
										type={type}
										name={name}
										lastActivityAt={lastActivityAt}
									/>
								</div>
							))}
						</div>
					)}
					{status === "LoadingMore" && (
						<div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
							<Spinner />
							<span>Loading more...</span>
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
	return (
		<div className="flex flex-col size-full items-center justify-center px-4">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant={"icon"}>
						<MessageSquareX className="size-12" />
					</EmptyMedia>
					<EmptyTitle className="text-2xl font-semibold">
						Ready to Connect?
					</EmptyTitle>
					<EmptyDescription className="text-base text-muted-foreground max-w-md">
						Start your first conversation by creating a new chat with friends or
						groups
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-col gap-3 text-center mt-2">
						<h3 className="text-sm font-medium text-foreground">
							Start your first conversation
						</h3>
						<NewChat showMessage />
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
}
