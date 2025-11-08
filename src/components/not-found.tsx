import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "./ui/button";

export function NotFound({ children }: { children?: ReactNode }) {
	return (
		<div className="space-y-2 p-2">
			<div className="text-gray-600 dark:text-gray-400">
				{children || <p>Oops! The page you're looking for doesn't exist.</p>}
			</div>
			<p className="flex items-center gap-2 flex-wrap">
				<Button onClick={() => window.history.back()}>Go Back</Button>
				<Link to="/" className={buttonVariants({ variant: "link" })}>
					Take Me Home
				</Link>
			</p>
		</div>
	);
}
