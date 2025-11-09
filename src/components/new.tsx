import { useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePaginatedQuery } from "convex/react";
import {
	CheckCheck,
	Search,
	SquarePen,
	UserRound,
	UsersRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue, useMediaQuery } from "usehooks-ts";
import { z } from "zod";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { languages, useTranslations } from "@/lib/content";
import { getInitials } from "@/lib/helpers";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export function NewChat({ showMessage = false }) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)", {
		initializeWithValue: false,
	});
	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						variant="ghost"
						size={showMessage ? "lg" : "icon"}
						aria-label={t.app.newChatAria}
						className={showMessage ? "gap-2 font-medium" : ""}
					>
						<SquarePen className="size-5" />
						{showMessage && <span>{t.app.newChat}</span>}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[550px]">
					<DialogHeader className="space-y-3 pb-2">
						<DialogTitle className="text-2xl font-semibold tracking-tight">
							{t.newChat.createNewConversation}
						</DialogTitle>
						<DialogDescription className="text-base text-muted-foreground leading-relaxed">
							{t.newChat.chooseWhoToChat}
						</DialogDescription>
					</DialogHeader>
					<div className="py-2">
						<NewChatContent />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<Button
					variant="ghost"
					size={showMessage ? "lg" : "icon"}
					aria-label={t.app.newChatAria}
					className={showMessage ? "gap-2 font-medium" : ""}
				>
					<SquarePen className="size-5" />
					{showMessage && <span>{t.app.newChat}</span>}
				</Button>
			</DrawerTrigger>
			<DrawerContent className="px-4">
				<DrawerHeader className="space-y-2.5 text-left pb-2">
					<DrawerTitle className="text-2xl font-semibold tracking-tight">
						{t.newChat.createNewConversation}
					</DrawerTitle>
					<DrawerDescription className="text-base text-muted-foreground leading-relaxed">
						{t.newChat.chooseWhoToChat}
					</DrawerDescription>
				</DrawerHeader>
				<div className="py-2">
					<NewChatContent />
				</div>
			</DrawerContent>
		</Drawer>
	);
}

function NewChatContent() {
	const t = useTranslations();
	const [query, setQuery] = useDebounceValue("", 300, {
		leading: true,
	});
	const { isLoading, status, loadMore, results } = usePaginatedQuery(
		api.user.getPublicUsers,
		{ query },
		{ initialNumItems: 10 },
	);
	const mutationFn = useConvexMutation(api.room.createRoom);
	const navigate = useNavigate();

	const newChatSchema = z.object({
		memberIds: z
			.array(z.string())
			.min(1, { message: t.newChat.selectAtLeastOneUser }),
		name: z.string().min(2).max(100, { message: t.newChat.nameBetween2And100 }),
	});

	const form = useForm({
		defaultValues: { memberIds: [] as string[], name: "" },
		validators: {
			onSubmit: newChatSchema,
		},
		onSubmit: async ({ value }) => {
			toast.promise(
				mutationFn({
					...value,
					memberIds: value.memberIds as Id<"users">[],
				}),
				{
					loading: t.newChat.creatingConversation,
					success: (res) => {
						navigate({
							to: "/app/$roomId",
							params: {
								roomId: res,
							},
						});
					},
					error: (err) => (err as Error).message,
				},
			);
		},
	});
	const isGroup = form.state.values.memberIds.length > 1;

	const parentRef = useRef<HTMLDivElement>(null);
	const virtualizer = useVirtualizer({
		count: results.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 52,
		overscan: 5,
	});

	const virtualItems = virtualizer.getVirtualItems();

	useEffect(() => {
		const [lastItem] = [...virtualItems].reverse();
		if (!lastItem) return;

		if (
			lastItem.index >= results.length - 1 &&
			status === "CanLoadMore" &&
			!isLoading
		) {
			loadMore(10);
		}
	}, [virtualItems, results.length, status, isLoading, loadMore]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="w-full space-y-2"
		>
			<form.Field name="name">
				{(field) => {
					const isInvalid =
						field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field orientation={"responsive"} data-invalid={isInvalid}>
							<FieldLabel
								htmlFor={field.name}
								className="text-sm font-semibold"
							>
								{t.newChat.conversationName}
							</FieldLabel>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									{isGroup ? (
										<UsersRound className="size-4 text-muted-foreground" />
									) : (
										<UserRound className="size-4 text-muted-foreground" />
									)}
								</InputGroupAddon>
								<InputGroupInput
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder={t.newChat.conversationNamePlaceholder}
									className="text-sm"
									required
								/>
							</InputGroup>
							<FieldDescription className="text-xs text-muted-foreground leading-relaxed">
								{t.newChat.conversationNameDescription}
							</FieldDescription>
							{isInvalid && <FieldError errors={field.state.meta.errors} />}
						</Field>
					);
				}}
			</form.Field>
			<form.Field name="memberIds">
				{(field) => {
					const isInvalid =
						field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field orientation={"responsive"} data-invalid={isInvalid}>
							<FieldLabel
								htmlFor={field.name}
								className="text-sm font-semibold"
							>
								{t.newChat.addParticipants}
							</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Search className="size-4 text-muted-foreground" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder={t.newChat.searchUsers}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="text-sm"
								/>
								<InputGroupAddon align="inline-end">
									<span className="text-xs text-muted-foreground font-semibold tabular-nums">
										{results.length}
									</span>
								</InputGroupAddon>
							</InputGroup>
							<ScrollArea
								ref={parentRef}
								className="sm:h-[200px] h-[120px] rounded-lg border"
							>
								<ToggleGroup
									type="multiple"
									value={field.state.value}
									onValueChange={field.handleChange}
									spacing={0}
									orientation="vertical"
									className="p-1.5 w-full relative"
									aria-invalid={isInvalid}
									style={{ height: virtualizer.getTotalSize() }}
								>
									{status === "LoadingFirstPage" && <ChatLoading />}
									{virtualItems.map((virtualItem) => {
										const user = results[virtualItem.index];
										return (
											<ToggleGroupItem
												key={user._id}
												value={user._id}
												style={{
													transform: `translateY(${virtualItem.start}px)`,
												}}
												className="group w-full justify-start gap-2 p-2 h-auto rounded-md data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:bg-accent/50 transition-colors absolute top-0 left-0"
											>
												<div className="relative flex items-center justify-center border rounded-full size-10 bg-accent text-accent-foreground shrink-0 text-sm font-semibold">
													<Avatar className="group-data-[state=on]:hidden block">
														<AvatarImage src={user.avatar} alt={user.name} />
														<AvatarFallback className="text-sm font-semibold">
															{getInitials(user.name)}
														</AvatarFallback>
													</Avatar>
													<CheckCheck className="size-5 absolute inset-0 m-auto hidden group-data-[state=on]:block" />
												</div>
												<span className="text-sm font-semibold truncate leading-tight">
													{user.name}
												</span>
												<Badge variant={"outline"}>
													{
														languages.find(
															(lang) => lang.value === user.selectedLanguage,
														)?.flag
													}
												</Badge>
											</ToggleGroupItem>
										);
									})}
								</ToggleGroup>
							</ScrollArea>
							<FieldDescription className="text-xs text-muted-foreground leading-relaxed">
								<span className="font-semibold tabular-nums">
									{field.state.value.length}
								</span>{" "}
								{field.state.value.length === 1
									? t.common.user
									: t.common.users}{" "}
								{t.common.selected}
							</FieldDescription>
							{isInvalid && <FieldError errors={field.state.meta.errors} />}
						</Field>
					);
				}}
			</form.Field>
			<Button
				className="w-full font-semibold"
				variant={"secondary"}
				disabled={form.state.isSubmitting}
			>
				{form.state.isSubmitting ? <Spinner /> : t.newChat.createChat}
			</Button>
		</form>
	);
}

function ChatLoading() {
	return (
		<div className="p-1.5 w-full space-y-1.5">
			{new Array(6).fill(0).map((_, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: <index used for iteration>
					key={index}
					className="flex items-center gap-3.5 px-3 py-3 h-auto rounded-md"
				>
					<Skeleton className="size-11 rounded-full shrink-0" />
					<Skeleton className="h-4 w-32 flex-1" />
				</div>
			))}
		</div>
	);
}
