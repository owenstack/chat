import { formatTimeAgo, getInitials } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

type PresenceUser = {
	userId: string;
	name?: string;
	avatar?: string;
	online: boolean;
	lastSeen?: number;
};

export function OnlineIndicator({
	online,
	className,
}: {
	online: boolean;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"absolute bottom-0 right-0 block size-3 rounded-full ring-2 ring-background",
				online ? "bg-green-500" : "bg-gray-400",
				className,
			)}
		/>
	);
}

export function TypingIndicator({ names }: { names: string[] }) {
	if (names.length === 0) return null;

	const text =
		names.length === 1
			? `${names[0]} is typing...`
			: names.length === 2
				? `${names[0]} and ${names[1]} are typing...`
				: `${names[0]} and ${names.length - 1} others are typing...`;

	return (
		<div
			id="indicator"
			className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground"
		>
			<div className="flex gap-1">
				<span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
				<span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
				<span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
			</div>
			<span>{text}</span>
		</div>
	);
}

export function PresenceAvatars({
	users,
	maxDisplay = 5,
}: {
	users: PresenceUser[];
	maxDisplay?: number;
}) {
	const displayUsers = users.slice(0, maxDisplay);
	const remaining = users.length - maxDisplay;

	return (
		<div className="flex -space-x-2">
			{displayUsers.map((user) => (
				<div key={user.userId} className="relative">
					<Avatar
						className={cn(
							"size-8 border-2 border-background",
							!user.online && "opacity-60 grayscale",
						)}
					>
						<AvatarImage src={user.avatar} alt={user.name} />
						<AvatarFallback className="text-xs">
							{getInitials(user.name, 2)}
						</AvatarFallback>
					</Avatar>
					<OnlineIndicator online={user.online} className="size-2" />
				</div>
			))}
			{remaining > 0 && (
				<div className="flex items-center justify-center size-8 rounded-full bg-muted border-2 border-background text-xs font-medium">
					+{remaining}
				</div>
			)}
		</div>
	);
}

export function PresenceList({ users }: { users: PresenceUser[] }) {
	const onlineUsers = users.filter((u) => u.online);
	const offlineUsers = users.filter((u) => !u.online);

	return (
		<div className="space-y-4">
			{onlineUsers.length > 0 && (
				<div>
					<h3 className="text-sm font-medium text-muted-foreground mb-2">
						Online — {onlineUsers.length}
					</h3>
					<div className="space-y-1">
						{onlineUsers.map((user) => (
							<PresenceListItem key={user.userId} user={user} />
						))}
					</div>
				</div>
			)}

			{offlineUsers.length > 0 && (
				<div>
					<h3 className="text-sm font-medium text-muted-foreground mb-2">
						Offline — {offlineUsers.length}
					</h3>
					<div className="space-y-1">
						{offlineUsers.map((user) => (
							<PresenceListItem key={user.userId} user={user} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function PresenceListItem({ user }: { user: PresenceUser }) {
	return (
		<div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
			<div className="relative">
				<Avatar className="size-10">
					<AvatarImage src={user.avatar} alt={user.name} />
					<AvatarFallback>{getInitials(user.name, 2)}</AvatarFallback>
				</Avatar>
				<OnlineIndicator online={user.online} />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{user.name}</p>
				{!user.online && user.lastSeen && (
					<p className="text-xs text-muted-foreground">
						Last seen {formatTimeAgo(user.lastSeen)}
					</p>
				)}
			</div>
		</div>
	);
}
