import { Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

export function Logo({ className }: { className?: string }) {
	return (
		<Link to="/" className={cn(buttonVariants({ size: "icon-lg" }), className)}>
			<Languages className="size-fit" />
		</Link>
	);
}
