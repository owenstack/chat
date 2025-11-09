import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslations } from "@/lib/content";
import { Button, buttonVariants } from "./ui/button";

export function NotFound({ children }: { children?: ReactNode }) {
	const t = useTranslations();
	return (
		<div className="space-y-2 p-2">
			<div className="text-gray-600 dark:text-gray-400">
				{children || <p>{t.notFound.pageNotFound}</p>}
			</div>
			<p className="flex items-center gap-2 flex-wrap">
				<Button onClick={() => window.history.back()}>{t.common.back}</Button>
				<Link to="/" className={buttonVariants({ variant: "link" })}>
					{t.notFound.takeMeHome}
				</Link>
			</p>
		</div>
	);
}
