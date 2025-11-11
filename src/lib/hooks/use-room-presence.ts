import * as Sentry from "@sentry/tanstackstart-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMe } from ".";

export type PresenceUser = {
	userId: string;
	name?: string;
	avatar?: string;
	online: boolean;
	typing?: boolean;
	lastSeen?: number;
	data?: Record<string, unknown>;
};

const HEARTBEAT_INTERVAL = 5000;
const UPDATE_DEBOUNCE = 300;

export function useRoomPresence(roomId: Id<"rooms">) {
	const [roomToken, setRoomToken] = useState<string | null>(null);
	const heartbeat = useMutation(api.presence.heartbeat);
	const update = useMutation(api.presence.update);
	const me = useMe();

	useEffect(() => {
		const initPresence = async () => {
			try {
				const result = await heartbeat({
					roomId,
					interval: HEARTBEAT_INTERVAL,
				});
				setRoomToken(result.roomToken);
			} catch (error) {
				console.error("Failed to initialize presence: ", error);
				Sentry.captureException(error);
			}
		};
		initPresence();
	}, [heartbeat, roomId]);

	useEffect(() => {
		if (!roomToken) return;

		const interval = setInterval(async () => {
			try {
				await heartbeat({
					roomId,
					interval: HEARTBEAT_INTERVAL,
				});
			} catch (error) {
				console.error("Heartbeat failed: ", error);
				Sentry.captureException(error);
			}
		}, HEARTBEAT_INTERVAL);

		return () => clearInterval(interval);
	}, [heartbeat, roomId, roomToken]);

	const presenceList = useQuery(api.presence.list, {
		roomToken: roomToken ? roomToken : "skip",
	});

	const updatePresence = useDebounceCallback(async (typing: boolean) => {
		try {
			await update({
				roomId,
				data: { typing },
			});
		} catch (error) {
			console.error("Failed to update room: ", error);
			Sentry.captureException(error);
		}
	}, UPDATE_DEBOUNCE);

	const presence = presenceList?.find((p) => p.userId === me?._id);
	const others = presenceList?.filter((p) => p.userId !== me?._id) ?? [];

	return {
		others,
		presence,
		updatePresence,
		isReady: !!roomToken,
	};
}
