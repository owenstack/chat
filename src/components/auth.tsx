import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/content";
import { useStoreUserEffect } from "@/lib/hooks";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Spinner } from "./ui/spinner";

export function AuthCheck() {
	const t = useTranslations();
	const { isLoading, isAuthenticated } = useStoreUserEffect();
	const { loginWithRedirect } = useAuth0();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(!isLoading && !isAuthenticated);
	}, [isLoading, isAuthenticated]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isLoading ? t.common.loading : t.auth.authenticationRequired}
					</DialogTitle>
					<DialogDescription className={isLoading ? "sr-only" : "mb-4"}>
						{t.auth.mustBeSignedIn}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col items-center justify-center gap-2">
					{isLoading ? (
						<Spinner />
					) : (
						<Button variant={"secondary"} onClick={() => loginWithRedirect()}>
							{t.common.login}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
