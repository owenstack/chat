import { useEffect } from "react";

export default (text: string, updateMyPresence: (typing: boolean) => void) => {
	useEffect(() => {
		if (text.length === 0) {
			updateMyPresence(false);
			return;
		}
		updateMyPresence(true);
		const timer = setTimeout(() => updateMyPresence(false), 1000);
		return () => clearTimeout(timer);
	}, [updateMyPresence, text]);
};
