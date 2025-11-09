import * as Sentry from "@sentry/tanstackstart-react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
	ErrorComponent,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from "@tanstack/react-router";
import { useTranslations } from "@/lib/content";
import { Button, buttonVariants } from "./ui/button";

export function ErrorBoundaryComponent({ error }: ErrorComponentProps) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});
	const t = useTranslations();

	return (
		<div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
			<ErrorComponent error={error} />
			<div className="flex gap-2 items-center flex-wrap">
				<Button
					onClick={() => {
						router.invalidate();
					}}
				>
					{t.common.tryAgain}
				</Button>
				{isRoot ? (
					<Link to="/" className={buttonVariants({ variant: "link" })}>
						{t.common.home}
					</Link>
				) : (
					<Link
						to="/"
						onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
							e.preventDefault();
							window.history.back();
						}}
						className={buttonVariants({ variant: "link" })}
					>
						{t.common.back}
					</Link>
				)}
			</div>
		</div>
	);
}

export const ErrorBoundary = Sentry.withErrorBoundary(ErrorBoundaryComponent, {
	fallback: (
		<p className="text-destructive font-semibold text-3xl">
			Internal Server Error
		</p>
	),
	showDialog: false,
});
