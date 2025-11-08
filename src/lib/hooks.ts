import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useMe() {
	return useQuery(api.user.getMe, {});
}

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
