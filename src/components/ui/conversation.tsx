"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
	<StickToBottom
		className={cn("relative flex-1 overflow-y-auto", className)}
		initial="smooth"
		resize="smooth"
		role="log"
		{...props}
	/>
);

export type ConversationContentProps = ComponentProps<
	typeof StickToBottom.Content
>;

export const ConversationContent = ({
	className,
	...props
}: ConversationContentProps) => (
	<StickToBottom.Content className={cn("p-4", className)} {...props} />
);

export type ConversationEmptyStateProps = Omit<
	ComponentProps<"div">,
	"title"
> & {
	title?: React.ReactNode;
	description?: React.ReactNode;
	icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
	className,
	title = "No messages yet",
	description = "Start a conversation to see messages here",
	icon,
	children,
	...props
}: ConversationEmptyStateProps) => (
	<div
		className={cn(
			"flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
			className,
		)}
		{...props}
	>
		{children ?? (
			<>
				{icon && <div className="text-muted-foreground">{icon}</div>}
				<div className="space-y-1">
					<h3 className="text-sm font-medium">{title}</h3>
					{description && (
						<p className="text-muted-foreground text-sm">{description}</p>
					)}
				</div>
			</>
		)}
	</div>
);

export type ConversationVirtualizedContentProps<T> = {
	items: T[];
	renderItem: (item: T, index: number) => React.ReactNode;
	estimateSize?: () => number;
	overscan?: number;
	className?: string;
};

export const ConversationVirtualizedContent = <T,>({
	items,
	renderItem,
	estimateSize = () => 100,
	overscan = 5,
	className,
}: ConversationVirtualizedContentProps<T>) => {
	const { scrollRef } = useStickToBottomContext();

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => scrollRef.current,
		estimateSize,
		overscan,
	});

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<div
			className={className}
			style={{
				height: virtualizer.getTotalSize(),
				width: "100%",
				position: "relative",
			}}
		>
			{virtualItems.map((virtualItem) => (
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
					{renderItem(items[virtualItem.index], virtualItem.index)}
				</div>
			))}
		</div>
	);
};

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
	className,
	...props
}: ConversationScrollButtonProps) => {
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();

	const handleScrollToBottom = useCallback(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	return (
		!isAtBottom && (
			<Button
				className={cn(
					"bg-background dark:bg-background absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full shadow-md",
					className,
				)}
				onClick={handleScrollToBottom}
				size="icon"
				type="button"
				variant="outline"
				{...props}
			>
				<ArrowDownIcon className="size-4" />
			</Button>
		)
	);
};
