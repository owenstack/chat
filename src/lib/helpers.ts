export const formatTimeAgo = (input: Date | string | number) => {
	const now = new Date();
	const diffMs = now.getTime() - new Date(input).getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	return `${diffDays}d ago`;
};

export const getInitials = (
	name: string | null | undefined,
	count?: number,
): string => {
	if (!name || typeof name !== "string") {
		return "";
	}

	const initials = name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0].toUpperCase());

	return count && count > 0
		? initials.slice(0, count).join("")
		: initials.join("");
};

export function uid(): string {
	return (Date.now() + Math.floor(Math.random() * 1000)).toString();
}

export function formatDateTime(input: Date | string | number): string {
	const date = new Date(input);
	return date.toLocaleString("en-NG", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
		hour12: true,
	});
}
