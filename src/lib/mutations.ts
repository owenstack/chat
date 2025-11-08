import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { uid } from "./helpers";
import { useMe } from "./hooks";

export function useSendMessage() {
	const me = useMe();
	const tempIdRef = useRef<string | null>(null);
	const queryClient = useQueryClient();

	const mutationFn = useConvexMutation(
		api.chat.sendMessage,
	).withOptimisticUpdate((localStore, args) => {
		if (!me) return;
		const tempId = `temp-${uid()}` as Id<"messages">;
		tempIdRef.current = tempId;
		const tempMessage = {
			_id: tempId,
			authorId: me._id,
			roomId: args.roomId,
			originalText: args.message,
			sourceLanguage: args.sourceLanguage,
			createdAt: Date.now(),
			status: "sending" as const,
			isUserMessage: true,
		};

		const queryArgs = {
			roomId: args.roomId as Id<"rooms">,
			paginationOpts: { numItems: 10, cursor: null },
		};

		const previousMessages = localStore.getQuery(
			api.chat.getMessages,
			queryArgs,
		);

		if (previousMessages) {
			localStore.setQuery(api.chat.getMessages, queryArgs, {
				...previousMessages,
				page: [tempMessage, ...previousMessages.page],
			});
		}
	});

	return useMutation({
		mutationFn,
		onSuccess: (_newId, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["messages", variables.roomId],
			});
		},
	});
}
