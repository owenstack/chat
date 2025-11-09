import { useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import {
	CheckCheck,
	Search,
	SquarePen,
	UserRound,
	UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useDebounceValue,
	useIntersectionObserver,
	useMediaQuery,
} from "usehooks-ts";
import { z } from "zod";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { getInitials } from "@/lib/helpers";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const newChatSchema = z.object({
	memberIds: z
		.array(z.string())
		.min(1, { message: "Select at least one user" }),
	name: z
		.string()
		.min(2)
		.max(100, { message: "Name must be between 2 and 100 characters" }),
});

export function NewChat({ showMessage = false }) {
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
						aria-label="New chat"
						className={showMessage ? "gap-2 font-medium" : ""}
					>
						<SquarePen className="size-5" />
						{showMessage && <span>New Chat</span>}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[550px]">
					<DialogHeader className="space-y-3 pb-2">
						<DialogTitle className="text-2xl font-semibold tracking-tight">
							Create New Conversation
						</DialogTitle>
						<DialogDescription className="text-base text-muted-foreground leading-relaxed">
							Choose who you'd like to chat with - individuals or groups
						</DialogDescription>
					</DialogHeader>
					<div className="py-2">
						<NewChatContent />
					</div>
					<DialogFooter className="gap-2 pt-2">
						<DialogClose asChild>
							<Button variant="outline" className="font-medium">
								Cancel
							</Button>
						</DialogClose>
					</DialogFooter>
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
					aria-label="New chat"
					className={showMessage ? "gap-2 font-medium" : ""}
				>
					<SquarePen className="size-5" />
					{showMessage && <span>New Chat</span>}
				</Button>
			</DrawerTrigger>
			<DrawerContent className="px-4">
				<DrawerHeader className="space-y-2.5 text-left pb-2">
					<DrawerTitle className="text-2xl font-semibold tracking-tight">
						Create New Conversation
					</DrawerTitle>
					<DrawerDescription className="text-base text-muted-foreground leading-relaxed">
						Choose who you'd like to chat with - individuals or groups
					</DrawerDescription>
				</DrawerHeader>
				<div className="py-2">
					<NewChatContent />
				</div>
				<DrawerFooter className="gap-2 pt-4">
					<Button type="submit" className="font-medium">
						Create chat
					</Button>
					<DrawerClose asChild>
						<Button variant="outline" className="font-medium">
							Cancel
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function NewChatContent() {
	const [query, setQuery] = useDebounceValue("", 300, {
		leading: true,
	});
	const { isLoading, status, loadMore, results } = usePaginatedQuery(
		api.user.getPublicUsers,
		{ query },
		{ initialNumItems: 6 },
	);
	const mutationFn = useConvexMutation(api.room.createRoom);
	const navigate = useNavigate();
	const { ref, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
	});
	if (isIntersecting && status === "CanLoadMore" && !isLoading) {
		loadMore(6);
	}

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
					loading: "Creating your conversation...",
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

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="w-full space-y-5"
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
								Conversation Name
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
									placeholder="e.g., Weekend Plans"
									className="text-sm"
									required
								/>
							</InputGroup>
							<FieldDescription className="text-xs text-muted-foreground leading-relaxed">
								Choose a memorable name for this conversation
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
								Add Participants
							</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Search className="size-4 text-muted-foreground" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search users..."
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
							<ScrollArea className="h-[280px] rounded-lg border">
								<ToggleGroup
									type="multiple"
									value={field.state.value}
									onValueChange={field.handleChange}
									spacing={0}
									orientation="vertical"
									className="p-1.5 w-full"
									aria-invalid={isInvalid}
								>
									{status === "LoadingFirstPage" && <ChatLoading />}
									{results.map((user, index) => (
										<ToggleGroupItem
											key={user._id}
											value={user._id}
											ref={index === results.length - 1 ? ref : undefined}
											className="group w-full justify-start gap-3.5 px-3 py-3 h-auto rounded-md data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:bg-accent/50 transition-colors"
										>
											<div className="relative flex items-center justify-center border rounded-full size-11 bg-accent text-accent-foreground shrink-0 text-sm font-semibold">
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
										</ToggleGroupItem>
									))}
								</ToggleGroup>
							</ScrollArea>
							<FieldDescription className="text-xs text-muted-foreground leading-relaxed">
								<span className="font-semibold tabular-nums">
									{field.state.value.length}
								</span>{" "}
								{field.state.value.length === 1 ? "user" : "users"} selected
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
				{form.state.isSubmitting ? <Spinner /> : "Create Chat"}
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
