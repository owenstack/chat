import { useAuth0 } from "@auth0/auth0-react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
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
	const { isLoading, isAuthenticated } = useConvexAuth();
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
						{isLoading ? "Loading..." : "Authentication Required"}
					</DialogTitle>
					<DialogDescription className={isLoading ? "sr-only" : "mb-4"}>
						You must be signed in to access this content.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col items-center justify-center gap-2">
					{isLoading ? (
						<Spinner />
					) : (
						<Button variant={"secondary"} onClick={() => loginWithRedirect()}>
							Login
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
