import { useAuth0 } from "@auth0/auth0-react";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Spinner } from "./ui/spinner";

export function useStoreUserEffect() {
	const { isLoading, isAuthenticated } = useConvexAuth();
	const [userId, setUserId] = useState<Id<"users"> | null>(null);
	const storeUser = useMutation(api.user.setUpUser);
	const [lang] = useLocalStorage(
		"lang",
		{ language: "en" },
		{ initializeWithValue: false },
	);

	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}
		async function createUser() {
			const id = await storeUser({ selectedLanguage: lang.language });
			setUserId(id);
		}
		createUser();
		return () => setUserId(null);
	}, [isAuthenticated, storeUser, lang.language]);

	return {
		isLoading: isLoading || (isAuthenticated && userId === null),
		isAuthenticated: isAuthenticated && userId !== null,
	};
}

export function AuthCheck() {
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
