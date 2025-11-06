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
	const isDesktop = useMediaQuery("(min-width: 768px)");
	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						variant="ghost"
						size={showMessage ? "lg" : "icon"}
						aria-label="New chat"
					>
						<SquarePen className="size-5" />
						{showMessage && "Start new chat"}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[550px]">
					<DialogHeader className="space-y-3">
						<DialogTitle className="text-2xl font-semibold">
							New chat
						</DialogTitle>
						<DialogDescription className="text-base">
							Select users you want to chat with
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<NewChatContent />
					</div>
					<DialogFooter className="gap-2">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
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
				>
					<SquarePen className="size-5" />
					{showMessage && "Start new chat"}
				</Button>
			</DrawerTrigger>
			<DrawerContent className="px-4">
				<DrawerHeader className="space-y-2 text-left">
					<DrawerTitle className="text-2xl font-semibold">New chat</DrawerTitle>
					<DrawerDescription className="text-base">
						Select users you want to chat with
					</DrawerDescription>
				</DrawerHeader>
				<div className="py-4">
					<NewChatContent />
				</div>
				<DrawerFooter className="gap-2 pt-4">
					<Button type="submit">Create chat</Button>
					<DrawerClose asChild>
						<Button variant="outline">Cancel</Button>
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
		api.chat.getPublicUsers,
		{ query },
		{ initialNumItems: 6 },
	);
	const mutationFn = useConvexMutation(api.chat.createRoom);
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
					loading: "Creating new chat room...",
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
			className="w-full space-y-6"
		>
			<form.Field name="name">
				{(field) => {
					const isInvalid =
						field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field orientation={"responsive"} data-invalid={isInvalid}>
							<FieldLabel htmlFor={field.name} className="text-sm font-medium">
								Chat name
							</FieldLabel>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									{isGroup ? (
										<UsersRound className="size-4" />
									) : (
										<UserRound className="size-4" />
									)}
								</InputGroupAddon>
								<InputGroupInput
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder="e.g., Team Discussion"
									className="text-sm"
									required
								/>
							</InputGroup>
							<FieldDescription className="text-xs">
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
							<FieldLabel htmlFor={field.name} className="text-sm font-medium">
								Participants
							</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Search className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search users..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="text-sm"
								/>
								<InputGroupAddon align="inline-end">
									<span className="text-xs text-muted-foreground font-medium">
										{results.length}
									</span>
								</InputGroupAddon>
							</InputGroup>
							<ScrollArea className="h-[280px] rounded-md border">
								<ToggleGroup
									type="multiple"
									value={field.state.value}
									onValueChange={field.handleChange}
									spacing={0}
									orientation="vertical"
									className="p-1 w-full"
									aria-invalid={isInvalid}
								>
									{results.map((user, index) => (
										<ToggleGroupItem
											key={user._id}
											value={user._id}
											ref={index === results.length - 1 ? ref : undefined}
											className="w-full justify-start gap-3 px-3 py-2.5 h-auto rounded-sm data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:bg-accent/50"
										>
											<div className="relative flex items-center justify-center border rounded-full size-10 bg-accent text-accent-foreground shrink-0 text-sm font-medium">
												<span className="data-[state=on]:opacity-0">
													{getInitials(user.name)}
												</span>
												<CheckCheck className="size-5 absolute inset-0 m-auto hidden data-[state=on]:block" />
											</div>
											<span className="text-sm font-medium truncate">
												{user.name}
											</span>
										</ToggleGroupItem>
									))}
								</ToggleGroup>
							</ScrollArea>
							<FieldDescription className="text-xs">
								{field.state.value.length}{" "}
								{field.state.value.length === 1 ? "user" : "users"} selected
							</FieldDescription>
							{isInvalid && <FieldError errors={field.state.meta.errors} />}
						</Field>
					);
				}}
			</form.Field>
			<Button
				className="w-full"
				variant={"secondary"}
				disabled={form.state.isSubmitting}
			>
				{form.state.isSubmitting ? <Spinner /> : "Create chat →"}
			</Button>
		</form>
	);
}
